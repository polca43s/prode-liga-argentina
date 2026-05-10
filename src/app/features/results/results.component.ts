import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentService } from '../../core/services/tournament.service';
import { FixtureService } from '../../core/services/fixture.service';
import { PredictionService } from '../../core/services/prediction.service';
import { AuthService } from '../../core/services/auth.service';
import { Tournament, Fixture } from '../../core/models/prode.models';
import { RouterModule } from '@angular/router';
import { PdfService } from '../../core/services/pdf.service';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="results-container">
      <div class="glass-card main-card">
        <header class="header">
          <div class="header-main">
            <h1>🏆 Tablas de Posiciones</h1>
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
        </header>

        <div *ngIf="selectedTournamentId" class="content">
          <!-- TABS PRINCIPALES -->
          <div class="global-tabs">
            <button [class.active]="true" class="global-tab-btn active">📊 Posiciones y Resultados</button>
            <button routerLink="/jugada" class="global-tab-btn outline">✍️ Hacer mi próxima jugada</button>
          </div>

          <!-- SUB-TABS TABLAS -->
          <div class="tabs">
            <button [class.active]="activeTab === 'fecha'" (click)="activeTab = 'fecha'">📅 Por Fecha</button>
            <button [class.active]="activeTab === 'general'" (click)="activeTab = 'general'; loadGeneralRanking()">🏆 Tabla General</button>
          </div>

          <!-- FILTROS POR FECHA -->
          <div *ngIf="activeTab === 'fecha'" class="tab-filters">
            <select [(ngModel)]="selectedFixtureId" (change)="onFixtureChange()">
              <option value="" disabled>Seleccionar Fecha...</option>
              <option *ngFor="let f of fixtures" [value]="f.id">{{ f.nombre }}</option>
            </select>
          </div>

          <div class="search-bar" *ngIf="activeTab === 'general' || (activeTab === 'fecha' && currentFixture?.seeAll)">
            <input type="text" [(ngModel)]="searchQuery" (input)="onSearch()" placeholder="Buscar jugador...">
          </div>

          <!-- BOTONES DESCARGAR PDF -->
          <div class="download-buttons" style="margin: 15px 0; display: flex; gap: 10px;">
            <button *ngIf="activeTab === 'general' && ranking.length > 0" (click)="downloadGeneralPdf()" class="btn-download">
              📥 Descargar Tabla General PDF
            </button>
            <button *ngIf="activeTab === 'fecha' && ranking.length > 0" (click)="downloadFixturePdf()" class="btn-download">
              📥 Descargar Posiciones PDF
            </button>
          </div>

          <!-- MODO FECHA PRIVADA -->
          <div *ngIf="activeTab === 'fecha' && currentFixture && !currentFixture.seeAll" class="locked-message">
             <div class="icon">⌛</div>
             <p>Esta fecha aún es privada. Los resultados se mostrarán cuando el admin cierre la jugada.</p>
          </div>

          <!-- TABLA -->
          <div class="ranking-table-container" *ngIf="shouldShowTable()">
            <table class="ranking-table">
              <thead>
                <tr *ngIf="activeTab === 'fecha'">
                  <th>#</th>
                  <th>Jugador</th>
                  <th class="stat">L</th>
                  <th class="stat">E</th>
                  <th class="stat">V</th>
                  <th class="points">PUNTOS</th>
                </tr>
                <tr *ngIf="activeTab === 'general'">
                  <th>#</th>
                  <th>Jugador</th>
                  <th class="stat" title="Fechas Ganadas">FG</th>
                  <th class="stat">L</th>
                  <th class="stat">E</th>
                  <th class="stat">V</th>
                  <th class="points">PUNTOS</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of displayRanking; let i = index" [class.top-three]="getOriginalPosition(p) < 3">
                  <td class="rank">#{{ getOriginalPosition(p) }}</td>
                  <td class="player">
                    <div class="player-info">
                      <span class="nick" [title]="p.user.nombre + (p.user.apellido ? ' ' + p.user.apellido.charAt(0) + '.' : '')">{{ p.user.nickname }}</span>
                    </div>
                  </td>
                  
                  <!-- Columnas para Fecha -->
                  <ng-container *ngIf="activeTab === 'fecha'">
                    <td class="stat">{{ p.stats?.L || 0 }}</td>
                    <td class="stat">{{ p.stats?.E || 0 }}</td>
                    <td class="stat">{{ p.stats?.V || 0 }}</td>
                    <td class="points-val">{{ p.puntos || 0 }}</td>
                  </ng-container>

                  <!-- Columnas para General -->
                  <ng-container *ngIf="activeTab === 'general'">
                    <td class="stat fg">{{ p.fechasGanadas || 0 }}</td>
                    <td class="stat">{{ p.local || 0 }}</td>
                    <td class="stat">{{ p.empate || 0 }}</td>
                    <td class="stat">{{ p.visita || 0 }}</td>
                    <td class="points-val">{{ p.puntos || 0 }}</td>
                  </ng-container>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .results-container { min-height: 100vh; background: radial-gradient(circle at top right, #0a111a 0%, #020408 100%); padding: 40px 20px; color: white; }
    .main-card { width: 100%; max-width: 900px; margin: 0 auto; padding: 40px; }
    .header { margin-bottom: 20px; }
    .header-main { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .user-session { display: flex; align-items: center; gap: 12px; }
    .logged-nickname { color: rgba(255,255,255,0.75); font-size: 0.9rem; font-weight: 600; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); padding: 6px 14px; border-radius: 20px; }
    .btn-logout-user { background: rgba(220, 53, 69, 0.1); border: 1px solid rgba(220, 53, 69, 0.3); color: #ff4d4d; padding: 8px 16px; border-radius: 10px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: 0.3s; }
    .btn-logout-user:hover { background: rgba(220, 53, 69, 0.2); transform: translateY(-2px); }
    .btn-download { background: rgba(40, 167, 69, 0.2); border: 1px solid rgba(40, 167, 69, 0.5); color: #28a745; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem; }
    .btn-download:hover { background: rgba(40, 167, 69, 0.3); }
    
    .global-tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; }
    .global-tab-btn { flex: 1; padding: 15px; border: none; background: rgba(116, 172, 223, 0.1); color: var(--primary); cursor: pointer; border-radius: 12px; font-weight: 700; font-size: 1rem; transition: 0.3s; }
    .global-tab-btn.outline { background: transparent; border: 1px dashed rgba(255,255,255,0.2); color: white; opacity: 0.8; }
    .global-tab-btn.outline:hover { background: rgba(255,255,255,0.05); opacity: 1; transform: translateY(-2px); }

    .tabs { display: flex; gap: 5px; margin-bottom: 30px; background: rgba(255,255,255,0.05); padding: 5px; border-radius: 12px; }
    .tabs button { flex: 1; padding: 12px; border: none; background: none; color: #fff; cursor: pointer; border-radius: 8px; font-weight: 600; transition: 0.3s; }
    .tabs button.active { background: var(--primary); box-shadow: 0 4px 15px rgba(var(--primary-rgb), 0.3); }
      .ranking-table-container {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

    /* RESPONSIVE DESIGN */
    @media (max-width: 768px) {
      .results-container { padding: 10px; }
      .main-card { padding: 20px; }
      .header { flex-direction: column; text-align: center; }
            .ranking-table {
        display: block;
        overflow-x: auto;
        width: 100%;
        -webkit-overflow-scrolling: touch;
      }
      /* NEW: keep all columns on small screens with horizontal scroll */
      .ranking-table {
        display: block;
        overflow-x: auto;
        width: 100%;
        -webkit-overflow-scrolling: touch;
      }
      .ranking-table th, .ranking-table td {
        white-space: nowrap;
        font-size: 0.75rem;
        padding: 8px 10px;
      }
      .rank-number {
        width: 30px;
        height: 30px;
        font-size: 0.75rem;
      }
      .stat, .points-val { width: auto; min-width: 40px; }
      .rank { font-size: 1rem; }
      .nick { font-size: 0.85rem; }
      .full-name { font-size: 0.65rem; }

    }

    .tab-filters { margin-bottom: 20px; }
    select { background: rgba(255,255,255,0.05); color: #000; border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; width: 100%; }

    .search-bar { margin-bottom: 25px; }
    .search-bar input { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 15px 25px; border-radius: 30px; color: white; }

    .ranking-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
    .ranking-table th { padding: 10px 15px; text-align: left; color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase; }
    .ranking-table td { padding: 15px; background: rgba(255,255,255,0.02); }
    .ranking-table tr td:first-child { border-radius: 12px 0 0 12px; }
    .ranking-table tr td:last-child { border-radius: 0 12px 12px 0; }

    .rank { font-weight: 900; color: var(--primary); font-size: 1.1rem; width: 50px; }
    .nick { font-weight: 600; cursor: help; border-bottom: 1px dotted rgba(255,255,255,0.3); }
    .full-name { font-size: 0.7rem; color: var(--text-muted); }
    .stat { text-align: center; color: #aaa; width: 60px; }
    .fg { color: #ffc107; font-weight: 700; }
    .points-val { text-align: center; font-weight: 900; font-size: 1.3rem; color: var(--primary); width: 100px; }
    
    .top-three td { background: rgba(255,255,255,0.05); }
    .top-three .rank { color: #ffd700; text-shadow: 0 0 10px rgba(255,215,0,0.3); }

    .locked-message { text-align: center; padding: 40px; background: rgba(255,255,255,0.02); border-radius: 20px; border: 1px dashed rgba(255,255,255,0.1); margin-top: 20px; }
  `]
})
export class ResultsComponent implements OnInit {
  tournaments: Tournament[] = [];
  fixtures: Fixture[] = [];
  currentFixture: any = null;
  
  activeTab: 'fecha' | 'general' = 'general';
  selectedTournamentId = '';
  selectedFixtureId = '';
  searchQuery = '';
  
  ranking: any[] = [];
  displayRanking: any[] = [];

  currentUser = this.authService.currentUser;

  constructor(
    private tournamentService: TournamentService,
    private fixtureService: FixtureService,
    private predictionService: PredictionService,
    private authService: AuthService,
    private pdfService: PdfService
  ) {}

  downloadGeneralPdf() {
    const tournament = this.tournaments.find(t => t.id === this.selectedTournamentId);
    this.pdfService.generateGeneralRankingPdf(this.ranking, tournament?.nombre || 'Torneo');
  }

  downloadFixturePdf() {
    const fixture = this.fixtures.find(f => f.id === this.selectedFixtureId);
    this.pdfService.generateFixtureRankingPdf(this.ranking, fixture?.nombre || 'Fecha');
  }

  logout() {
    this.authService.logout();
  }

  ngOnInit() {
    this.tournamentService.getTournaments().subscribe(data => {
      this.tournaments = data;
      
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

  onTournamentChange() {
    if (this.selectedTournamentId) {
      localStorage.setItem('lastSelectedTournamentId', this.selectedTournamentId);
    }
    this.fixtureService.getFixturesByTournament(this.selectedTournamentId).subscribe(data => {
      this.fixtures = data;
      this.selectedFixtureId = '';
      this.currentFixture = null;
      this.ranking = [];
      this.displayRanking = [];
      if (this.activeTab === 'general') this.loadGeneralRanking();
    });
  }

  onFixtureChange() {
    this.currentFixture = this.fixtures.find(f => f.id === this.selectedFixtureId);
    this.loadFixtureRanking();
  }

  loadFixtureRanking() {
    if (!this.selectedFixtureId) return;
    this.predictionService.searchPredictions(this.searchQuery, this.selectedFixtureId).subscribe(data => {
      this.ranking = data.sort((a, b) => {
        const aPuntos = a.puntos || 0;
        const bPuntos = b.puntos || 0;
        if (bPuntos !== aPuntos) return bPuntos - aPuntos;
        const aV = a.stats?.V || 0;
        const bV = b.stats?.V || 0;
        if (bV !== aV) return bV - aV;
        const aE = a.stats?.E || 0;
        const bE = b.stats?.E || 0;
        if (bE !== aE) return bE - aE;
        const aL = a.stats?.L || 0;
        const bL = b.stats?.L || 0;
        return bL - aL;
      });
      this.displayRanking = [...this.ranking];
    });
  }

  loadGeneralRanking() {
    if (!this.selectedTournamentId) return;
    this.predictionService.getGeneralRanking(this.selectedTournamentId).subscribe(data => {
      this.ranking = data.sort((a, b) => {
        if ((b.puntos || 0) !== (a.puntos || 0)) return (b.puntos || 0) - (a.puntos || 0);
        if ((b.fechasGanadas || 0) !== (a.fechasGanadas || 0)) return (b.fechasGanadas || 0) - (a.fechasGanadas || 0);
        if ((b.visita || 0) !== (a.visita || 0)) return (b.visita || 0) - (a.visita || 0);
        if ((b.empate || 0) !== (a.empate || 0)) return (b.empate || 0) - (a.empate || 0);
        return (b.local || 0) - (a.local || 0);
      });
      this.displayRanking = [...this.ranking];
    });
  }

  onSearch() {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.displayRanking = [...this.ranking];
      return;
    }
    this.displayRanking = this.ranking.filter(r => 
      r.user.nickname.toLowerCase().includes(q) || 
      r.user.nombre.toLowerCase().includes(q)
    );
  }

  getOriginalPosition(player: any): number {
    const index = this.ranking.findIndex(r => r.user.id === player.user.id);
    return index + 1;
  }

  shouldShowTable(): boolean {
    if (this.activeTab === 'general') return this.ranking.length > 0;
    return this.currentFixture && this.currentFixture.seeAll;
  }
}
