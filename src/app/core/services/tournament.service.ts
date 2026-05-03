import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tournament } from '../models/prode.models';
import { environment } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class TournamentService {
  private apiUrl = `${environment.baseURL}/api/tournaments`;

  constructor(private http: HttpClient) {}

  getTournaments(): Observable<Tournament[]> {
    return this.http.get<Tournament[]>(this.apiUrl);
  }

  getTournamentsByUser(userId: string): Observable<Tournament[]> {
    return this.http.get<Tournament[]>(`${this.apiUrl}/user/${userId}`);
  }

  createTournament(tournament: any): Observable<Tournament> {
    return this.http.post<Tournament>(this.apiUrl, tournament);
  }

  updateTournament(id: string, tournament: any): Observable<Tournament> {
    return this.http.put<Tournament>(`${this.apiUrl}/${id}`, tournament);
  }

  deleteTournament(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
