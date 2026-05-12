import { Request, Response, Router } from 'express';
import { AppDataSource } from '../index';
import { Team } from '../entities/Team';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const getTeamRepository = () => AppDataSource.getRepository(Team);

const teamsCache = new Map<string, { data: any, expires: number }>();
const CACHE_DURATION = 6 * 60 * 60 * 1000;

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const cacheKey = 'all-teams';
    const cached = teamsCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return res.json(cached.data);
    }

    const teams = await getTeamRepository().find({ order: { nombre: 'ASC' } });
    teamsCache.set(cacheKey, { data: teams, expires: Date.now() + CACHE_DURATION });
    res.json(teams || []);
  } catch (error: any) {
    console.error('Error al listar equipos:', error);
    res.json([]);
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { nombre, ciudad, escudo } = req.body;
    
    const team = new Team();
    team.nombre = nombre;
    team.ciudad = ciudad;
    team.escudo = escudo;

    const result = await getTeamRepository().save(team);
    teamsCache.delete('all-teams');
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error al crear equipo:', error);
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, ciudad, escudo } = req.body;
    
    const team = await getTeamRepository().findOneBy({ id: id as string });
    if (team) {
      if (nombre) team.nombre = nombre;
      if (ciudad !== undefined) team.ciudad = ciudad;
      if (escudo !== undefined) team.escudo = escudo;
      
      const updated = await getTeamRepository().save(team);
      teamsCache.delete('all-teams');
      res.json(updated);
    } else {
      res.status(404).json({ message: 'Equipo no encontrado' });
    }
  } catch (error: any) {
    console.error('Error al actualizar equipo:', error);
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await getTeamRepository().delete(id);
    teamsCache.delete('all-teams');
    res.json({ message: 'Equipo eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;