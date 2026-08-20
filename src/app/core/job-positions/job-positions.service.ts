import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateJobPositionPayload,
  JobPosition,
  UpdateJobPositionPayload,
} from './job-position.model';

@Injectable({ providedIn: 'root' })
export class JobPositionsService {
  private readonly jobPositionsSignal = signal<JobPosition[]>([]);
  readonly jobPositions = this.jobPositionsSignal.asReadonly();

  constructor(private readonly http: HttpClient) {}

  load(): Observable<JobPosition[]> {
    return this.http
      .get<JobPosition[]>(`${environment.apiUrl}/job-positions`)
      .pipe(tap((list) => this.jobPositionsSignal.set(list)));
  }

  create(payload: CreateJobPositionPayload): Observable<JobPosition> {
    return this.http
      .post<JobPosition>(`${environment.apiUrl}/job-positions`, payload)
      .pipe(tap((created) => this.jobPositionsSignal.update((list) => [created, ...list])));
  }

  update(id: string, payload: UpdateJobPositionPayload): Observable<JobPosition> {
    return this.http
      .patch<JobPosition>(`${environment.apiUrl}/job-positions/${id}`, payload)
      .pipe(
        tap((updated) =>
          this.jobPositionsSignal.update((list) =>
            list.map((jp) => (jp.id === updated.id ? updated : jp)),
          ),
        ),
      );
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete<void>(`${environment.apiUrl}/job-positions/${id}`)
      .pipe(tap(() => this.jobPositionsSignal.update((list) => list.filter((jp) => jp.id !== id))));
  }

  toggleActive(jobPosition: JobPosition): Observable<JobPosition> {
    return this.update(jobPosition.id, { isActive: !jobPosition.isActive });
  }
}
