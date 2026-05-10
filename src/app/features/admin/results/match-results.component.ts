import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TournamentService } from '../../../core/services/tournament.service';
import { FixtureService } from '../../../core/services/fixture.service';
import { PredictionService } from '../../../core/services/prediction.service';
import { Tournament, Fixture, Match } from '../../../core/models/prode.models';

@Component({
  selector: 'app-match-results',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="manager-container">
      <div class="glass-card manager-card">
        <header class="manager-header">
          <div class="header-left">
            <button routerLink="/admin" class="btn-back">⬅ Volver</button>
            <h1>🏁 Cargar Resultados Reales</h1>
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
            <button *ngIf="selectedFixtureId" (click)="deleteFixture()" class="btn-danger-outline small">
              🗑️ Borrar Fecha
            </button>
          </div>
        </header>

        <div class="fixture-status-bar" *ngIf="currentFixture">
          <div class="visibility-toggle">
            <label class="switch">
              <input type="checkbox" [checked]="currentFixture.seeAll" (change)="toggleSeeAll()">
              <span class="slider round"></span>
            </label>
            <span class="status-label" [class.locked]="currentFixture.seeAll">
              {{ currentFixture.seeAll ? '🔒 Fecha Cerrada' : '🔓 Fecha por Jugar' }}
            </span>
          </div>
          <p class="status-desc">
            {{ currentFixture.seeAll ? 'Los usuarios ya no pueden editar sus jugadas.' : 'Los usuarios aún pueden editar sus jugadas.' }}
          </p>

          <div class="visibility-toggle" style="margin-top: 15px;">
            <label class="switch">
              <input type="checkbox" [checked]="currentFixture.countThis" (change)="toggleCountThis()">
              <span class="slider round"></span>
            </label>
            <span class="status-label" [class.locked]="currentFixture.countThis">
              {{ currentFixture.countThis ? '✅ Contar Fecha' : '⏳ No cuenta' }}
            </span>
          </div>
          <p class="status-desc">
            {{ currentFixture.countThis ? 'Las predicciones de esta fecha cuentan para la tabla general.' : 'Activar para que cuente en el ranking.' }}
          </p>
        </div>

        <div *ngIf="currentFixture" class="results-table">
          <div class="match-list">
            <div class="grid-header">
              <div>L</div><div></div><div>E</div><div></div><div>V</div>
            </div>

            <div *ngFor="let match of currentFixture.partidos" class="match-row">
              <button class="pred-btn" [class.active]="match.resultado === 'L'" (click)="setResult(match, 'L')"></button>
              
              <div class="team-container local">
                <span class="team-name">{{ match.local?.nombre }}</span>
                <img [src]="match.local?.escudo" class="escudo" *ngIf="match.local?.escudo">
              </div>

              <button class="pred-btn" [class.active]="match.resultado === 'E'" (click)="setResult(match, 'E')"></button>
              
              <div class="team-container visitante">
                <img [src]="match.visitante?.escudo" class="escudo" *ngIf="match.visitante?.escudo">
                <span class="team-name">{{ match.visitante?.nombre }}</span>
              </div>

              <div class="v-group">
                <button class="pred-btn" [class.active]="match.resultado === 'V'" (click)="setResult(match, 'V')"></button>
                <button class="btn-clear" (click)="setResult(match, null)" *ngIf="match.resultado" title="Borrar">✖</button>
              </div>
            </div>
          </div>

          <div class="actions">
            <button (click)="saveAllResults()" class="btn-primary w-full" [disabled]="loading">
              {{ loading ? 'Guardando...' : 'Guardar Todos los Resultados' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .manager-container { min-height: 100vh; background: radial-gradient(circle at top right, #1a2a3a 0%, #0d1117 100%); padding: 40px 20px; color: white; }
    .manager-card { max-width: 800px; margin: 0 auto; padding: 40px; }
    .manager-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .btn-back { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 8px 15px; border-radius: 8px; cursor: pointer; transition: 0.3s; }
    
    .selectors { display: flex; gap: 10px; align-items: center; }
    select { background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 8px; border-radius: 8px; }
    
    .match-list { 
      display: flex; flex-direction: column;
      background: var(--primary); border: 2px solid var(--primary);
      border-radius: 10px; overflow: hidden; margin-bottom: 30px; 
    }
    
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
      display: flex; justify-content: center; align-items: center; padding: 0; width: 100%; height: 100%;
    }
    .pred-btn:hover { background: rgba(116, 172, 223, 0.8); }
    .pred-btn.active { color: #111; }
    .pred-btn.active::before { content: 'X'; }

    .team-container { display: flex; align-items: center; gap: 10px; padding: 10px 15px; }
    .team-container.local { justify-content: flex-end; text-align: right; }
    .team-container.visitante { justify-content: flex-start; text-align: left; }
    .team-name { font-weight: 700; font-size: 0.95rem; }
    .escudo { width: 35px; height: 35px; object-fit: contain; }

    .v-group { position: relative; display: flex; width: 100%; height: 100%; }
    .btn-clear { position: absolute; right: -30px; top: 50%; transform: translateY(-50%); color: var(--danger); background: none; border: none; cursor: pointer; font-size: 1.2rem; }

    /* RESPONSIVE DESIGN */
    @media (max-width: 768px) {
      .manager-card { padding: 10px; border-radius: 12px; }
      .manager-header { flex-direction: column; align-items: stretch; text-align: center; gap: 15px; }
      
      .grid-header { grid-template-columns: 35px 1fr 35px 1fr 35px; font-size: 0.8rem; }
      .match-row { grid-template-columns: 35px 1fr 35px 1fr 35px; }
      
      .team-container { padding: 2px; gap: 3px; flex-direction: row !important; }
      .team-name { font-size: 0.65rem; line-height: 1.1; word-wrap: break-word; }
      .escudo { width: 18px; height: 18px; flex-shrink: 0; }
      
      .pred-btn { font-size: 1rem; }
      .btn-clear { right: -15px; font-size: 0.9rem; }
    }
    
    .fixture-status-bar { background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 1px solid rgba(255,255,255,0.1); }
    .visibility-toggle { display: flex; align-items: center; gap: 15px; margin-bottom: 5px; }
    .status-label { font-weight: 700; font-size: 1.1rem; color: #4ade80; }
    .status-label.locked { color: #f87171; }
    .status-desc { font-size: 0.85rem; color: var(--text-muted); margin-left: 55px; }

    .switch { position: relative; display: inline-block; width: 40px; height: 22px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #444; transition: .4s; border-radius: 22px; }
    .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
    input:checked + .slider { background-color: var(--primary); }
    input:checked + .slider:before { transform: translateX(18px); }
  `]
})
export class MatchResultsComponent implements OnInit {
  tournaments: Tournament[] = [];
  fixtures: Fixture[] = [];
  currentFixture: any = null;
  selectedTournamentId = '';
  selectedFixtureId = '';
  loading = false;

  constructor(
    private tournamentService: TournamentService,
    private fixtureService: FixtureService,
    public predictionService: PredictionService
  ) {}

  ngOnInit() { this.tournamentService.getTournaments().subscribe(data => this.tournaments = data); }
  onTournamentChange() { this.fixtureService.getFixturesByTournament(this.selectedTournamentId).subscribe(data => { this.fixtures = data; this.selectedFixtureId = ''; this.currentFixture = null; }); }
  onFixtureChange() { this.currentFixture = this.fixtures.find(f => f.id === this.selectedFixtureId); }
  
  toggleSeeAll() {
    this.currentFixture.seeAll = !this.currentFixture.seeAll;
    this.fixtureService.updateFixture(this.currentFixture.id, { seeAll: this.currentFixture.seeAll })
      .subscribe(() => {
        const msg = this.currentFixture.seeAll ? 'Fecha CERRADA: Ya nadie puede editar.' : 'Fecha POR JUGAR: Usuarios pueden editar.';
        console.log(msg);
      });
  }

  toggleCountThis() {
    this.currentFixture.countThis = !this.currentFixture.countThis;
    this.fixtureService.updateFixture(this.currentFixture.id, { countThis: this.currentFixture.countThis })
      .subscribe(() => {
        const msg = this.currentFixture.countThis ? '✓ Esta fecha ahora CUENTA en el ranking.' : '✗ Esta fecha ya NO cuenta en el ranking.';
        alert(msg);
      });
  }

  deleteFixture() { if (confirm('¿Borrar fecha y jugadas?')) this.fixtureService.deleteFixture(this.selectedFixtureId).subscribe(() => { this.selectedFixtureId = ''; this.currentFixture = null; this.onTournamentChange(); }); }
  setResult(match: any, result: string | null) { match.resultado = result; }
  saveAllResults() {
    this.loading = true;
    const promises = this.currentFixture.partidos.map((m: any) => this.fixtureService.updateMatchResult(m.id, m.resultado).toPromise());
    Promise.all(promises).then(() => { this.predictionService.recalculateRanking(this.selectedTournamentId).subscribe(() => { alert('Actualizado'); this.loading = false; }); });
  }
}
