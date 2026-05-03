// server/src/controllers/MatchController.ts
import { Request, Response, Router } from 'express';
import { AppDataSource } from '../index';
import { Match } from '../entities/Match';

const router = Router();
const getMatchRepository = () => AppDataSource.getRepository(Match);

router.post('/', async (req: Request, res: Response) => {
  try {
    const match = getMatchRepository().create(req.body);
    const result = await getMatchRepository().save(match);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resultado } = req.body; // 'L', 'E', 'V' o null
    await getMatchRepository().update(id as string, { resultado });
    const updated = await getMatchRepository().findOneBy({ id: id as string });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await getMatchRepository().delete(id);
    res.json({ message: 'Partido eliminado' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
