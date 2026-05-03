import { Request, Response, Router } from 'express';
import { AppDataSource } from '../index';
import { Team } from '../entities/Team';

const router = Router();
const getTeamRepository = () => AppDataSource.getRepository(Team);

// Obtener todos los equipos
router.get('/', async (req: Request, res: Response) => {
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

// Crear un equipo
router.post('/', async (req: Request, res: Response) => {
  try {
    const { nombre, ciudad, escudo } = req.body;
    console.log('Intentando crear equipo con escudo:', escudo);
    
    const team = new Team();
    team.nombre = nombre;
    team.ciudad = ciudad;
    team.escudo = escudo; // Asignación directa

    const result = await getTeamRepository().save(team);
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error al crear equipo:', error);
    res.status(400).json({ message: error.message });
  }
});

// Actualizar un equipo
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, ciudad, escudo } = req.body;
    console.log(`Actualizando equipo ${id} con escudo:`, escudo);
    
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

// Eliminar un equipo
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await getTeamRepository().delete(id);
    res.json({ message: 'Equipo eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
// Forzando reinicio de controlador - v2
