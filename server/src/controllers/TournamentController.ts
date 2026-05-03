import { Request, Response, Router } from 'express';
import { AppDataSource } from '../index';
import { Tournament } from '../entities/Tournament';

const router = Router();
const getTournamentRepository = () => AppDataSource.getRepository(Tournament);

// Obtener todos los torneos (para admin)
router.get('/', async (req: Request, res: Response) => {
  try {
    const tournamentRepo = getTournamentRepository();
    const tournaments = await tournamentRepo.find({
      relations: ['users', 'teams'],
      order: { createdAt: 'DESC' }
    });
    res.json(tournaments || []);
  } catch (error: any) {
    console.error('Error al listar torneos:', error);
    // Si falla por falta de relaciones (tablas nuevas), devolvemos array vacío para no romper el front
    res.json([]);
  }
});

// Obtener torneos de un usuario específico
router.get('/user/:userId', async (req: Request, res: Response) => {
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

// Crear un torneo
router.post('/', async (req: Request, res: Response) => {
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

// Actualizar un torneo
router.put('/:id', async (req: Request, res: Response) => {
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

// Eliminar un torneo
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await getTournamentRepository().delete(id);
    res.json({ message: 'Torneo eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
