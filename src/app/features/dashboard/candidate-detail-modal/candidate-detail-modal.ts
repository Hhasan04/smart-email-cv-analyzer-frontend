import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { CandidatesService } from '../../../core/candidates/candidates.service';
import { CandidateDetail } from '../../../core/candidates/candidate.model';
import { latestAnalysis, scoreBadgeClasses } from '../../../core/candidates/score-badge.util';

@Component({
  selector: 'app-candidate-detail-modal',
  standalone: true,
  templateUrl: './candidate-detail-modal.html',
})
export class CandidateDetailModal {
  private readonly candidatesService = inject(CandidatesService);
  private readonly authService = inject(AuthService);

  readonly candidateId = input.required<string>();
  readonly close = output<void>();
  readonly deleted = output<void>();

  readonly detail = signal<CandidateDetail | null>(null);
  readonly loading = signal(true);
  readonly deleting = signal(false);
  readonly loadingResume = signal(false);

  readonly isAdmin = computed(() => this.authService.currentUser()?.role === 'ADMIN');

  readonly latestAnalysis = latestAnalysis;
  readonly scoreBadgeClasses = scoreBadgeClasses;

  constructor() {
    effect(() => {
      const id = this.candidateId();
      this.loading.set(true);
      this.detail.set(null);
      this.candidatesService.getById(id).subscribe((detail) => {
        this.detail.set(detail);
        this.loading.set(false);
      });
    });
  }

  viewResume(): void {
    const candidate = this.detail();
    if (!candidate || this.loadingResume()) {
      return;
    }

    this.loadingResume.set(true);
    this.candidatesService.getResume(candidate.id).subscribe({
      next: (blob) => {
        this.loadingResume.set(false);
        window.open(URL.createObjectURL(blob), '_blank');
      },
      error: () => {
        this.loadingResume.set(false);
      },
    });
  }

  remove(): void {
    const candidate = this.detail();
    if (!candidate || this.deleting()) {
      return;
    }
    if (!window.confirm(`Delete candidate "${candidate.fullName}"? This cannot be undone.`)) {
      return;
    }

    this.deleting.set(true);
    this.candidatesService.remove(candidate.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleted.emit();
      },
      error: () => {
        this.deleting.set(false);
      },
    });
  }
}
