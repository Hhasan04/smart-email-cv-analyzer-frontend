import { Injectable, computed, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Candidate, CandidateDetail, CandidateFilters, PaginatedCandidates } from './candidate.model';

@Injectable({ providedIn: 'root' })
export class CandidatesService {
  private readonly candidatesSignal = signal<Candidate[]>([]);
  readonly candidates = this.candidatesSignal.asReadonly();

  readonly searchTerm = signal('');

  readonly filteredCandidates = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.candidates();
    }
    return this.candidates().filter((c) => c.fullName.toLowerCase().includes(term));
  });

  constructor(private readonly http: HttpClient) {}

  load(filters: CandidateFilters = {}): Observable<PaginatedCandidates> {
    let params = new HttpParams();
    if (filters.jobPositionId) {
      params = params.set('jobPositionId', filters.jobPositionId);
    }
    if (filters.minScore !== undefined) {
      params = params.set('minScore', filters.minScore);
    }

    return this.http
      .get<PaginatedCandidates>(`${environment.apiUrl}/candidates`, { params })
      .pipe(tap((result) => this.candidatesSignal.set(result.data)));
  }

  getById(id: string): Observable<CandidateDetail> {
    return this.http.get<CandidateDetail>(`${environment.apiUrl}/candidates/${id}`);
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete<void>(`${environment.apiUrl}/candidates/${id}`)
      .pipe(tap(() => this.candidatesSignal.update((list) => list.filter((c) => c.id !== id))));
  }

  getResume(id: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/candidates/${id}/resume`, { responseType: 'blob' });
  }
}
