// server/src/controllers/FixtureController.ts
import { Request, Response, Router } from 'express';
import { AppDataSource } from '../index';
import { Fixture } from '../entities/Fixture';
import { Prediction } from '../entities/Prediction';

const router = Router();
const getFixtureRepository = () => AppDataSource.getRepository(Fixture);

router.get('/tournament/:tournamentId', async (req: Request, res: Response) => {
  try {
    const { tournamentId } = req.params;
    const fixtures = await getFixtureRepository().find({
      where: { tournament: { id: tournamentId as string } },
      relations: ['partidos', 'partidos.local', 'partidos.visitante'],
      order: { createdAt: 'ASC' }
    });
    res.json(fixtures || []);
  } catch (error: any) {
    console.error('Error al obtener fechas:', error);
    res.json([]);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const fixture = getFixtureRepository().create(req.body);
    const result = await getFixtureRepository().save(fixture);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await getFixtureRepository().update(id as string, req.body);
    const updated = await getFixtureRepository().findOneBy({ id: id as string });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
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
