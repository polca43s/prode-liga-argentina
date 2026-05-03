import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PredictionService {
  private apiUrl = 'http://localhost:3001/api/predictions';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  savePrediction(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data, { headers: this.getHeaders() });
  }

  getMyPrediction(fixtureId: string): Observable<any> {
    // Ya no necesitamos el userId en la URL, el servidor lo saca del token
    return this.http.get(`${this.apiUrl}/my/${fixtureId}`, { headers: this.getHeaders() });
  }

  searchPredictions(query: string, fixtureId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/search?query=${query}&fixtureId=${fixtureId}`);
  }

  getGeneralRanking(tournamentId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ranking/tournament/${tournamentId}`);
  }

  recalculateRanking(tournamentId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/recalculate/${tournamentId}`, {}, { headers: this.getHeaders() });
  }
}
