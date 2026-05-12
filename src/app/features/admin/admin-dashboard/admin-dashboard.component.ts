import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { TournamentService } from '../../../core/services/tournament.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-container">
      <div class="glass-card admin-card">
        <header class="admin-header">
          <div class="header-top">
            <span class="badge">Panel de Control</span>
            <div class="user-session">
              <span class="logged-nickname" *ngIf="currentUser()">👤 {{ currentUser()?.nickname }}</span>
              <button (click)="logout()" class="btn-logout">Cerrar Sesión 🚪</button>
            </div>
          </div>
          <h1>Administración</h1>
          <p>Gestiona el torneo y los usuarios del PRODE</p>
        </header>

        <div class="admin-actions">
          <a routerLink="/admin/tournaments" class="action-card">
            <div class="icon">🏆</div>
            <div class="content">
              <h3>Gestión de Torneos</h3>
              <p>Crea y edita ligas o copas</p>
            </div>
          </a>

          <a routerLink="/admin/teams" class="action-card">
            <div class="icon">🛡️</div>
            <div class="content">
              <h3>Gestión de Equipos</h3>
              <p>Carga escudos y nombres de clubes</p>
            </div>
          </a>

          <a routerLink="/admin/fixtures" class="action-card">
            <div class="icon">⚽</div>
            <div class="content">
              <h3>Generar Jugadas</h3>
              <p>Configura fechas y partidos</p>
            </div>
          </a>

          <a routerLink="/admin/results" class="action-card">
            <div class="icon">🏁</div>
            <div class="content">
              <h3>Cargar Resultados</h3>
              <p>Define quién ganó cada partido</p>
            </div>
          </a>

          <a routerLink="/admin/users" class="action-card">
            <div class="icon">👥</div>
            <div class="content">
              <h3>Gestión de Usuarios</h3>
              <p>Gestiona roles y permisos</p>
            </div>
          </a>
        </div>

        <div class="footer-stats">
          <div class="stat">
            <strong>{{ userCount }}</strong>
            <span>Usuarios activos</span>
          </div>
          <div class="stat">
            <strong>{{ tournamentCount }}</strong>
            <span>Torneos en curso</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container { min-height: 100vh; background: radial-gradient(circle at top right, #1a2a3a 0%, #0d1117 100%); padding: 40px 20px; display: flex; justify-content: center; align-items: center; }
    .admin-card { width: 100%; max-width: 800px; padding: 50px; }
    .admin-header { margin-bottom: 40px; }
    .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .user-session { display: flex; align-items: center; gap: 12px; }
    .logged-nickname { color: rgba(255,255,255,0.75); font-size: 0.85rem; font-weight: 600; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); padding: 5px 12px; border-radius: 20px; }
    .btn-logout { background: rgba(220, 53, 69, 0.1); border: 1px solid rgba(220, 53, 69, 0.3); color: #ff4d4d; padding: 6px 15px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: 0.3s; }
    .btn-logout:hover { background: rgba(220, 53, 69, 0.2); transform: translateY(-2px); }

    .badge { background: var(--primary); color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .admin-header h1 { font-size: 2.8rem; color: #fff; margin: 15px 0 10px; }
    .admin-header p { color: var(--text-muted); font-size: 1.1rem; }
    .admin-actions { display: grid; gap: 15px; }

    .action-card { display: flex; align-items: center; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 16px; text-decoration: none; transition: all 0.3s ease; }
    .action-card:hover { background: rgba(116, 172, 223, 0.1); border-color: var(--primary); transform: translateX(10px); }
    .icon { font-size: 2rem; margin-right: 20px; }
    .content h3 { color: #fff; font-size: 1.2rem; margin-bottom: 3px; }
    .content p { color: var(--text-muted); font-size: 0.9rem; }
    .footer-stats { margin-top: 40px; padding-top: 30px; border-top: 1px solid rgba(255, 255, 255, 0.1); display: flex; gap: 40px; }
    .stat strong { display: block; font-size: 1.5rem; color: var(--primary); }
    .stat span { color: var(--text-muted); font-size: 0.85rem; }

    /* RESPONSIVE DESIGN */
    @media (max-width: 600px) {
      .admin-container { padding: 10px; }
      .admin-card { padding: 20px 15px; }
      .admin-header h1 { font-size: 1.8rem; }
      .header-top { flex-direction: column; align-items: flex-start; gap: 10px; }
      .user-session { flex-direction: column; align-items: flex-start; gap: 8px; }
      .action-card { padding: 12px; }
      .action-card:hover { transform: none; }
      .icon { font-size: 1.5rem; margin-right: 12px; }
      .content h3 { font-size: 1rem; }
      .content p { font-size: 0.8rem; }
      .footer-stats { flex-direction: column; gap: 20px; text-align: center; }
    }
})
export class AdminDashboardComponent implements OnInit {
  userCount = 0;
  tournamentCount = 0;

  currentUser = this.authService.currentUser;

  constructor(
    private userService: UserService,
    private tournamentService: TournamentService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.userService.getUsers().subscribe(users => this.userCount = users.length);
    this.tournamentService.getTournaments().subscribe(tournaments => this.tournamentCount = tournaments.length);
  }

  logout() {
    this.authService.logout();
  }
}
