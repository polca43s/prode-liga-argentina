import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FixtureService } from '../../../core/services/fixture.service';
import { TournamentService } from '../../../core/services/tournament.service';
import { Tournament, Team, Fixture, Match } from '../../../core/models/prode.models';

@Component({
  selector: 'app-fixture-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="manager-container">
      <div class="glass-card manager-card">
        <header class="manager-header">
          <div class="header-left">
            <button routerLink="/admin" class="btn-back">⬅ Volver</button>
            <h1>⚽ Generación de Jugadas</h1>
          </div>
          <div class="tournament-selector">
            <select [(ngModel)]="selectedTournamentId" (change)="onTournamentChange()">
              <option value="" disabled selected>Elegir torneo...</option>
              <option *ngFor="let t of tournaments" [value]="t.id">{{ t.nombre }}</option>
            </select>
          </div>
        </header>

        <div *ngIf="selectedTournamentId" class="fixture-section">
          <div *ngIf="getSelectedTournamentTeams().length === 0 && !loadingTeams" class="warn-box">
            ⚠️ Este torneo no tiene equipos asignados. Ve a "Gestión de Torneos" para agregarlos.
          </div>

          <div *ngIf="loadingTeams" class="warn-box">Cargando equipos...</div>

          <!-- FORMULARIO NUEVA FECHA -->
          <div class="new-fixture-form" *ngIf="getSelectedTournamentTeams().length > 0 && !justCreatedFixtureId">
            <input type="text" [(ngModel)]="newFixtureName" placeholder="Nombre de la fecha (Ej: Fecha 1)">
            <button (click)="createNewFixture()" class="btn-primary" [disabled]="!newFixtureName">Nueva Fecha</button>
          </div>

          <!-- MODO EDICION EXCLUSIVA (Justo después de crear) -->
          <div *ngIf="justCreatedFixtureId" class="focused-editing">
             <div class="edit-header">
                <h2>Editando: {{ getJustCreatedFixture()?.nombre }}</h2>
                <button (click)="finishCreation()" class="btn-primary">Finalizar Armado ✅</button>
             </div>

             <div *ngIf="getSelectedTournamentTeams().length === 0 && loadingTeams" class="warn-box">Cargando equipos...</div>

             <div class="fixture-item" *ngIf="getSelectedTournamentTeams().length > 0">
                <div class="matches-list">
                  <div *ngFor="let m of getJustCreatedFixture()?.partidos" class="match-item">
                    <div class="team-vs">
                      <img [src]="m.local?.escudo" class="mini-escudo">
                      <span>{{ m.local?.nombre }}</span>
                      <span class="vs">VS</span>
                      <span>{{ m.visitante?.nombre }}</span>
                      <img [src]="m.visitante?.escudo" class="mini-escudo">
                    </div>
                    <button (click)="deleteMatch(m.id)" class="btn-icon">🗑️</button>
                  </div>
                </div>

                <div class="add-match-box">
                  <h4>Agregar Partidos</h4>
                  <div class="match-inputs">
                    <!-- SELECTOR LOCAL -->
                    <div class="team-selector-wrapper">
                      <input type="text" class="team-search-input" placeholder="Buscar Local..." [(ngModel)]="localSearch" (focus)="localDropdownOpen = true" (blur)="closeDropdown('local')">
                      <div class="team-dropdown" *ngIf="localDropdownOpen">
                        <div *ngFor="let team of getFilteredTeams('local')" class="team-option" (mousedown)="selectTeam('local', team)">
                          <img [src]="team.escudo" class="dropdown-escudo" *ngIf="team.escudo" [alt]="team.nombre">
                          <span>{{ team.nombre }}</span>
                        </div>
                      </div>
                      <div class="selected-team-display" *ngIf="newMatch.localId" (click)="newMatch.localId = ''; localSearch = ''">
                        <span *ngIf="getSelectedTeamById(newMatch.localId) as team">
                          <img [src]="team.escudo" class="mini-escudo" *ngIf="team.escudo" [alt]="team.nombre">
                          {{ team.nombre }}
                        </span>
                      </div>
                    </div>

                    <span class="vs">VS</span>

                    <!-- SELECTOR VISITANTE -->
                    <div class="team-selector-wrapper">
                      <input type="text" class="team-search-input" placeholder="Buscar Visitante..." [(ngModel)]="visitanteSearch" (focus)="visitanteDropdownOpen = true" (blur)="closeDropdown('visitante')">
                      <div class="team-dropdown" *ngIf="visitanteDropdownOpen">
                        <div *ngFor="let team of getFilteredTeams('visitante')" class="team-option" (mousedown)="selectTeam('visitante', team)">
                          <img [src]="team.escudo" class="dropdown-escudo" *ngIf="team.escudo" [alt]="team.nombre">
                          <span>{{ team.nombre }}</span>
                        </div>
                      </div>
                      <div class="selected-team-display" *ngIf="newMatch.visitanteId" (click)="newMatch.visitanteId = ''; visitanteSearch = ''">
                        <span *ngIf="getSelectedTeamById(newMatch.visitanteId) as team">
                          <img [src]="team.escudo" class="mini-escudo" *ngIf="team.escudo" [alt]="team.nombre">
                          {{ team.nombre }}
                        </span>
                      </div>
                    </div>

                    <button (click)="addMatchToFixture(justCreatedFixtureId)" class="btn-secondary" [disabled]="!newMatch.localId || !newMatch.visitanteId">
                      Añadir
                    </button>
                  </div>
                </div>
             </div>
          </div>

           <!-- LISTA GENERAL (Solo si no hay nombre ni estamos creando) -->
          <div class="fixtures-list" *ngIf="!newFixtureName && !justCreatedFixtureId">
            <div *ngFor="let f of fixtures" class="fixture-item">
              <div class="fixture-info">
                <h3>{{ f.nombre }}</h3>
                <span class="match-count">{{ f.partidos?.length || 0 }} partidos</span>
              </div>
              <div class="fixture-actions">
                 <button (click)="editFixture(f.id)" class="btn-icon" title="Editar">✏️</button>
                 <button (click)="deleteFixture(f.id)" class="btn-icon btn-danger" title="Borrar Fecha">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .manager-container { min-height: 100vh; background: radial-gradient(circle at top right, #1a2a3a 0%, #0d1117 100%); padding: 40px 20px; color: white; }
    .manager-card { max-width: 900px; margin: 0 auto; padding: 40px; }
    .manager-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 20px; }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .btn-back { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 8px 15px; border-radius: 8px; cursor: pointer; }
    
    .warn-box { background: rgba(255, 193, 7, 0.1); border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin-bottom: 20px; color: #ffc107; font-size: 0.9rem; }
    .tournament-selector select { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2); color: #000; padding: 8px 12px; border-radius: 8px; }
    .tournament-selector select option { color: #000; }
    .new-fixture-form { display: flex; gap: 10px; margin-bottom: 30px; }
    .new-fixture-form input { flex: 1; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2); padding: 12px; border-radius: 8px; color: #fff; }
    .fixture-item { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 25px; margin-bottom: 30px; }
    .fixture-info h3 { color: var(--primary); font-size: 1.5rem; margin-bottom: 20px; }
    .match-item { display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.02); padding: 12px 20px; border-radius: 10px; margin-bottom: 10px; }
    .team-vs { display: flex; align-items: center; gap: 15px; font-weight: 500; }
    .mini-escudo { width: 30px; height: 30px; object-fit: contain; }
    .vs { color: var(--text-muted); font-size: 0.8rem; font-weight: 800; }
    .add-match-box { margin-top: 30px; padding-top: 20px; border-top: 1px dashed rgba(255, 255, 255, 0.1); }
    .match-inputs { display: flex; align-items: center; gap: 15px; flex-wrap: wrap; }
    .team-select { flex: 1; min-width: 150px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2); color: #000; padding: 10px; border-radius: 8px; }
    .team-select option { color: #000; }
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; }
    .btn-icon.btn-danger:hover { color: #f87171; transform: scale(1.1); }

    .team-selector-wrapper { position: relative; flex: 1; min-width: 150px; }
    .team-search-input { width: 100%; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2); color: white; padding: 10px 12px; border-radius: 8px; }
    .team-search-input::placeholder { color: rgba(255,255,255,0.4); }
    .team-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: #1a1f2e; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; max-height: 220px; overflow-y: auto; z-index: 100; box-shadow: 0 8px 20px rgba(0,0,0,0.4); margin-top: 4px; }
    .team-option { display: flex; align-items: center; gap: 10px; padding: 10px 12px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); transition: 0.2s; }
    .team-option:hover { background: rgba(116, 172, 223, 0.15); }
    .team-option:last-child { border-bottom: none; }
    .dropdown-escudo { width: 24px; height: 24px; object-fit: contain; flex-shrink: 0; }
    .selected-team-display { margin-top: 6px; display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.5); font-size: 0.8rem; cursor: pointer; }
    .selected-team-display:hover { color: #f87171; }
    .selected-team-display span { display: flex; align-items: center; gap: 5px; }

    .focused-editing { animation: fadeIn 0.4s ease; }
    .edit-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: rgba(116, 172, 223, 0.1); padding: 20px; border-radius: 12px; }
    .fixture-info { display: flex; flex-direction: column; gap: 5px; }
    .match-count { font-size: 0.8rem; color: var(--text-muted); }
    .fixtures-list .fixture-item { display: flex; justify-content: space-between; align-items: center; padding: 20px 30px; }
    .focused-editing .fixture-item { padding: 30px; display: block; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* RESPONSIVE DESIGN */
    @media (max-width: 600px) {
      .manager-container { padding: 10px; }
      .manager-card { max-width: 100%; padding: 15px; }
      .manager-header { flex-direction: column; align-items: flex-start; gap: 10px; margin-bottom: 20px; }
      .tournament-selector select { width: 100%; }
      .new-fixture-form { flex-direction: column; }
      .new-fixture-form input { min-width: unset; }
      .match-inputs { flex-direction: column; }
      .team-selector-wrapper { width: 100%; }
      .team-dropdown { max-height: 180px; }
      .fixtures-list .fixture-item { padding: 15px; flex-direction: column; align-items: flex-start; gap: 10px; }
      .fixture-info h3 { font-size: 1.2rem; }
      .focused-editing .fixture-item { padding: 15px; }
      .edit-header { flex-direction: column; gap: 10px; }
      .match-item { padding: 10px; flex-direction: column; gap: 5px; }
      .team-vs { flex-wrap: wrap; justify-content: center; }
    }
  `]
})
export class FixtureManagerComponent implements OnInit {
  tournaments: Tournament[] = [];
  fixtures: Fixture[] = [];
  selectedTournamentId = '';
  newFixtureName = '';
  newMatch = { localId: '', visitanteId: '' };
  justCreatedFixtureId: string | null = null;
  selectedTournamentTeams: Team[] = [];
  loadingTeams = false;
  localSearch = '';
  visitanteSearch = '';
  localDropdownOpen = false;
  visitanteDropdownOpen = false;

  constructor(
    private tournamentService: TournamentService,
    private fixtureService: FixtureService
  ) {}

  ngOnInit() {
    this.tournamentService.getTournaments().subscribe({
      next: (data: any) => this.tournaments = data,
      error: (err) => console.error('Error loading tournaments:', err)
    });
  }

  onTournamentChange() { this.loadFixtures(); this.loadTournamentTeams(); }

  loadTournamentTeams() {
    if (!this.selectedTournamentId) return;
    this.loadingTeams = true;
    this.tournamentService.getTournamentTeams(this.selectedTournamentId).subscribe({
      next: (data: any) => { this.selectedTournamentTeams = data; this.loadingTeams = false; },
      error: (err) => { console.error('Error loading tournament teams:', err); this.loadingTeams = false; }
    });
  }

  getSelectedTournamentTeams(): Team[] { return this.selectedTournamentTeams; }

  loadFixtures() { 
    if (!this.selectedTournamentId) return; 
    this.fixtureService.getFixturesByTournament(this.selectedTournamentId).subscribe({
      next: (data: any) => this.fixtures = data,
      error: (err) => console.error('Error loading fixtures:', err)
    }); 
  }
  
  createNewFixture() {
    const fixtureData = { 
      nombre: this.newFixtureName, 
      tournament: { id: this.selectedTournamentId },
      seeAll: false 
    };
    this.fixtureService.createFixture(fixtureData).subscribe((res: any) => { 
      this.newFixtureName = ''; 
      this.justCreatedFixtureId = res.id;
      this.loadFixtures();
      this.loadTournamentTeams(); 
    });
  }

  getJustCreatedFixture(): Fixture | undefined {
    return this.fixtures.find(f => f.id === this.justCreatedFixtureId);
  }

  editFixture(id: string) {
    this.justCreatedFixtureId = id;
    this.loadTournamentTeams();
  }

  finishCreation() {
    this.justCreatedFixtureId = null;
    this.loadFixtures();
  }

  getAvailableTeams(fixture: Fixture, excludeId?: string): Team[] {
    const tournamentTeams = this.getSelectedTournamentTeams();
    return tournamentTeams.filter(t => t.id !== excludeId);
  }

  getFilteredTeams(type: 'local' | 'visitante'): Team[] {
    const excludeId = type === 'visitante' ? this.newMatch.localId : undefined;
    const search = type === 'local' ? this.localSearch.toLowerCase() : this.visitanteSearch.toLowerCase();
    return this.getAvailableTeams(this.getJustCreatedFixture()!, excludeId).filter(t =>
      t.nombre.toLowerCase().includes(search)
    );
  }

  getAvailableTeams(fixture: Fixture, excludeId?: string): Team[] {
    const tournamentTeams = this.getSelectedTournamentTeams();
    const usedTeamIds = new Set<string>();

    fixture.partidos?.forEach((m: any) => {
      if (m.local) usedTeamIds.add(m.local.id);
      if (m.visitante) usedTeamIds.add(m.visitante.id);
    });

    return tournamentTeams.filter(t => !usedTeamIds.has(t.id) && t.id !== excludeId);
  }

  getSelectedTeamById(id: string): Team | undefined {
    return this.selectedTournamentTeams.find(t => t.id === id);
  }

  selectTeam(type: 'local' | 'visitante', team: Team) {
    if (type === 'local') {
      this.newMatch.localId = team.id;
      this.localSearch = team.nombre;
      this.localDropdownOpen = false;
    } else {
      this.newMatch.visitanteId = team.id;
      this.visitanteSearch = team.nombre;
      this.visitanteDropdownOpen = false;
    }
  }

  closeDropdown(type: 'local' | 'visitante') {
    setTimeout(() => {
      if (type === 'local') {
        this.localDropdownOpen = false;
        if (this.newMatch.localId) {
          const team = this.getSelectedTeamById(this.newMatch.localId);
          if (team) this.localSearch = team.nombre;
        }
      } else {
        this.visitanteDropdownOpen = false;
        if (this.newMatch.visitanteId) {
          const team = this.getSelectedTeamById(this.newMatch.visitanteId);
          if (team) this.visitanteSearch = team.nombre;
        }
      }
    }, 200);
  }

  addMatchToFixture(fixtureId: string) {
    const fixture = this.fixtures.find(f => f.id === fixtureId);
    const orden = (fixture?.partidos?.length || 0) + 1;
    const matchData = { 
      fixture: { id: fixtureId }, 
      local: { id: this.newMatch.localId }, 
      visitante: { id: this.newMatch.visitanteId },
      orden
    };
    this.fixtureService.createMatch(matchData).subscribe(() => { 
      this.newMatch = { localId: '', visitanteId: '' }; 
      this.localSearch = '';
      this.visitanteSearch = '';
      this.loadFixtures(); 
    });
  }
  
  deleteMatch(matchId: string) { this.fixtureService.deleteMatch(matchId).subscribe(() => this.loadFixtures()); }

  deleteFixture(fixtureId: string) {
    if (confirm('Estas seguro de borrar esta fecha y todas sus jugadas?')) {
      this.fixtureService.deleteFixture(fixtureId).subscribe(() => {
        if (this.justCreatedFixtureId === fixtureId) {
          this.justCreatedFixtureId = null;
        }
        this.loadFixtures();
      });
    }
  }
}
