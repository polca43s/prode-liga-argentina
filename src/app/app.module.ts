import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
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

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    LoginComponent,
    RegisterComponent,
    PasswordRecoveryComponent,
    ResultsComponent,
    AdminDashboardComponent,
    TournamentManagerComponent,
    TeamManagerComponent,
    UserManagerComponent,
    FixtureManagerComponent,
    PredictionSubmitComponent,
    MatchResultsComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
