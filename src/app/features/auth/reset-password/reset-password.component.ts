import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="reset-container">
      <div class="glass-card reset-card">

        <!-- Estado: token inválido / no encontrado -->
        <div *ngIf="!token" class="error-state">
          <div class="state-icon">❌</div>
          <h1>Link inválido</h1>
          <p>El link de recuperación no es válido o ya fue usado.</p>
          <a routerLink="/password-recovery" class="btn-primary w-full" style="display:block; text-align:center; margin-top:24px; text-decoration:none;">Solicitar uno nuevo</a>
        </div>

        <!-- Estado: formulario de nueva contraseña -->
        <ng-container *ngIf="token && !success">
          <div class="reset-header">
            <h1>🔐 Nueva Contraseña</h1>
            <p>Ingresá tu nueva contraseña. Debe tener al menos 6 caracteres.</p>
          </div>

          <form (ngSubmit)="onSubmit()" #resetForm="ngForm">
            <div class="form-group">
              <label>Nueva contraseña</label>
              <div class="input-wrapper">
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  name="newPassword"
                  [(ngModel)]="newPassword"
                  required
                  minlength="6"
                  placeholder="Mínimo 6 caracteres"
                >
                <button type="button" class="toggle-pass" (click)="showPassword = !showPassword">
                  {{ showPassword ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>Confirmar contraseña</label>
              <div class="input-wrapper">
                <input
                  [type]="showConfirm ? 'text' : 'password'"
                  name="confirmPassword"
                  [(ngModel)]="confirmPassword"
                  required
                  placeholder="Repetí tu contraseña"
                >
                <button type="button" class="toggle-pass" (click)="showConfirm = !showConfirm">
                  {{ showConfirm ? '🙈' : '👁️' }}
                </button>
              </div>
              <p class="match-error" *ngIf="confirmPassword && newPassword !== confirmPassword">
                Las contraseñas no coinciden
              </p>
            </div>

            <button
              type="submit"
              class="btn-primary w-full"
              [disabled]="!resetForm.valid || newPassword !== confirmPassword || loading"
            >
              {{ loading ? 'Guardando...' : 'Restablecer Contraseña' }}
            </button>

            <div *ngIf="error" class="error-message">{{ error }}</div>
          </form>
        </ng-container>

        <!-- Estado: éxito -->
        <div *ngIf="success" class="success-state">
          <div class="state-icon">✅</div>
          <h2>¡Contraseña restablecida!</h2>
          <p>Ya podés iniciar sesión con tu nueva contraseña.</p>
          <a routerLink="/login" class="btn-primary w-full" style="display:block; text-align:center; margin-top:24px; text-decoration:none;">Ir al Login</a>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .reset-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: radial-gradient(circle at top right, #1a2a3a 0%, #0d1117 100%);
      padding: 20px;
    }

    .reset-card {
      width: 100%;
      max-width: 440px;
      padding: 40px;
      text-align: center;
    }

    .reset-header h1 {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 12px;
    }

    .reset-header p {
      color: var(--text-muted);
      margin-bottom: 32px;
      font-size: 0.9rem;
      line-height: 1.6;
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

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-wrapper input {
      width: 100%;
      padding-right: 44px;
    }

    .toggle-pass {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.1rem;
      padding: 4px;
      line-height: 1;
    }

    .match-error {
      color: var(--danger);
      font-size: 0.8rem;
      margin-top: 6px;
    }

    .w-full { width: 100%; }

    .error-message {
      margin-top: 16px;
      color: var(--danger);
      background: rgba(218, 54, 51, 0.1);
      border: 1px solid rgba(218, 54, 51, 0.3);
      padding: 12px;
      border-radius: 8px;
      font-size: 0.9rem;
    }

    .error-state, .success-state {
      text-align: center;
      padding: 10px 0;
    }

    .state-icon { font-size: 4rem; margin-bottom: 16px; }

    .error-state h1 { color: var(--danger); font-size: 1.6rem; margin-bottom: 12px; }
    .error-state p { color: var(--text-muted); line-height: 1.6; }

    .success-state h2 { color: #2ea043; font-size: 1.5rem; margin-bottom: 12px; }
    .success-state p { color: var(--text-muted); line-height: 1.6; }

    @media (max-width: 480px) {
      .reset-container { padding: 12px; align-items: flex-start; padding-top: 40px; }
      .reset-card { padding: 28px 20px; border-radius: 16px; }
      .reset-header h1 { font-size: 1.5rem; }
      .state-icon { font-size: 3rem; }
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  success = false;
  error = '';
  showPassword = false;
  showConfirm = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  onSubmit() {
    if (this.newPassword !== this.confirmPassword) return;
    this.loading = true;
    this.error = '';

    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Error al restablecer la contraseña.';
      }
    });
  }
}
