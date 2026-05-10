import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TeamService } from '../../../core/services/team.service';
import { Team } from '../../../core/models/prode.models';

@Component({
  selector: 'app-team-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="manager-container">
      <div class="glass-card manager-card">
        <header class="manager-header">
          <div class="header-left">
            <button routerLink="/admin" class="btn-back">⬅ Volver</button>
            <h1>🚩 Gestión de Equipos</h1>
          </div>
          <button (click)="openCreateForm()" class="btn-primary" *ngIf="!showForm">+ Nuevo Equipo</button>
        </header>

        <div class="teams-grid">
          <div *ngFor="let team of teams" class="team-item glass-card" [class.editing]="editingId === team.id">
            <img [src]="team.escudo || 'assets/placeholder-team.png'" class="team-escudo">
            <div class="team-info">
              <h3>{{ team.nombre }}</h3>
              <p>{{ team.ciudad }}</p>
            </div>
            <div class="team-actions">
              <button (click)="openEditForm(team)" class="btn-icon">✏️</button>
              <button (click)="deleteTeam(team.id)" class="btn-icon">🗑️</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Formulario Integrado -->
      <div *ngIf="showForm" class="glass-card form-card animate-slide-up" id="admin-form">
        <header class="form-header">
          <h2>{{ editingId ? '📝 Editar' : '✨ Nuevo' }} Equipo</h2>
          <button (click)="closeForm()" class="btn-close">✖</button>
        </header>
        
        <form (ngSubmit)="saveTeam()" class="integrated-form">
          <div class="form-row">
            <div class="form-group">
              <label>Nombre del Equipo</label>
              <input type="text" [(ngModel)]="currentTeam.nombre" name="nombre" required placeholder="Ej: Boca Juniors">
            </div>
            <div class="form-group">
              <label>Ciudad</label>
              <input type="text" [(ngModel)]="currentTeam.ciudad" name="ciudad" placeholder="Ej: Buenos Aires">
            </div>
          </div>
          
          <div class="form-group">
            <label>URL del Escudo</label>
            <input type="text" [(ngModel)]="currentTeam.escudo" name="escudo" placeholder="https://...">
          </div>

          <div class="form-actions">
            <button type="button" (click)="closeForm()" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary large">
              {{ editingId ? 'Actualizar Equipo' : 'Crear Equipo' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .manager-container { min-height: 100vh; background: radial-gradient(circle at top right, #1a2a3a 0%, #0d1117 100%); padding: 40px 20px; color: white; display: flex; flex-direction: column; align-items: center; gap: 30px; }
    .manager-card { width: 100%; max-width: 1000px; padding: 40px; }
    .manager-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .btn-back { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 8px 15px; border-radius: 8px; cursor: pointer; }

    .teams-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
    .team-item { padding: 15px; text-align: center; position: relative; transition: 0.3s; }
    .team-item.editing { border-color: var(--primary); background: rgba(116, 172, 223, 0.1); }
    .team-escudo { width: 40px; height: 40px; object-fit: contain; margin-bottom: 10px; }
    .team-actions { position: absolute; top: 10px; right: 10px; display: flex; gap: 5px; }
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 1.1rem; opacity: 0.6; }
    .btn-icon:hover { opacity: 1; transform: scale(1.1); }

    .form-card { width: 100%; max-width: 1000px; padding: 40px; border-top: 3px solid var(--primary); }
    .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .btn-close { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.2rem; }
    
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; margin-bottom: 8px; color: var(--text-muted); font-size: 0.9rem; }
    .form-group input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 10px; color: white; }
    select option { color: #000; }
    
    .form-actions { display: flex; gap: 15px; margin-top: 10px; }
    .btn-primary.large { flex: 2; }
    .btn-secondary { flex: 1; }

    .animate-slide-up { animation: slideUp 0.4s ease-out; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class TeamManagerComponent implements OnInit {
  teams: Team[] = [];
  showForm = false;
  editingId: string | null = null;
  currentTeam: any = { nombre: '', ciudad: '', escudo: '' };

  constructor(private teamService: TeamService) {}

  ngOnInit() { this.loadTeams(); }

  loadTeams() { this.teamService.getTeams().subscribe(data => this.teams = data); }

  openCreateForm() { this.editingId = null; this.currentTeam = { nombre: '', ciudad: '', escudo: '' }; this.showForm = true; this.scrollToForm(); }

  openEditForm(team: Team) { this.editingId = team.id; this.currentTeam = { ...team }; this.showForm = true; this.scrollToForm(); }

  closeForm() { this.showForm = false; this.editingId = null; }

  saveTeam() {
    if (this.editingId) {
      this.teamService.updateTeam(this.editingId, this.currentTeam).subscribe(() => { this.closeForm(); this.loadTeams(); });
    } else {
      this.teamService.createTeam(this.currentTeam).subscribe(() => { this.closeForm(); this.loadTeams(); });
    }
  }

  deleteTeam(id: string) { if (confirm('¿Borrar equipo?')) this.teamService.deleteTeam(id).subscribe(() => this.loadTeams()); }

  private scrollToForm() { setTimeout(() => { document.getElementById('admin-form')?.scrollIntoView({ behavior: 'smooth' }); }, 100); }
}
