import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResult, AuthUser, LoginPayload, RegisterPayload } from './auth.model';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenSignal = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly userSignal = signal<AuthUser | null>(readStoredUser());

  readonly token = this.tokenSignal.asReadonly();
  readonly currentUser = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.tokenSignal() !== null);

  constructor(private readonly http: HttpClient) {}

  login(payload: LoginPayload): Observable<AuthResult> {
    return this.http
      .post<AuthResult>(`${environment.apiUrl}/auth/login`, payload)
      .pipe(tap((result) => this.setSession(result)));
  }

  register(payload: RegisterPayload): Observable<AuthResult> {
    return this.http
      .post<AuthResult>(`${environment.apiUrl}/auth/register`, payload)
      .pipe(tap((result) => this.setSession(result)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }

  private setSession(result: AuthResult): void {
    localStorage.setItem(TOKEN_KEY, result.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    this.tokenSignal.set(result.accessToken);
    this.userSignal.set(result.user);
  }
}

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}
