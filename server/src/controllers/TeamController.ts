import { Request, Response, Router } from 'express';
import { AppDataSource } from '../index';
import { Team } from '../entities/Team';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const getTeamRepository = () => AppDataSource.getRepository(Team);

// Rutas protegidas - cualquier usuario autenticado
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const teams = await getTeamRepository().find({
      order: { nombre: 'ASC' }
    });
    res.json(teams || []);
  } catch (error: any) {
    console.error('Error al listar equipos:', error);
    res.json([]);
  }
});

// Rutas protegidas - solo admin
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { nombre, ciudad, escudo } = req.body;
    
    const team = new Team();
    team.nombre = nombre;
    team.ciudad = ciudad;
    team.escudo = escudo;

    const result = await getTeamRepository().save(team);
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
    res.json({ message: 'Equipo eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
