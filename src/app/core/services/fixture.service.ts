import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Fixture, Match } from '../models/prode.models';
import { environment } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class FixtureService {
  private fixtureUrl = `${environment.baseURL}/api/fixtures`;
  private matchUrl = `${environment.baseURL}/api/matches`;

  constructor(private http: HttpClient) {}

  getFixturesByTournament(tournamentId: string): Observable<Fixture[]> {
    return this.http.get<Fixture[]>(`${this.fixtureUrl}/tournament/${tournamentId}`);
  }

  createFixture(fixture: any): Observable<Fixture> {
    return this.http.post<Fixture>(this.fixtureUrl, fixture);
  }

  updateFixture(id: string, data: any): Observable<Fixture> {
    return this.http.put<Fixture>(`${this.fixtureUrl}/${id}`, data);
  }

  deleteFixture(id: string): Observable<any> {
    return this.http.delete(`${this.fixtureUrl}/${id}`);
  }

  createMatch(match: any): Observable<Match> {
    return this.http.post<Match>(this.matchUrl, match);
  }

  deleteMatch(matchId: string): Observable<any> {
    return this.http.delete(`${this.matchUrl}/${matchId}`);
  }

  updateMatchResult(matchId: string, resultado: string | null): Observable<any> {
    return this.http.put(`${this.matchUrl}/${matchId}`, { resultado });
  }
}
