import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GmailStatus, GoogleAuthUrl } from './gmail.model';

@Injectable({ providedIn: 'root' })
export class GmailService {
  private readonly statusSignal = signal<GmailStatus | null>(null);
  readonly status = this.statusSignal.asReadonly();

  constructor(private readonly http: HttpClient) {}

  refreshStatus(): Observable<GmailStatus> {
    return this.http
      .get<GmailStatus>(`${environment.apiUrl}/auth/google/status`)
      .pipe(tap((status) => this.statusSignal.set(status)));
  }

  getAuthUrl(): Observable<GoogleAuthUrl> {
    return this.http.get<GoogleAuthUrl>(`${environment.apiUrl}/auth/google/url`);
  }

  startWatch(): Observable<{ historyId: string }> {
    return this.http.post<{ historyId: string }>(`${environment.apiUrl}/gmail/watch`, {});
  }

  connect(): void {
    this.getAuthUrl().subscribe((result) => {
      window.location.href = result.url;
    });
  }
}
