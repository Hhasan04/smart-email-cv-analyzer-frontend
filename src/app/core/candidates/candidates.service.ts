import { Injectable, computed, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BulkRejectResult,
  Candidate,
  CandidateDetail,
  CandidateFilters,
  CandidateStatus,
  PaginatedCandidates,
} from './candidate.model';

@Injectable({ providedIn: 'root' })
export class CandidatesService {
  private readonly candidatesSignal = signal<Candidate[]>([]);
  readonly candidates = this.candidatesSignal.asReadonly();

  readonly searchTerm = signal('');
  readonly selectedIds = signal<Set<string>>(new Set());

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

  reevaluate(id: string, targetJobPositionId: string): Observable<CandidateDetail> {
    return this.http.post<CandidateDetail>(`${environment.apiUrl}/candidates/${id}/reevaluate`, {
      targetJobPositionId,
    });
  }

  updateStatus(id: string, status: CandidateStatus): Observable<Candidate> {
    return this.http
      .patch<Candidate>(`${environment.apiUrl}/candidates/${id}/status`, { status })
      .pipe(
        tap((updated) =>
          this.candidatesSignal.update((list) =>
            list.map((c) => (c.id === updated.id ? updated : c)),
          ),
        ),
      );
  }

  sendEmail(id: string, subject: string, body: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/candidates/${id}/send-email`, {
      subject,
      body,
    });
  }

  bulkReject(candidateIds: string[], subject: string, body: string): Observable<BulkRejectResult> {
    return this.http.post<BulkRejectResult>(`${environment.apiUrl}/candidates/bulk-reject`, {
      candidateIds,
      subject,
      body,
    });
  }

  toggleSelect(id: string): void {
    this.selectedIds.update((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  toggleSelectAll(): void {
    const visible = this.filteredCandidates();
    const allSelected = visible.length > 0 && visible.every((c) => this.selectedIds().has(c.id));
    this.selectedIds.set(allSelected ? new Set() : new Set(visible.map((c) => c.id)));
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }
}
