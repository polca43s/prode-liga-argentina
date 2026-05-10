import { Request, Response, Router } from 'express';
import { AuthService } from '../services/AuthService';
import { AppDataSource } from '../index';
import { User } from '../entities/User';
import { MailService } from '../services/MailService';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const router = Router();
const authService = new AuthService();
const mailService = new MailService();
const getUserRepository = () => AppDataSource.getRepository(User);

// Rutas públicas
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

// Rutas protegidas - cualquier usuario autenticado
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const users = await getUserRepository().find();
    res.json(users || []);
  } catch (error: any) {
    console.error('Error al obtener usuarios:', error);
    res.json([]);
  }
});

// Rutas protegidas - solo admin
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await getUserRepository().update(id as string, req.body);
    const updatedUser = await getUserRepository().findOneBy({ id: id as string });
    res.json(updatedUser);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const predictionRepo = AppDataSource.getRepository('Prediction');
    const detailRepo = AppDataSource.getRepository('PredictionDetail');
    const standingRepo = AppDataSource.getRepository('Standing');
    
    const user = await getUserRepository().findOne({
      where: { id: id as string },
      relations: ['tournaments']
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user.tournaments = [];
    await getUserRepository().save(user);

    await standingRepo.delete({ user: { id: id as string } });

    const userPredictions = await predictionRepo.find({ where: { user: { id: id as string } } });
    if (userPredictions.length > 0) {
      const predictionIds = userPredictions.map((p: any) => p.id);
      
      await detailRepo.createQueryBuilder()
        .delete()
        .where("predictionId IN (:...ids)", { ids: predictionIds })
        .execute();
      
      await predictionRepo.createQueryBuilder()
        .delete()
        .where("id IN (:...ids)", { ids: predictionIds })
        .execute();
    }

    await getUserRepository().delete(id);
    
    res.json({ message: 'Usuario y todo su historial eliminados correctamente' });
  } catch (error: any) {
    console.error('Error borrando usuario:', error);
    res.status(500).json({ message: error.message });
  }
});

// Solicitar recuperación de contraseña
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    let { email } = req.body;
    if (!email) return res.status(400).json({ message: 'El email es requerido' });

    email = email.trim().toLowerCase();
    const user = await getUserRepository().findOneBy({ mail: email });

    // Siempre responder OK para no revelar si el email existe
    if (!user) {
      return res.json({ message: 'Si el email existe, recibirás un link de recuperación.' });
    }

    // Generar token seguro
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    user.resetToken = token;
    user.resetTokenExpiry = expiry;
    await getUserRepository().save(user);

    // Enviar email en segundo plano (sin esperar)
    mailService.sendPasswordResetEmail(user, token).catch(err => {
      console.error('Error al enviar email de recuperación:', err);
    });

    res.json({ message: 'Si el email existe, recibirás un link de recuperación.' });
  } catch (error: any) {
    console.error('Error en forgot-password:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
});

// Restablecer la contraseña con el token
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token y nueva contraseña son requeridos' });
    }

    const user = await getUserRepository().findOneBy({ resetToken: token });

    if (!user) {
      return res.status(400).json({ message: 'El link de recuperación no es válido.' });
    }

    if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      return res.status(400).json({ message: 'El link ha expirado. Solicita uno nuevo.' });
    }

    // Actualizar contraseña y limpiar el token
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null as any;
    user.resetTokenExpiry = null as any;
    await getUserRepository().save(user);

    res.json({ message: 'Contraseña restablecida correctamente. Ya podés iniciar sesión.' });
  } catch (error: any) {
    console.error('Error en reset-password:', error);
    res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
});

export default router;
