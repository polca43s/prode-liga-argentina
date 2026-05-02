import { Request, Response, Router } from 'express';
import { AuthService } from '../services/AuthService';
import { AppDataSource } from '../index';
import { User } from '../entities/User';

const router = Router();
const authService = new AuthService();
const getUserRepository = () => AppDataSource.getRepository(User);

// Registro de usuario
router.post('/register', async (req: Request, res: Response) => {
  try {
    const user = await authService.register(req.body);
    // @ts-ignore
    delete user.password;
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { mailOrNickname, password } = req.body;
    const result = await authService.login(mailOrNickname, password);
    // @ts-ignore
    delete result.user.password;
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
});

// Obtener todos los usuarios (Solo Admin - Implementar middleware de auth después)
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await getUserRepository().find();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
