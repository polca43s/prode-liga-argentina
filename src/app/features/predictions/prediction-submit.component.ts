import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentService } from '../../core/services/tournament.service';
import { FixtureService } from '../../core/services/fixture.service';
import { PredictionService } from '../../core/services/prediction.service';
import { AuthService } from '../../core/services/auth.service';
import { PdfService } from '../../core/services/pdf.service';
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
            <div class="user-session">
              <span class="logged-nickname" *ngIf="currentUser()">👤 {{ currentUser()?.nickname }}</span>
              <button (click)="logout()" class="btn-logout-user">Cerrar Sesión 🚪</button>
            </div>
          </div>
          <div class="selectors" *ngIf="tournaments.length > 1">
            <select [(ngModel)]="selectedTournamentId" (change)="onTournamentChange()">
              <option value="" disabled>Torneo...</option>
              <option *ngFor="let t of tournaments" [value]="t.id">{{ t.nombre }}</option>
            </select>
          </div>

          <!-- TABS PRINCIPALES -->
          <div class="global-tabs" *ngIf="tournaments.length > 0">
            <button routerLink="/resultados" class="global-tab-btn outline">📊 Posiciones y Resultados</button>
            <button [class.active]="true" class="global-tab-btn active">✍️ Hacer mi próxima jugada</button>
          </div>
          
          <!-- SELECTOR DE FECHA -->
          <div class="fixture-selector" *ngIf="selectedTournamentId">
            <select [(ngModel)]="selectedFixtureId" (change)="onFixtureChange()">
              <option value="" disabled>Selecciona la Fecha a Jugar...</option>
              <option *ngFor="let f of fixtures" [value]="f.id">{{ f.nombre }}</option>
            </select>
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
              <div class="grid-header">
                <div>L</div><div></div><div>E</div><div></div><div>V</div>
              </div>
              <div *ngFor="let match of currentFixture.partidos" class="match-row">
                <div class="pred-btn" [class.active]="getSelectionForMatch(viewingOther, match.id).includes('L')"></div>
                
                <div class="team-container local">
                  <span class="team-name">{{ match.local.nombre }}</span>
                  <img [src]="match.local.escudo" class="escudo" *ngIf="match.local.escudo">
                </div>

                <div class="pred-btn" [class.active]="getSelectionForMatch(viewingOther, match.id).includes('E')"></div>
                
                <div class="team-container visitante">
                  <img [src]="match.visitante.escudo" class="escudo" *ngIf="match.visitante.escudo">
                  <span class="team-name">{{ match.visitante.nombre }}</span>
                </div>

                <div class="pred-btn" [class.active]="getSelectionForMatch(viewingOther, match.id).includes('V')"></div>
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
              <!-- Grid Header -->
              <div class="grid-header">
                <div>L</div>
                <div></div>
                <div>E</div>
                <div></div>
                <div>V</div>
              </div>

              <!-- Partidos -->
              <div *ngFor="let match of currentFixture.partidos" class="match-row">
                <!-- Columna L -->
                <button class="pred-btn" 
                        [class.active]="hasSelection(match.id, 'L')" 
                        (click)="toggleSelection(match.id, 'L')" 
                        [disabled]="currentFixture.seeAll">
                </button>
                
                <!-- Equipo Local -->
                <div class="team-container local">
                  <span class="team-name">{{ match.local.nombre }}</span>
                  <img [src]="match.local.escudo" class="escudo" *ngIf="match.local.escudo">
                </div>

                <!-- Columna E -->
                <button class="pred-btn" 
                        [class.active]="hasSelection(match.id, 'E')" 
                        (click)="toggleSelection(match.id, 'E')" 
                        [disabled]="currentFixture.seeAll">
                </button>
                
                <!-- Equipo Visitante -->
                <div class="team-container visitante">
                  <img [src]="match.visitante.escudo" class="escudo" *ngIf="match.visitante.escudo">
                  <span class="team-name">{{ match.visitante.nombre }}</span>
                </div>

                <!-- Columna V -->
                <button class="pred-btn" 
                        [class.active]="hasSelection(match.id, 'V')" 
                        (click)="toggleSelection(match.id, 'V')" 
                        [disabled]="currentFixture.seeAll">
                </button>
              </div>
            </div>

          <div *ngIf="!currentFixture.seeAll" class="actions">
            <p *ngIf="!isValidJugada() && mySelections.length > 0" class="global-error">
              Debes completar todos los partidos y usar exactamente {{ getTorneoActual()?.cantidadDobles }} dobles.
            </p>
            <button (click)="savePrediction()" class="btn-primary w-full" [disabled]="loading || !isValidJugada()">
              {{ loading ? 'Guardando...' : 'Guardar Jugada' }}
            </button>
            <button *ngIf="currentFixture && currentFixture.partidos && currentFixture.partidos.length > 0" 
                    (click)="downloadMyPredictionPdf()" 
                    class="btn-secondary w-full" 
                    style="margin-top: 10px;">
              📥 Descargar Mi Jugada PDF
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
    .user-session { display: flex; align-items: center; gap: 12px; }
    .logged-nickname { color: rgba(255,255,255,0.75); font-size: 0.9rem; font-weight: 600; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); padding: 6px 14px; border-radius: 20px; }
    .btn-logout-user { background: rgba(220, 53, 69, 0.1); border: 1px solid rgba(220, 53, 69, 0.3); color: #ff4d4d; padding: 8px 16px; border-radius: 10px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: 0.3s; }
    .btn-logout-user:hover { background: rgba(220, 53, 69, 0.2); transform: translateY(-2px); }
    
    .global-tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; }
    .global-tab-btn { flex: 1; padding: 15px; border: none; background: rgba(116, 172, 223, 0.1); color: var(--primary); cursor: pointer; border-radius: 12px; font-weight: 700; font-size: 1rem; transition: 0.3s; }
    .global-tab-btn.outline { background: transparent; border: 1px dashed rgba(255,255,255,0.2); color: white; opacity: 0.8; }
    .global-tab-btn.outline:hover { background: rgba(255,255,255,0.05); opacity: 1; transform: translateY(-2px); }

    .selectors { display: flex; gap: 10px; margin-bottom: 20px; }
    select { background: rgba(255,255,255,0.05); color: #000; border: 1px solid rgba(255,255,255,0.2); padding: 10px; border-radius: 8px; font-size: 0.9rem; }
    
    .fixture-selector { margin: 15px 0; }
    .fixture-selector select { width: 100%; padding: 12px; font-size: 1rem; font-weight: 600; background: rgba(116, 172, 223, 0.1); border-color: var(--primary); }



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

    .match-list { 
      display: flex; flex-direction: column;
      background: var(--primary); border: 2px solid var(--primary);
      border-radius: 10px; overflow: hidden; margin-bottom: 30px; 
    }
    .match-list.disabled { opacity: 0.8; }
    
    .grid-header {
      display: grid; grid-template-columns: 50px 1fr 50px 1fr 50px;
      background-color: var(--primary); color: white; font-weight: 900; text-align: center;
      border-bottom: 3px solid rgba(0,0,0,0.2);
    }
    .grid-header > div { padding: 10px 0; }

    .match-row {
      display: grid; grid-template-columns: 50px 1fr 50px 1fr 50px;
      background: #fdfdfd; color: #111;
      border-bottom: 2px solid rgba(0, 0, 0, 0.15);
    }
    .match-row:last-child { border-bottom: none; }
    .match-row:nth-child(even) { background: #f4f4f4; }
    
    .pred-btn {
      background: var(--primary); border: none; border-left: 1px solid rgba(0,0,0,0.15); border-right: 1px solid rgba(0,0,0,0.15);
      color: transparent; font-weight: 900; font-size: 1.5rem; cursor: pointer; transition: 0.2s;
      display: flex; justify-content: center; align-items: center; padding: 0;
    }
    .pred-btn:hover:not(:disabled) { background: rgba(116, 172, 223, 0.8); }
    .pred-btn.active { color: #111; }
    .pred-btn.active::before { content: 'X'; }
    .pred-btn:disabled { cursor: default; }

    .team-container { display: flex; align-items: center; gap: 10px; padding: 10px 15px; }
    .team-container.local { justify-content: flex-end; text-align: right; }
    .team-container.visitante { justify-content: flex-start; text-align: left; }
    .team-name { font-weight: 700; font-size: 0.95rem; }
    .escudo { width: 35px; height: 35px; object-fit: contain; }

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

    .w-full { width: 100%; }
    .btn-secondary { background: rgba(108, 117, 125, 0.2); border: 1px solid rgba(108, 117, 125, 0.5); color: #fff; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.95rem; }
    .btn-secondary:hover { background: rgba(108, 117, 125, 0.3); }

    /* RESPONSIVE DESIGN */
    @media (max-width: 768px) {
      .prediction-container { padding: 5px; }
      .main-card { padding: 10px; border-radius: 12px; }
      .header { flex-direction: column; align-items: stretch; text-align: center; }
      .selectors { flex-direction: column; }
      
      .grid-header { grid-template-columns: 35px 1fr 35px 1fr 35px; font-size: 0.8rem; }
      .match-row { grid-template-columns: 35px 1fr 35px 1fr 35px; }
      
      .team-container { padding: 2px; gap: 3px; flex-direction: row !important; }
      .team-name { font-size: 0.65rem; line-height: 1.1; word-wrap: break-word; }
      .escudo { width: 18px; height: 18px; flex-shrink: 0; }
      
      .pred-btn { font-size: 1rem; }
      .view-header { flex-direction: column; gap: 10px; text-align: center; }
    }
  `]
})
export class PredictionSubmitComponent implements OnInit {
  tournaments: Tournament[] = [];
  fixtures: Fixture[] = [];
  currentFixture: any = null;
  
  selectedTournamentId = '';
  selectedFixtureId = '';
  
  mySelections: any[] = [];
  myPrediction: any = null;
  loading = false;
  
  searchQuery = '';
  searchResults: any[] = [];
  viewingOther: any = null;

  currentUser = this.authService.currentUser;

  constructor(
    private tournamentService: TournamentService,
    private fixtureService: FixtureService,
    private predictionService: PredictionService,
    private authService: AuthService,
    private pdfService: PdfService
  ) {}

  downloadMyPredictionPdf() {
    let detalles: any[] = [];
    
    if (this.myPrediction && this.myPrediction.detalles && this.myPrediction.detalles.length > 0) {
      detalles = this.myPrediction.detalles;
    } else if (this.mySelections.length > 0 && this.currentFixture) {
      // Si no hay prediction guardada pero hay selecciones actuales, usar esas
      detalles = this.currentFixture.partidos.map((m: any) => {
        const sel = this.mySelections.find(s => s.matchId === m.id);
        return {
          match: m,
          seleccion: sel ? sel.seleccion : ''
        };
      });
    }
    
    if (detalles.length === 0) return;
    
    const fixture = this.fixtures.find(f => f.id === this.selectedFixtureId);
    const user = this.authService.getCurrentUser();
    this.pdfService.generatePredictionPdf(user, fixture, detalles, fixture?.nombre || '');
  }

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.tournamentService.getTournamentsByUser(user.id).subscribe((data: any) => {
        this.tournaments = data;
        
        // Memoria de selección
        const lastTournamentId = localStorage.getItem('lastSelectedTournamentId');
        if (lastTournamentId && this.tournaments.some(t => t.id === lastTournamentId)) {
          this.selectedTournamentId = lastTournamentId;
          this.onTournamentChange();
        } else if (this.tournaments.length > 0) {
          this.selectedTournamentId = this.tournaments[0].id;
          this.onTournamentChange();
        }
      });
    }
  }

  logout() {
    this.authService.logout();
  }

  onTournamentChange() {
    if (this.selectedTournamentId) {
      localStorage.setItem('lastSelectedTournamentId', this.selectedTournamentId);
    }
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
    this.myPrediction = null;
    if (!this.selectedFixtureId) return;

    this.predictionService.getMyPrediction(this.selectedFixtureId).subscribe((data: any) => {
      if (data && data.detalles) {
        this.myPrediction = data;
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
