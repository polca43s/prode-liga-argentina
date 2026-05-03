import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../index';
import { User, UserRole } from '../entities/User';
import { MailService } from './MailService';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export class AuthService {
  private get userRepository() {
    return AppDataSource.getRepository(User);
  }
  private mailService = new MailService();

  async register(userData: any) {
    let { mail, password, ...rest } = userData;
    
    // Normalizar email
    if (mail) {
      mail = mail.trim().toLowerCase();
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = this.userRepository.create({
      ...rest,
      mail,
      password: hashedPassword
    });

    const savedUser = await this.userRepository.save(user);
    
    // Enviar mail de bienvenida de forma asíncrona (no bloqueante)
    this.mailService.sendWelcomeEmail(savedUser);

    return savedUser;
  }

  async login(mailOrNickname: string, password: string) {
    const identifier = mailOrNickname.trim().toLowerCase();
    
    const user = await this.userRepository.findOne({
      where: [
        { mail: identifier },
        { nickname: identifier }
      ]
    });

    if (!user) throw new Error('Usuario no encontrado');

    if (!user.active) throw new Error('Cuenta desactivada. Contacta al administrador.');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error('Contraseña incorrecta');

    const token = jwt.sign(
      { id: user.id, role: user.tipo },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return { user, token };
  }
}
