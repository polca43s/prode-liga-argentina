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
      .where('fixture.tournamentId = :tournamentId', { tournamentId: id })
      .getMany();

    // Eliminar predictions de cada fixture usando la relación correcta
    for (const fixture of fixtures) {
      await queryRunner.manager
        .getRepository(Prediction)
        .createQueryBuilder('prediction')
        .delete()
        .where('prediction.fixture = :fixtureId', { fixtureId: fixture.id })
        .execute();
    }

    // Eliminar fixtures
    await queryRunner.manager
      .getRepository(Fixture)
      .createQueryBuilder('fixture')
      .delete()
      .where('fixture.tournamentId = :tournamentId', { tournamentId: id })
      .execute();

    // Eliminar torneo
    await queryRunner.manager
      .getRepository(Tournament)
      .createQueryBuilder('tournament')
      .delete()
      .where('tournament.id = :id', { id })
      .execute();

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
