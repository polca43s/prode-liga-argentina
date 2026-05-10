import { Request, Response, Router } from 'express';
import { AppDataSource } from '../index';
import { Fixture } from '../entities/Fixture';
import { Prediction } from '../entities/Prediction';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const getFixtureRepository = () => AppDataSource.getRepository(Fixture);

// Rutas protegidas - cualquier usuario autenticado
router.get('/tournament/:tournamentId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { tournamentId } = req.params;
    const fixtures = await getFixtureRepository().find({
      where: { tournament: { id: tournamentId as string } },
      relations: ['partidos', 'partidos.local', 'partidos.visitante'],
      order: { createdAt: 'ASC' }
    });
    
    // Ordenar partidos por el campo 'orden' en cada fixture
    fixtures.forEach(f => {
      if (f.partidos) {
        f.partidos.sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0));
      }
    });
    
    res.json(fixtures || []);
  } catch (error: any) {
    console.error('Error al obtener fechas:', error);
    res.json([]);
  }
});

// Rutas protegidas - solo admin
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const fixture = getFixtureRepository().create(req.body);
    const result = await getFixtureRepository().save(fixture);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await getFixtureRepository().update(id as string, req.body);
    const updated = await getFixtureRepository().findOneBy({ id: id as string });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const predictionRepo = AppDataSource.getRepository(Prediction);
    const predictions = await predictionRepo.find({ where: { fixture: { id: id as string } } });
    if (predictions.length > 0) {
      await predictionRepo.remove(predictions);
    }

    await getFixtureRepository().delete(id as string);
    res.json({ message: 'Fixture y jugadas eliminadas correctamente' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
