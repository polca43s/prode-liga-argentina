import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="register-container">
      <div class="glass-card register-card">
        <div class="register-header">
          <h1>Crear Cuenta</h1>
          <p>Únete a la liga de PRODE</p>
        </div>

        <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
          <div class="form-row">
            <div class="form-group">
              <label>Nombre</label>
              <input type="text" name="nombre" [(ngModel)]="user.nombre" required placeholder="Ej: Juan">
            </div>
            <div class="form-group">
              <label>Apellido</label>
              <input type="text" name="apellido" [(ngModel)]="user.apellido" required placeholder="Ej: Pérez">
            </div>
          </div>

          <div class="form-group">
            <label>Email</label>
            <input type="email" name="mail" [(ngModel)]="user.mail" required email placeholder="correo@ejemplo.com">
          </div>

          <div class="form-group">
            <label>Nickname (Único)</label>
            <input type="text" name="nickname" [(ngModel)]="user.nickname" required placeholder="Ej: juancito10">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Contraseña</label>
              <input type="password" name="password" [(ngModel)]="user.password" required placeholder="••••••••">
            </div>
            <div class="form-group">
              <label>Confirmar Contraseña</label>
              <input type="password" name="confirmPassword" [(ngModel)]="confirmPassword" required placeholder="••••••••">
            </div>
          </div>

          <div *ngIf="user.password && confirmPassword && user.password !== confirmPassword" class="error-text">
            Las contraseñas no coinciden
          </div>

          <button type="submit" class="btn-primary w-full" [disabled]="!registerForm.valid || loading || user.password !== confirmPassword">
            {{ loading ? 'Registrando...' : 'Registrarse' }}
          </button>

          <div class="auth-links">
            <p>¿Ya tienes cuenta? <a routerLink="/login" class="link-primary">Inicia Sesión</a></p>
          </div>
        </form>

        <div *ngIf="error" class="error-message">
          {{ error }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: radial-gradient(circle at top right, #1a2a3a 0%, #0d1117 100%);
      padding: 20px;
    }

    .register-card {
      width: 100%;
      max-width: 500px;
      padding: 40px;
      text-align: center;
    }

    .register-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 8px;
    }

    .register-header p {
      color: var(--text-muted);
      margin-bottom: 32px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-group {
      text-align: left;
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .w-full { width: 100%; }

    .error-text {
      color: var(--danger);
      font-size: 0.8rem;
      margin-bottom: 16px;
      text-align: left;
    }

    .auth-links {
      margin-top: 24px;
    }

    .link-primary {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
    }

    .error-message {
      margin-top: 20px;
      color: var(--danger);
      background: rgba(218, 54, 51, 0.1);
      padding: 10px;
      border-radius: 8px;
      font-size: 0.9rem;
    }

    @media (max-width: 480px) {
      .form-row {
        grid-template-columns: 1fr;
        gap: 0;
      }
    }
  `]
})
export class RegisterComponent {
  user = {
    nombre: '',
    apellido: '',
    mail: '',
    nickname: '',
    password: '',
    tipo: 'USER'
  };
  confirmPassword = '';
  loading = false;
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.loading = true;
    this.error = '';
    
    this.authService.register(this.user).subscribe({
      next: () => {
        alert('¡Registro exitoso! Ya puedes iniciar sesión. Revisa tu email.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al registrar usuario. Email o Nickname podrían estar en uso.';
        this.loading = false;
      }
    });
  }
}
