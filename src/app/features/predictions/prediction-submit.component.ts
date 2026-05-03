import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentService } from '../../core/services/tournament.service';
import { FixtureService } from '../../core/services/fixture.service';
import { PredictionService } from '../../core/services/prediction.service';
import { AuthService } from '../../core/services/auth.service';
import { Tournament, Fixture, Match } from '../../core/models/prode.models';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-prediction-submit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="prediction-container">
      <div class="glass-card main-card">
        <header class="header">
          <div class="header-main">
            <h1>🎯 Realizar Jugada</h1>
            <button (click)="logout()" class="btn-logout-user">Cerrar Sesión 🚪</button>
          </div>
          <div class="selectors">
            <select [(ngModel)]="selectedTournamentId" (change)="onTournamentChange()">
              <option value="" disabled>Torneo...</option>
              <option *ngFor="let t of tournaments" [value]="t.id">{{ t.nombre }}</option>
            </select>
            <select [(ngModel)]="selectedFixtureId" (change)="onFixtureChange()" *ngIf="selectedTournamentId">
              <option value="" disabled>Fecha...</option>
              <option *ngFor="let f of fixtures" [value]="f.id">{{ f.nombre }}</option>
            </select>
          </div>

          <!-- TABS PRINCIPALES -->
          <div class="global-tabs" *ngIf="tournaments.length > 0">
            <button routerLink="/resultados" class="global-tab-btn outline">📊 Posiciones y Resultados</button>
            <button [class.active]="true" class="global-tab-btn active">✍️ Hacer mi próxima jugada</button>
          </div>
        </header>

        <div *ngIf="tournaments.length === 0" class="empty-state">
          <div class="empty-icon">🏟️</div>
          <h2>Aún no participas en ningún torneo</h2>
          <p>Contacta con el administrador para que te asigne a un torneo activo.</p>
          <button (click)="logout()" class="btn-primary">Cerrar Sesión</button>
        </div>

        <div *ngIf="currentFixture" class="content">
          <!-- Alerta de Bloqueo -->
          <div *ngIf="currentFixture.seeAll" class="lock-alert started">
            <div class="icon">🚫</div>
            <div class="text">
              <h2 class="started-text">¡FECHA INICIADA!</h2>
              <p>El organizador ha cerrado esta fecha. Ya puedes ver las jugadas de todos.</p>
            </div>
          </div>

          <!-- Buscador de otros usuarios (Solo si seeAll es true) -->
          <div *ngIf="currentFixture.seeAll" class="search-box">
            <input type="text" [(ngModel)]="searchQuery" (input)="onSearch()" placeholder="Buscar por nickname, nombre o mail...">
            <div *ngIf="searchResults.length > 0" class="results-dropdown glass-card">
              <div *ngFor="let res of searchResults" (click)="viewOtherPrediction(res)" class="search-item">
                <strong>@{{ res.user.nickname }}</strong> - {{ res.user.nombre }}
              </div>
            </div>
          </div>

          <!-- Visualización de Jugada Ajena -->
          <div *ngIf="viewingOther" class="other-prediction-view">
            <div class="view-header">
              <h3>Viendo jugada de: @{{ viewingOther.user.nickname }}</h3>
              <button (click)="viewingOther = null" class="btn-secondary small">Volver a mi jugada</button>
            </div>
            <div class="match-list readonly">
               <div *ngFor="let match of currentFixture.partidos" class="match-row">
                  <div class="teams">
                    <img [src]="match.local.escudo" class="escudo">
                    <span>{{ match.local.nombre }}</span>
                    <span class="vs">VS</span>
                    <span>{{ match.visitante.nombre }}</span>
                    <img [src]="match.visitante.escudo" class="escudo">
                  </div>
                  <div class="selection-display">
                    {{ getSelectionForMatch(viewingOther, match.id) }}
                  </div>
               </div>
            </div>
          </div>

            <h2 *ngIf="currentFixture.seeAll">Mi Jugada</h2>
            
            <div *ngIf="!currentFixture.seeAll" class="dobles-info" [class.error]="getDoblesUsados() !== (getTorneoActual()?.cantidadDobles || 0)">
               <span class="icon">✨</span>
               Dobles usados: <strong>{{ getDoblesUsados() }}</strong> de <strong>{{ getTorneoActual()?.cantidadDobles || 0 }}</strong>
               <p *ngIf="getDoblesUsados() > (getTorneoActual()?.cantidadDobles || 0)" class="error-msg">Has excedido el límite de dobles.</p>
               <p *ngIf="getDoblesUsados() < (getTorneoActual()?.cantidadDobles || 0)" class="warn-msg">Aún te faltan dobles por asignar.</p>
            </div>

            <div class="match-list" [class.disabled]="currentFixture.seeAll">
              <div *ngFor="let match of currentFixture.partidos" class="match-row">
                <div class="teams">
                  <img [src]="match.local.escudo" class="escudo">
                  <span>{{ match.local.nombre }}</span>
                  <span class="vs">VS</span>
                  <span>{{ match.visitante.nombre }}</span>
                  <img [src]="match.visitante.escudo" class="escudo">
                </div>
                
                <div class="prediction-buttons">
                  <button [class.active]="hasSelection(match.id, 'L')" 
                          (click)="toggleSelection(match.id, 'L')" 
                          [disabled]="currentFixture.seeAll">L</button>
                  <button [class.active]="hasSelection(match.id, 'E')" 
                          (click)="toggleSelection(match.id, 'E')" 
                          [disabled]="currentFixture.seeAll">E</button>
                  <button [class.active]="hasSelection(match.id, 'V')" 
                          (click)="toggleSelection(match.id, 'V')" 
                          [disabled]="currentFixture.seeAll">V</button>
                </div>
              </div>
            </div>

          <div *ngIf="!currentFixture.seeAll" class="actions">
            <p *ngIf="!isValidJugada() && mySelections.length > 0" class="global-error">
              Debes completar todos los partidos y usar exactamente {{ getTorneoActual()?.cantidadDobles }} dobles.
            </p>
            <button (click)="savePrediction()" class="btn-primary w-full" [disabled]="loading || !isValidJugada()">
              {{ loading ? 'Guardando...' : 'Guardar Jugada' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .prediction-container {
      min-height: 100vh;
      background: radial-gradient(circle at top right, #1a2a3a 0%, #0d1117 100%);
      padding: 40px 20px;
      color: white;
    }
    .main-card { width: 100%; max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { margin-bottom: 20px; }
    .header-main { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .btn-logout-user { background: rgba(220, 53, 69, 0.1); border: 1px solid rgba(220, 53, 69, 0.3); color: #ff4d4d; padding: 8px 16px; border-radius: 10px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: 0.3s; }
    .btn-logout-user:hover { background: rgba(220, 53, 69, 0.2); transform: translateY(-2px); }
    
    .global-tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; }
    .global-tab-btn { flex: 1; padding: 15px; border: none; background: rgba(116, 172, 223, 0.1); color: var(--primary); cursor: pointer; border-radius: 12px; font-weight: 700; font-size: 1rem; transition: 0.3s; }
    .global-tab-btn.outline { background: transparent; border: 1px dashed rgba(255,255,255,0.2); color: white; opacity: 0.8; }
    .global-tab-btn.outline:hover { background: rgba(255,255,255,0.05); opacity: 1; transform: translateY(-2px); }

    .selectors { display: flex; gap: 10px; }
    select { background: rgba(255,255,255,0.05); color: #000; border: 1px solid rgba(255,255,255,0.2); padding: 10px; border-radius: 8px; font-size: 0.9rem; }

    /* RESPONSIVE DESIGN */
    @media (max-width: 768px) {
      .prediction-container { padding: 10px; }
      .main-card { padding: 20px; border-radius: 15px; }
      .header { flex-direction: column; align-items: stretch; text-align: center; }
      .selectors { flex-direction: column; }
      .match-row { flex-direction: column; gap: 15px; padding: 15px; }
      .teams { flex-direction: column; text-align: center; gap: 8px; }
      .escudo { width: 45px; height: 45px; }
      .prediction-buttons { width: 100%; justify-content: space-between; }
      .prediction-buttons button { flex: 1; height: 50px; }
      .view-header { flex-direction: column; gap: 10px; text-align: center; }
    }

    .lock-alert {
      display: flex; align-items: center; gap: 20px;
      background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3);
      padding: 20px; border-radius: 12px; margin-bottom: 30px;
    }
    .lock-alert.started {
      background: rgba(220, 53, 69, 0.15); border: 1px solid rgba(220, 53, 69, 0.4);
      animation: pulse-red 2s infinite;
    }
    .started-text { color: #ff4d4d; font-weight: 900; margin: 0; text-shadow: 0 0 10px rgba(255, 77, 77, 0.5); }
    
    @keyframes pulse-red {
      0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4); }
      70% { box-shadow: 0 0 0 15px rgba(220, 53, 69, 0); }
      100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
    }
    .lock-alert .icon { font-size: 2rem; }
    .lock-alert h3 { color: #ffc107; margin-bottom: 5px; }

    .search-box { position: relative; margin-bottom: 30px; }
    .search-box input {
      width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2);
      padding: 12px 20px; border-radius: 25px; color: white;
    }
    .results-dropdown {
      position: absolute; top: 50px; left: 0; right: 0; z-index: 100;
      max-height: 300px; overflow-y: auto;
    }
    .search-item { padding: 15px 20px; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer; }
    .search-item:hover { background: rgba(255,255,255,0.1); }

    .match-list { display: grid; gap: 15px; margin-bottom: 30px; }
    .match-list.disabled { opacity: 0.8; }
    .match-row {
      display: flex; justify-content: space-between; align-items: center;
      background: rgba(255,255,255,0.03); padding: 15px 25px; border-radius: 12px;
    }
    .teams { display: flex; align-items: center; gap: 15px; flex: 1; }
    .escudo { width: 35px; height: 35px; object-fit: contain; }
    .vs { color: var(--text-muted); font-size: 0.7rem; font-weight: 900; }

    .prediction-buttons { display: flex; gap: 10px; }
    .prediction-buttons button {
      width: 45px; height: 45px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);
      background: none; color: white; cursor: pointer; transition: all 0.2s;
    }
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; }

    .dobles-info {
      background: rgba(116, 172, 223, 0.1);
      border: 1px solid var(--primary);
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 20px;
      text-align: left;
    }
    .dobles-info.error { border-color: var(--danger); background: rgba(218, 54, 51, 0.05); }
    .error-msg { color: var(--danger); font-size: 0.8rem; margin-top: 5px; }
    .warn-msg { color: #ffc107; font-size: 0.8rem; margin-top: 5px; }
    .global-error { color: var(--danger); text-align: center; margin-bottom: 15px; font-weight: 600; }

    .prediction-buttons button.active { background: var(--primary); border-color: var(--primary); font-weight: 700; }
    .prediction-buttons button:disabled { cursor: default; }

    .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .selection-display { font-size: 1.5rem; font-weight: 700; color: var(--primary); width: 100px; text-align: center; }

    .empty-state { text-align: center; padding: 60px 20px; }
    .empty-icon { font-size: 4rem; margin-bottom: 20px; opacity: 0.5; }
    .empty-state h2 { margin-bottom: 10px; color: #fff; }
    .empty-state p { color: var(--text-muted); margin-bottom: 30px; }
  `]
})
export class PredictionSubmitComponent implements OnInit {
  tournaments: Tournament[] = [];
  fixtures: Fixture[] = [];
  currentFixture: any = null;
  
  selectedTournamentId = '';
  selectedFixtureId = '';
  
  mySelections: any[] = [];
  loading = false;
  
  searchQuery = '';
  searchResults: any[] = [];
  viewingOther: any = null;

  constructor(
    private tournamentService: TournamentService,
    private fixtureService: FixtureService,
    private predictionService: PredictionService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.tournamentService.getTournamentsByUser(user.id).subscribe((data: any) => this.tournaments = data);
    }
  }

  logout() {
    this.authService.logout();
  }

  onTournamentChange() {
    this.fixtureService.getFixturesByTournament(this.selectedTournamentId).subscribe((data: any) => {
      this.fixtures = data;
      this.selectedFixtureId = '';
      this.currentFixture = null;
    });
  }

  onFixtureChange() {
    this.currentFixture = this.fixtures.find(f => f.id === this.selectedFixtureId);
    this.loadMyPrediction();
  }

  loadMyPrediction() {
    this.mySelections = [];
    if (!this.selectedFixtureId) return;

    this.predictionService.getMyPrediction(this.selectedFixtureId).subscribe((data: any) => {
      if (data && data.detalles) {
        this.mySelections = data.detalles.map((d: any) => ({
          matchId: d.match.id,
          seleccion: d.seleccion
        }));
      }
    });
  }

  hasSelection(matchId: string, value: string): boolean {
    const sel = this.mySelections.find(s => s.matchId === matchId);
    return sel ? sel.seleccion.includes(value) : false;
  }

  toggleSelection(matchId: string, value: string) {
    let sel = this.mySelections.find(s => s.matchId === matchId);
    if (!sel) {
      sel = { matchId, seleccion: [value] };
      this.mySelections.push(sel);
    } else {
      if (sel.seleccion.includes(value)) {
        // Quitar selección
        sel.seleccion = sel.seleccion.filter((v: string) => v !== value);
        // Si quedó vacío, lo quitamos de la lista
        if (sel.seleccion.length === 0) {
          this.mySelections = this.mySelections.filter(s => s.matchId !== matchId);
        }
      } else {
        // Agregar selección (máximo 2 por partido)
        if (sel.seleccion.length < 2) {
          sel.seleccion.push(value);
        } else {
          // Si ya tiene 2, reemplazamos el primero (o podrías no hacer nada)
          sel.seleccion = [value];
        }
      }
    }
  }

  getTorneoActual() {
    return this.tournaments.find(t => t.id === this.selectedTournamentId);
  }

  getDoblesUsados(): number {
    return this.mySelections.filter(s => s.seleccion.length === 2).length;
  }

  isValidJugada(): boolean {
    const torneo = this.getTorneoActual();
    if (!torneo || !this.currentFixture) return false;

    // 1. Debe haber usado exactamente los dobles permitidos
    const doblesValidos = this.getDoblesUsados() === torneo.cantidadDobles;

    // 2. Todos los partidos del fixture deben tener al menos una selección
    const todosCompletos = this.currentFixture.partidos.every((m: any) => 
      this.mySelections.some(s => s.matchId === m.id && s.seleccion.length > 0)
    );

    // 3. No debe haber ningún partido con 0 o 3 selecciones
    const sinTriples = this.mySelections.every(s => s.seleccion.length === 1 || s.seleccion.length === 2);

    return doblesValidos && todosCompletos && sinTriples;
  }

  savePrediction() {
    const data = {
      fixtureId: this.selectedFixtureId,
      detalles: this.mySelections
    };
    this.loading = true;
    this.predictionService.savePrediction(data).subscribe({
      next: (data: any) => {
        alert('Jugada guardada correctamente');
        this.loading = false;
      },
      error: (err: any) => {
        alert(err.error?.message || 'Error al guardar');
        this.loading = false;
      }
    });
  }

  onSearch() {
    if (this.searchQuery.length < 2) {
      this.searchResults = [];
      return;
    }
    this.predictionService.searchPredictions(this.searchQuery, this.selectedFixtureId).subscribe(data => {
      this.searchResults = data;
    });
  }

  viewOtherPrediction(prediction: any) {
    this.viewingOther = prediction;
    this.searchResults = [];
    this.searchQuery = '';
  }

  getSelectionForMatch(prediction: any, matchId: string): string {
    const detail = prediction.detalles.find((d: any) => d.match.id === matchId);
    return detail ? detail.seleccion.join('/') : '-';
  }
}
