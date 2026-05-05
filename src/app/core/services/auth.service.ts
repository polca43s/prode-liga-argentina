import { Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../constants';

const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutos en milisegundos
const LAST_ACTIVITY_KEY = 'lastActivity';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.baseURL}/api/users`;
  
  currentUser = signal<any>(null);
  token = signal<string | null>(localStorage.getItem('token'));
  private sessionExpired = signal<boolean>(false);
  private timeoutId: any;

  constructor(private http: HttpClient, private router: Router) {
    this.initSessionMonitor();
    
    effect(() => {
      if (this.token()) {
        this.loadUserFromToken();
      }
    });
  }

  private loadUserFromToken() {
    const token = this.token();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentUser.set(payload.user || null);
      } catch {
        this.currentUser.set(null);
      }
    }
  }

  private initSessionMonitor() {
    if (typeof window !== 'undefined') {
      this.updateLastActivity();
      
      ['click', 'keypress', 'mousemove', 'scroll'].forEach(event => {
        window.addEventListener(event, () => this.updateLastActivity());
      });

      setInterval(() => this.checkSession(), 60000); // Check cada minuto
    }
  }

  private updateLastActivity() {
    if (this.token()) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    }
  }

  private checkSession() {
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (lastActivity && this.token()) {
      const elapsed = Date.now() - parseInt(lastActivity);
      if (elapsed > SESSION_TIMEOUT) {
        this.sessionExpired.set(true);
        this.logout('Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.');
      }
    }
  }

  login(credentials: any) {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        this.currentUser.set(res.user);
        this.token.set(res.token);
        localStorage.setItem('token', res.token);
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
        this.sessionExpired.set(false);
      })
    );
  }

  register(userData: any) {
    return this.http.post<any>(`${this.apiUrl}/register`, userData);
  }

  logout(message?: string) {
    this.currentUser.set(null);
    this.token.set(null);
    localStorage.removeItem('token');
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    this.sessionExpired.set(false);
    
    if (message) {
      alert(message);
    }
    this.router.navigate(['/login']);
  }

  requestPasswordReset(email: string) {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword });
  }

  isLoggedIn() {
    return !!this.token();
  }

  isAdmin() {
    return this.currentUser()?.tipo === 'ADMIN';
  }

  getCurrentUser() {
    return this.currentUser();
  }

isSessionExpired() {
    return this.sessionExpired();
  }
}
