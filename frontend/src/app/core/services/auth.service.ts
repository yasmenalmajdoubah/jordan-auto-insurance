import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

export interface LoginResponse {
  token: string;
  userName: string;
  fullName: string;
  role: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:5213/api';
  readonly currentUser = signal<LoginResponse | null>(this.readStored());

  constructor(private http: HttpClient, private router: Router) {}

  login(userName: string, password: string) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { userName, password }).pipe(
      tap((res) => {
        localStorage.setItem('jai_auth', JSON.stringify(res));
        this.currentUser.set(res);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('jai_auth');
    this.currentUser.set(null);
    this.router.navigateByUrl('/login');
  }

  get token(): string | null {
    return this.currentUser()?.token ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  private readStored(): LoginResponse | null {
    const raw = localStorage.getItem('jai_auth');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as LoginResponse;
    } catch {
      return null;
    }
  }
}
