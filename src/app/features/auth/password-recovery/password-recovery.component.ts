import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-password-recovery',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="recovery-container">
      <div class="glass-card recovery-card">
        <div class="recovery-header">
          <h1>🔑 Recuperar Contraseña</h1>
          <p>Ingresá tu email y te enviaremos un link para restablecer tu contraseña. El link vence en <strong>30 minutos</strong>.</p>
        </div>

        <form *ngIf="!success" (ngSubmit)="onSubmit()" #recoveryForm="ngForm">
          <div class="form-group">
            <label>Email de tu cuenta</label>
            <input type="email" name="email" [(ngModel)]="email" required email placeholder="correo@ejemplo.com">
          </div>

          <button type="submit" class="btn-primary w-full" [disabled]="!recoveryForm.valid || loading">
            {{ loading ? 'Enviando...' : 'Enviar Link de Recuperación' }}
          </button>

          <div class="auth-links">
            <p><a routerLink="/login" class="link-primary">← Volver al Login</a></p>
          </div>

          <div *ngIf="error" class="error-message">
            {{ error }}
          </div>
        </form>

        <div *ngIf="success" class="success-state">
          <div class="success-icon">📧</div>
          <h2>¡Email enviado!</h2>
          <p>Revisá tu bandeja de entrada (y la carpeta de <strong>spam</strong>).</p>
          <p class="hint">El link vence en 30 minutos.</p>
          <a routerLink="/login" class="btn-primary w-full" style="display:block; text-align:center; margin-top:24px; text-decoration:none;">Volver al Login</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .recovery-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: radial-gradient(circle at top right, #1a2a3a 0%, #0d1117 100%);
      padding: 20px;
    }

    .recovery-card {
      width: 100%;
      max-width: 420px;
      padding: 40px;
      text-align: center;
    }

    .recovery-header h1 {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 12px;
    }

    .recovery-header p {
      color: var(--text-muted);
      margin-bottom: 32px;
      font-size: 0.9rem;
      line-height: 1.6;
    }

    .form-group {
      text-align: left;
      margin-bottom: 24px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .w-full { width: 100%; }

    .auth-links { margin-top: 24px; }

    .link-primary {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
    }

    .error-message {
      margin-top: 16px;
      color: var(--danger);
      background: rgba(218, 54, 51, 0.1);
      border: 1px solid rgba(218, 54, 51, 0.3);
      padding: 12px;
      border-radius: 8px;
      font-size: 0.9rem;
    }

    .success-state { text-align: center; padding: 10px 0; }
    .success-icon { font-size: 4rem; margin-bottom: 16px; }
    .success-state h2 { color: #2ea043; font-size: 1.5rem; margin-bottom: 12px; }
    .success-state p { color: var(--text-muted); margin-bottom: 6px; line-height: 1.6; }
    .hint { font-size: 0.82rem; color: #666; }
  `]
})
export class PasswordRecoveryComponent {
  email = '';
  loading = false;
  success = false;
  error = '';

  constructor(private authService: AuthService) {}

  onSubmit() {
    this.loading = true;
    this.error = '';

    this.authService.requestPasswordReset(this.email).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Error al enviar el email. Intentá de nuevo.';
      }
    });
  }
}
