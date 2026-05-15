import { Request, Response, Router } from 'express';
import { AppDataSource } from '../index';
import { Tournament } from '../entities/Tournament';
import { Fixture } from '../entities/Fixture';
import { Prediction } from '../entities/Prediction';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const getTournamentRepository = () => AppDataSource.getRepository(Tournament);
const getFixtureRepository = () => AppDataSource.getRepository(Fixture);
const getPredictionRepository = () => AppDataSource.getRepository(Prediction);

// Rutas protegidas - cualquier usuario autenticado
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const tournamentRepo = getTournamentRepository();
    const tournaments = await tournamentRepo.find({
      relations: ['users', 'teams'],
      order: { createdAt: 'DESC' }
    });
    res.json(tournaments || []);
  } catch (error: any) {
    console.error('Error al listar torneos:', error);
    res.json([]);
  }
});

router.get('/:id/teams', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tournament = await getTournamentRepository().findOne({
      where: { id: id as string },
      relations: ['teams']
    });
    res.json(tournament?.teams || []);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/user/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const tournaments = await getTournamentRepository().find({
      where: { users: { id: userId as string } },
      order: { nombre: 'ASC' }
    });
    res.json(tournaments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Rutas protegidas - solo admin
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion, users, teams, cantidadDobles } = req.body;
    const tournament = getTournamentRepository().create({
      nombre,
      descripcion,
      cantidadDobles,
      users: users || [],
      teams: teams || []
    });
    const result = await getTournamentRepository().save(tournament);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, users, teams, cantidadDobles } = req.body;
    
    const tournament = await getTournamentRepository().findOne({
      where: { id: id as string },
      relations: ['users', 'teams']
    });

    if (tournament) {
      tournament.nombre = nombre;
      tournament.descripcion = descripcion;
      if (cantidadDobles !== undefined) tournament.cantidadDobles = cantidadDobles;
      if (users) tournament.users = users;
      if (teams) tournament.teams = teams;
      
      const updated = await getTournamentRepository().save(tournament);
      res.json(updated);
    } else {
      res.status(404).json({ message: 'Torneo no encontrado' });
    }
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  
  try {
    const { id } = req.params;
    
    await queryRunner.startTransaction();

    // Obtener todos los fixtures del torneo
    const fixtures = await queryRunner.manager
      .getRepository(Fixture)
      .createQueryBuilder('fixture')
      .select(['fixture.id'])
      .where('fixture.tournamentId = :tournamentId', { tournamentId: id })
      .getMany();

    const fixtureIds = fixtures.map(f => f.id);

    if (fixtureIds.length > 0) {
      const placeholders = fixtureIds.map((_, i) => `$${i + 1}`).join(', ');
      
      // Eliminar prediction_details primero
      await queryRunner.query(
        `DELETE FROM prediction_details WHERE "predictionId" IN (
          SELECT id FROM predictions WHERE "fixtureId" IN (${placeholders})
        )`,
        fixtureIds
      );

      // Eliminar predictions
      await queryRunner.query(
        `DELETE FROM predictions WHERE "fixtureId" IN (${placeholders})`,
        fixtureIds
      );

      // Eliminar fixtures
      await queryRunner.query(
        `DELETE FROM fixtures WHERE "tournamentId" = $1`,
        [id]
      );
    } else {
      // Eliminar fixtures también si no hay predictions
      await queryRunner.query(
        `DELETE FROM fixtures WHERE "tournamentId" = $1`,
        [id]
      );
    }

    // Eliminar torneo
    await queryRunner.query(
      `DELETE FROM tournaments WHERE id = $1`,
      [id]
    );

    await queryRunner.commitTransaction();
    res.json({ message: 'Torneo eliminado correctamente' });
  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    console.error('Error al eliminar torneo:', error);
    res.status(500).json({ message: error.message });
  } finally {
    await queryRunner.release();
  }
});

export default router;
