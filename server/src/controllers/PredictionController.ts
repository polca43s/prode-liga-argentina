import { Request, Response, Router } from 'express';
import { AppDataSource } from '../index';
import { Prediction } from '../entities/Prediction';
import { PredictionDetail } from '../entities/PredictionDetail';
import { Fixture } from '../entities/Fixture';
import { User } from '../entities/User';
import { Tournament } from '../entities/Tournament';
import { Standing } from '../entities/Standing';
import { Like, In } from 'typeorm';

import { authMiddleware } from '../middlewares/authMiddleware';
import { MailService } from '../services/MailService';

const router = Router();
const mailService = new MailService();
const getPredictionRepository = () => AppDataSource.getRepository(Prediction);
const getDetailRepository = () => AppDataSource.getRepository(PredictionDetail);

// Caché para búsquedas (6 horas)
const SEARCH_CACHE_DURATION = 6 * 60 * 60 * 1000;
const searchCache = new Map<string, { data: any, expires: number }>();

// Guardar o Actualizar Jugada (Protegido)
router.post('/', authMiddleware, async (req: any, res: Response) => {
  try {
    const { fixtureId, detalles } = req.body;
    const userId = req.user.id; // Usamos el ID del TOKEN, no del body

    // Verificar si la jugada está bloqueada (seeAll === true)
    const fixture = await AppDataSource.getRepository(Fixture).findOneBy({ id: fixtureId });
    if (fixture?.seeAll) {
      return res.status(403).json({ message: 'La jugada ya está cerrada y no se puede modificar.' });
    }

    // Buscar si ya existe una jugada de este usuario para este fixture
    let prediction = await getPredictionRepository().findOne({
      where: { user: { id: userId as string }, fixture: { id: fixtureId as string } },
      relations: ['detalles']
    });

    if (!prediction) {
      prediction = getPredictionRepository().create({
        user: { id: userId as string } as any,
        fixture: { id: fixtureId as string } as any,
        puntosTotales: 0
      });
      await getPredictionRepository().save(prediction);
    }

    // Guardar detalles (pronósticos de cada partido)
    // Borramos los anteriores para simplificar el update
    if (prediction.detalles) {
      await getDetailRepository().remove(prediction.detalles);
    }

    const newDetails = detalles.map((d: any) => {
      return getDetailRepository().create({
        prediction: { id: prediction?.id },
        match: { id: d.matchId },
        seleccion: d.seleccion
      });
    });

    await getDetailRepository().save(newDetails);

    // Enviar comprobante por email en segundo plano (asíncrono para no demorar la respuesta)
    getPredictionRepository().findOne({
      where: { id: prediction.id },
      relations: ['user', 'fixture', 'detalles', 'detalles.match', 'detalles.match.local', 'detalles.match.visitante']
    }).then((fullPrediction: any) => {
      if (fullPrediction && fullPrediction.detalles) {
        // Ordenar detalles por el orden del partido
        fullPrediction.detalles.sort((a: any, b: any) => (a.match?.orden || 0) - (b.match?.orden || 0));
        mailService.sendPredictionConfirmation(fullPrediction.user, fullPrediction.fixture, fullPrediction.detalles);
      }
    }).catch(err => console.error("Error enviando comprobante de jugada:", err));

    res.status(201).json({ message: 'Jugada guardada con éxito' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener mi jugada de un fixture específico (Protegido)
router.get('/my/:fixtureId', authMiddleware, async (req: any, res: Response) => {
  try {
    const { fixtureId } = req.params;
    const userId = req.user.id; // Extraído del token

    const prediction = await getPredictionRepository().findOne({
      where: { user: { id: userId as string }, fixture: { id: fixtureId as string } },
      relations: ['detalles', 'detalles.match', 'detalles.match.local', 'detalles.match.visitante']
    });
    res.json(prediction);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// BUSCADOR: Buscar jugadas de otros (Solo si seeAll es true Y countThis es true)
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query, fixtureId } = req.query;
    const cacheKey = `${fixtureId}-${query}`;

    // 1. Intentar obtener de la caché
    const cached = searchCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      console.log('Sirviendo búsqueda desde la caché ⚡');
      return res.json(cached.data);
    }

    const fixture = await AppDataSource.getRepository(Fixture).findOne({
      where: { id: fixtureId as string },
      relations: ['tournament']
    });

    if (!fixture) {
      return res.status(404).json({ message: 'Fecha no encontrada' });
    }

    // Verificar que la fecha esté cerrada Y cuente para el ranking
    if (!fixture.seeAll || !fixture.countThis) {
      return res.status(403).json({ message: 'Aún no puedes ver las jugadas de los demás.' });
    }

    const whereCondition: any = { fixture: { id: fixtureId as string } };
    
    // Si hay búsqueda, agregar filtro por usuario
    if (query) {
      whereCondition.user = [
        { nickname: Like(`%${query}%`) },
        { nombre: Like(`%${query}%`) },
        { mail: Like(`%${query}%`) }
      ];
    }

    const predictions = await getPredictionRepository().find({
      where: whereCondition,
      relations: ['user', 'detalles', 'detalles.match', 'detalles.match.local', 'detalles.match.visitante']
    });

    // Ordenar detalles de cada predicción por el campo 'orden' del match
    predictions.forEach((p: any) => {
      if (p.detalles) {
        p.detalles.sort((a: any, b: any) => (a.match?.orden || 0) - (b.match?.orden || 0));
      }
    });

    // Mapear para calcular puntos y estadísticas L/E/V
    const result = predictions.map(p => {
      let puntos = 0;
      let countL = 0;
      let countE = 0;
      let countV = 0;

      p.detalles.forEach((d: any) => {
        if (d.seleccion.includes('L')) countL++;
        if (d.seleccion.includes('E')) countE++;
        if (d.seleccion.includes('V')) countV++;

        // Solo contar punto si hay resultado Y la selección incluye ese resultado
        if (d.match?.resultado && d.seleccion.includes(d.match.resultado)) {
          puntos++;
        }
      });

      return {
        ...p,
        puntos,
        stats: { L: countL, E: countE, V: countV }
      };
    });

    // Ordenar por puntos, luego visitante, empate, local
    result.sort((a, b) => {
      if ((b.puntos || 0) !== (a.puntos || 0)) return (b.puntos || 0) - (a.puntos || 0);
      if ((b.stats?.V || 0) !== (a.stats?.V || 0)) return (b.stats?.V || 0) - (a.stats?.V || 0);
      if ((b.stats?.E || 0) !== (a.stats?.E || 0)) return (b.stats?.E || 0) - (a.stats?.E || 0);
      return (b.stats?.L || 0) - (a.stats?.L || 0);
    });

    // 2. Guardar en la caché
    searchCache.set(cacheKey, {
      data: result,
      expires: Date.now() + SEARCH_CACHE_DURATION
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// RANKING GENERAL DEL TORNEO (Desde Tabla Standing)
router.get('/ranking/tournament/:tournamentId', async (req: Request, res: Response) => {
  try {
    const { tournamentId } = req.params;
    const cacheKey = `ranking-${tournamentId}`;

    // 1. Intentar obtener de la caché
    const cached = searchCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return res.json(cached.data);
    }

    const ranking = await AppDataSource.getRepository(Standing).find({
      where: { tournament: { id: tournamentId as string } },
      relations: ['user'],
      order: { puntos: 'DESC', fechasGanadas: 'DESC', visita: 'DESC', empate: 'DESC', local: 'DESC' }
    });

    // 2. Guardar en la caché (6 horas)
    searchCache.set(cacheKey, {
      data: ranking,
      expires: Date.now() + SEARCH_CACHE_DURATION
    });

    res.json(ranking);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// RECALCULAR Y GUARDAR STANDINGS
router.post('/recalculate/:tournamentId', async (req: Request, res: Response) => {
  try {
    const { tournamentId } = req.params;

    // 1. Obtener Tournament para el nombre
    const tournament = await AppDataSource.getRepository(Tournament).findOneBy({ id: tournamentId as string });
    if (!tournament) return res.status(404).json({ message: 'Torneo no encontrado' });

    // 2. Obtener los fixtures del torneo que cuentan para el ranking (countThis = true)
    const fixturesQueCuentan = await AppDataSource.getRepository(Fixture).find({
      where: { tournament: { id: tournamentId as string }, countThis: true }
    });

    if (fixturesQueCuentan.length === 0) {
      return res.status(400).json({ message: 'No hay fechas que cuenten para el ranking. Activa al menos una.' });
    }

    const fixtureIdsQueCuentan = fixturesQueCuentan.map(f => f.id);

    // 3. Obtener todas las predicciones del torneo (solo de fixtures con countThis = true)
    const predictions = await getPredictionRepository()
      .createQueryBuilder('prediction')
      .innerJoinAndSelect('prediction.fixture', 'fixture')
      .innerJoinAndSelect('prediction.user', 'user')
      .leftJoinAndSelect('prediction.detalles', 'detalles')
      .leftJoinAndSelect('detalles.match', 'match')
      .where('fixture.id IN (:...fixtureIds)', { fixtureIds: fixtureIdsQueCuentan })
      .getMany();

    const userStats: any = {};
    const fixtureWinners: any = {};

    predictions.forEach(p => {
      const uid = p.user.id;
      if (!userStats[uid]) {
        userStats[uid] = {
          user: p.user,
          puntos: 0,
          fechasGanadas: 0,
          predV: 0,
          predE: 0,
          predL: 0,
          fixtureScores: {}
        };
      }

      let currentFixturePoints = 0;
      p.detalles.forEach(d => {
        // Contar la cantidad de veces que el usuario pronosticó cada resultado
        if (d.seleccion.includes('V')) userStats[uid].predV++;
        if (d.seleccion.includes('E')) userStats[uid].predE++;
        if (d.seleccion.includes('L')) userStats[uid].predL++;

        // Contar puntos solo si acertó
        if (d.match.resultado && d.seleccion.includes(d.match.resultado)) {
          currentFixturePoints++;
        }
      });

      userStats[uid].puntos += currentFixturePoints;
      userStats[uid].fixtureScores[p.fixture.id] = currentFixturePoints;

      const fid = p.fixture.id;
      if (!fixtureWinners[fid] || currentFixturePoints > fixtureWinners[fid]) {
        fixtureWinners[fid] = currentFixturePoints;
      }
    });

    // 3. Guardar en la tabla Standings
    const standingRepo = AppDataSource.getRepository(Standing);
    for (const uid of Object.keys(userStats)) {
      const stat = userStats[uid];

      // Calcular fechas ganadas
      let fGanadas = 0;
      Object.keys(stat.fixtureScores).forEach(fid => {
        if (stat.fixtureScores[fid] === fixtureWinners[fid] && fixtureWinners[fid] > 0) {
          fGanadas++;
        }
      });

      const standingId = `${tournament.nombre}-${stat.user.nickname}`;

      let standing = await standingRepo.findOneBy({ id: standingId });
      if (!standing) {
        standing = standingRepo.create({
          id: standingId,
          tournament,
          user: stat.user,
          tournamentName: tournament.nombre,
          nickname: stat.user.nickname
        });
      }

      standing.tournamentName = tournament.nombre;
      standing.nickname = stat.user.nickname;
      standing.playerName = stat.user.nombre;
      standing.puntos = stat.puntos;
      standing.fechasGanadas = fGanadas;
      standing.visita = stat.predV;
      standing.empate = stat.predE;
      standing.local = stat.predL;
      standing.lastUpdate = new Date();

      await standingRepo.save(standing);
    }

    // 4. Invalidar la caché de Ranking para este torneo
    searchCache.delete(`ranking-${tournamentId}`);

    res.json({ message: 'Posiciones actualizadas correctamente' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
