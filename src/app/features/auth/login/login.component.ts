import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="glass-card login-card">
        <div class="login-header">
          <h1>PRODE</h1>
          <p>Liga Argentina de Fútbol</p>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="form-group">
            <label>Nickname o Email</label>
            <input 
              type="text" 
              name="identifier" 
              [(ngModel)]="credentials.mailOrNickname" 
              required 
              placeholder="Tu usuario o correo"
            >
          </div>

          <div class="form-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              name="password" 
              [(ngModel)]="credentials.password" 
              required 
              placeholder="••••••••"
            >
          </div>

          <button type="submit" class="btn-primary w-full" [disabled]="!loginForm.valid || loading">
            {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
          </button>

          <div class="auth-links">
            <a routerLink="/password-recovery" class="link-muted">¿Olvidaste tu contraseña?</a>
            <hr class="divider">
            <p>¿No tienes cuenta? <a routerLink="/register" class="link-primary">Regístrate</a></p>
          </div>
        </form>

        <div *ngIf="error" class="error-message">
          {{ error }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: radial-gradient(circle at top right, #1a2a3a 0%, #0d1117 100%);
      padding: 20px;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 40px;
      text-align: center;
    }

    .login-header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 0;
      letter-spacing: 2px;
    }

    .login-header p {
      color: var(--text-muted);
      margin-bottom: 32px;
    }

    .form-group {
      text-align: left;
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .w-full { width: 100%; }

    .auth-links {
      margin-top: 24px;
    }

    .link-muted {
      color: var(--text-muted);
      font-size: 0.85rem;
      text-decoration: none;
    }

    .link-muted:hover { color: var(--text-main); }

    .link-primary {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
    }

    .divider {
      border: 0;
      border-top: 1px solid var(--glass-border);
      margin: 20px 0;
    }

    .error-message {
      margin-top: 20px;
      color: var(--danger);
      background: rgba(218, 54, 51, 0.1);
      padding: 10px;
      border-radius: 8px;
      font-size: 0.9rem;
    }
  `]
})
export class LoginComponent {
  credentials = {
    mailOrNickname: '',
    password: ''
  };
  loading = false;
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.loading = true;
    this.error = '';
    
    this.authService.login(this.credentials).subscribe({
      next: (response: any) => {
        // Redirección basada en el rol
        if (response.user.tipo === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/resultados']);
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al iniciar sesión';
        this.loading = false;
      }
    });
  }
}
