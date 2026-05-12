import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TournamentService } from '../../../core/services/tournament.service';
import { TeamService } from '../../../core/services/team.service';
import { UserService } from '../../../core/services/user.service';
import { Tournament, Team, User } from '../../../core/models/prode.models';

@Component({
  selector: 'app-tournament-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="manager-container">
      <div class="glass-card manager-card">
        <header class="manager-header">
          <div class="header-left">
            <button routerLink="/admin" class="btn-back">⬅ Volver</button>
            <h1>🏆 Gestión de Torneos</h1>
          </div>
          <button (click)="openCreateForm()" class="btn-primary" *ngIf="!showForm">+ Nuevo Torneo</button>
        </header>

        <div class="tournaments-grid">
          <div *ngFor="let t of tournaments" class="tournament-item glass-card" [class.editing]="editingId === t.id">
            <div class="tournament-info">
              <h3>{{ t.nombre }}</h3>
              <p>{{ t.descripcion }}</p>
              <div class="stats-pills">
                <span class="badge">{{ t.cantidadDobles }} Dobles</span>
                <span class="badge secondary">{{ t.teams?.length || 0 }} Equipos</span>
                <span class="badge secondary">{{ t.users?.length || 0 }} Jugadores</span>
              </div>
            </div>
            <div class="actions">
              <button (click)="openEditForm(t)" class="btn-icon">✏️</button>
              <button (click)="deleteTournament(t.id)" class="btn-icon">🗑️</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Formulario Integrado (Abajo de la card principal) -->
      <div *ngIf="showForm" class="glass-card form-card animate-slide-up" id="admin-form">
        <header class="form-header">
          <h2>{{ editingId ? '📝 Editar' : '✨ Nuevo' }} Torneo</h2>
          <button (click)="closeForm()" class="btn-close">✖</button>
        </header>
        
        <form (ngSubmit)="saveTournament()" class="integrated-form">
          <div class="form-main">
            <div class="form-left">
              <div class="form-group">
                <label>Nombre del Torneo</label>
                <input type="text" [(ngModel)]="currentTournament.nombre" name="nombre" required placeholder="Ej: Champions League">
              </div>
              <div class="form-group">
                <label>Cantidad de Dobles por Usuario</label>
                <input type="number" [(ngModel)]="currentTournament.cantidadDobles" name="cantidadDobles" min="0" max="5">
              </div>
              <div class="form-group">
                <label>Descripción / Reglas</label>
                <textarea [(ngModel)]="currentTournament.descripcion" name="descripcion" rows="3" placeholder="Opcional..."></textarea>
              </div>
            </div>

            <div class="form-right">
              <div class="selection-panel">
                <label>🛡️ Seleccionar Equipos ({{ getSelectedCount('teams') }})</label>
                <div class="selection-list">
                  <div *ngFor="let team of allTeams" class="selection-item">
                    <input type="checkbox" [id]="'team-'+team.id" 
                           [checked]="isItemSelected('teams', team.id)"
                           (change)="toggleSelection('teams', team.id)">
                    <label [for]="'team-'+team.id">
                      <img [src]="team.escudo" class="mini-escudo">
                      {{ team.nombre }}
                    </label>
                  </div>
                </div>
              </div>

              <div class="selection-panel">
                <label>👥 Seleccionar Usuarios ({{ getSelectedCount('users') }})</label>
                <div class="selection-list">
                  <div *ngFor="let user of allUsers" class="selection-item">
                    <input type="checkbox" [id]="'user-'+user.id"
                           [checked]="isItemSelected('users', user.id)"
                           (change)="toggleSelection('users', user.id)">
                    <label [for]="'user-'+user.id">
                      <strong>@{{ user.nickname }}</strong> ({{ user.nombre }})
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" (click)="closeForm()" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary large">
              {{ editingId ? 'Actualizar Torneo' : 'Crear Torneo' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .manager-container { min-height: 100vh; background: radial-gradient(circle at top right, #1a2a3a 0%, #0d1117 100%); padding: 40px 20px; color: white; display: flex; flex-direction: column; align-items: center; gap: 30px; }
    .manager-card { width: 100%; max-width: 1000px; padding: 40px; }
    .manager-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .btn-back { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 8px 15px; border-radius: 8px; cursor: pointer; }
    .form-group select { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 10px; color: #000; }
    .form-group select option { color: #000; }
    
    .tournaments-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .tournament-item { padding: 25px; display: flex; justify-content: space-between; align-items: flex-start; }
    .tournament-item.editing { border-color: var(--primary); background: rgba(116, 172, 223, 0.1); }
    .stats-pills { display: flex; gap: 8px; margin-top: 10px; }
    .badge { background: rgba(116, 172, 223, 0.2); color: var(--primary); padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; }
    .badge.secondary { background: rgba(255, 255, 255, 0.05); color: var(--text-muted); }
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 1.1rem; opacity: 0.7; }

    .form-card { width: 100%; max-width: 1000px; padding: 40px; border-top: 3px solid var(--primary); }
    .form-main { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
    
    .selection-panel label { display: block; margin-bottom: 15px; font-weight: 600; color: var(--primary); }
    .selection-list { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; height: 250px; overflow-y: auto; padding: 15px; }
    .selection-item { display: flex; align-items: center; gap: 10px; padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; }
    .selection-item:hover { background: rgba(255,255,255,0.05); }
    .selection-item label { color: white !important; font-weight: normal !important; margin: 0 !important; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; cursor: pointer; flex: 1; }
    .mini-escudo { width: 20px; height: 20px; object-fit: contain; }

    .form-actions { display: flex; gap: 15px; }
    .btn-primary.large { flex: 2; padding: 15px; }
    .animate-slide-up { animation: slideUp 0.4s ease-out; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 800px) { .form-main { grid-template-columns: 1fr; } }

    /* RESPONSIVE DESIGN */
    @media (max-width: 600px) {
      .manager-container { padding: 10px; }
      .manager-card { padding: 20px 15px; }
      .manager-header { flex-direction: column; align-items: flex-start; gap: 15px; }
      .tournaments-grid { grid-template-columns: 1fr; }
      .tournament-item { padding: 15px; }
      .form-card { padding: 20px 15px; }
      .form-main { grid-template-columns: 1fr; gap: 20px; }
      .selection-list { height: 180px; }
      .form-actions { flex-direction: column; }
      .form-group input, .form-group textarea, .form-group select { padding: 10px; }
    }
  `]
})
export class TournamentManagerComponent implements OnInit {
  tournaments: Tournament[] = [];
  allTeams: Team[] = [];
  allUsers: User[] = [];
  
  showForm = false;
  editingId: string | null = null;
  currentTournament: any = { nombre: '', descripcion: '', cantidadDobles: 0, teams: [], users: [] };

  constructor(
    private tournamentService: TournamentService,
    private teamService: TeamService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.loadTournaments();
    this.teamService.getTeams().subscribe(data => this.allTeams = data);
    this.userService.getUsers().subscribe(data => this.allUsers = data);
  }

  loadTournaments() { this.tournamentService.getTournaments().subscribe(data => this.tournaments = data); }

  openCreateForm() {
    this.editingId = null;
    this.currentTournament = { nombre: '', descripcion: '', cantidadDobles: 0, teams: [], users: [] };
    this.showForm = true;
    this.scrollToForm();
  }

  openEditForm(t: Tournament) {
    this.editingId = t.id;
    // Mapear solo los IDs para el manejo de la selección
    this.currentTournament = {
      ...t,
      teams: t.teams ? t.teams.map(team => team.id) : [],
      users: t.users ? t.users.map(user => user.id) : []
    };
    this.showForm = true;
    this.scrollToForm();
  }

  closeForm() { this.showForm = false; this.editingId = null; }

  isItemSelected(type: 'teams' | 'users', id: string): boolean {
    return this.currentTournament[type]?.includes(id);
  }

  toggleSelection(type: 'teams' | 'users', id: string) {
    const list = this.currentTournament[type];
    const index = list.indexOf(id);
    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push(id);
    }
  }

  getSelectedCount(type: 'teams' | 'users'): number {
    return this.currentTournament[type]?.length || 0;
  }

  saveTournament() {
    // Transformar los arrays de IDs en arrays de objetos para TypeORM
    const dataToSave = {
      ...this.currentTournament,
      teams: this.currentTournament.teams.map((id: string) => ({ id })),
      users: this.currentTournament.users.map((id: string) => ({ id }))
    };

    if (this.editingId) {
      this.tournamentService.updateTournament(this.editingId, dataToSave).subscribe(() => { this.closeForm(); this.loadTournaments(); });
    } else {
      this.tournamentService.createTournament(dataToSave).subscribe(() => { this.closeForm(); this.loadTournaments(); });
    }
  }

  deleteTournament(id: string) { if (confirm('¿Borrar torneo?')) this.tournamentService.deleteTournament(id).subscribe(() => this.loadTournaments()); }

  private scrollToForm() { setTimeout(() => { document.getElementById('admin-form')?.scrollIntoView({ behavior: 'smooth' }); }, 100); }
}
