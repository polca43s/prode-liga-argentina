import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { PasswordRecoveryComponent } from './features/auth/password-recovery/password-recovery.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { ResultsComponent } from './features/results/results.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard.component';
import { TournamentManagerComponent } from './features/admin/tournaments/tournament-manager.component';
import { TeamManagerComponent } from './features/admin/teams/team-manager.component';
import { UserManagerComponent } from './features/admin/users/user-manager.component';
import { FixtureManagerComponent } from './features/admin/fixtures/fixture-manager.component';
import { MatchResultsComponent } from './features/admin/results/match-results.component';
import { PredictionSubmitComponent } from './features/predictions/prediction-submit.component';
import { AuthGuard, AdminGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'password-recovery', component: PasswordRecoveryComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'resultados', component: ResultsComponent, canActivate: [AuthGuard] },
  { path: 'jugada', component: PredictionSubmitComponent, canActivate: [AuthGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [AdminGuard] },
  { path: 'admin/tournaments', component: TournamentManagerComponent, canActivate: [AdminGuard] },
  { path: 'admin/fixtures', component: FixtureManagerComponent, canActivate: [AdminGuard] },
  { path: 'admin/teams', component: TeamManagerComponent, canActivate: [AdminGuard] },
  { path: 'admin/users', component: UserManagerComponent, canActivate: [AdminGuard] },
  { path: 'admin/results', component: MatchResultsComponent, canActivate: [AdminGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
