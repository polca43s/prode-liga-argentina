import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-password-recovery',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="recovery-container">
      <div class="glass-card recovery-card">
        <div class="recovery-header">
          <h1>Recuperar Contraseña</h1>
          <p>Te enviaremos un link con un código temporal que vence en 5 minutos.</p>
        </div>

        <form (ngSubmit)="onSubmit()" #recoveryForm="ngForm">
          <div class="form-group">
            <label>Email de tu cuenta</label>
            <input type="email" name="email" [(ngModel)]="email" required email placeholder="correo@ejemplo.com">
          </div>

          <button type="submit" class="btn-primary w-full" [disabled]="!recoveryForm.valid || loading">
            {{ loading ? 'Enviando...' : 'Enviar Link de Recuperación' }}
          </button>

          <div class="auth-links">
            <p><a routerLink="/login" class="link-primary">Volver al Login</a></p>
          </div>
        </form>

        <div *ngIf="success" class="success-message">
          ¡Email enviado! Revisa tu bandeja de entrada.
        </div>

        <div *ngIf="error" class="error-message">
          {{ error }}
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
      max-width: 400px;
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
      line-height: 1.5;
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

    .auth-links {
      margin-top: 24px;
    }

    .link-primary {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
    }

    .success-message {
      margin-top: 20px;
      color: #2ea043;
      background: rgba(46, 160, 67, 0.1);
      padding: 10px;
      border-radius: 8px;
      font-size: 0.9rem;
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
export class PasswordRecoveryComponent {
  email = '';
  loading = false;
  success = false;
  error = '';

  onSubmit() {
    this.loading = true;
    this.error = '';
    
    // Aquí conectaremos con el servicio del backend en el siguiente paso
    setTimeout(() => {
      this.loading = false;
      this.success = true;
    }, 1500);
  }
}
