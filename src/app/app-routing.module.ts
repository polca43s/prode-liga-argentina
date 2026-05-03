import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { PasswordRecoveryComponent } from './features/auth/password-recovery/password-recovery.component';
import { ResultsComponent } from './features/results/results.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard.component';
import { TournamentManagerComponent } from './features/admin/tournaments/tournament-manager.component';
import { TeamManagerComponent } from './features/admin/teams/team-manager.component';
import { UserManagerComponent } from './features/admin/users/user-manager.component';
import { FixtureManagerComponent } from './features/admin/fixtures/fixture-manager.component';
import { MatchResultsComponent } from './features/admin/results/match-results.component';
import { PredictionSubmitComponent } from './features/predictions/prediction-submit.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'password-recovery', component: PasswordRecoveryComponent },
  { path: 'resultados', component: ResultsComponent },
  { path: 'jugada', component: PredictionSubmitComponent },
  { path: 'admin', component: AdminDashboardComponent },
  { path: 'admin/tournaments', component: TournamentManagerComponent },
  { path: 'admin/fixtures', component: FixtureManagerComponent },
  { path: 'admin/teams', component: TeamManagerComponent },
  { path: 'admin/users', component: UserManagerComponent },
  { path: 'admin/results', component: MatchResultsComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
