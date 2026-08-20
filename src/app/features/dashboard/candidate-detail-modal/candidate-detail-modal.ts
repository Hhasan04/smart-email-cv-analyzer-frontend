import { Component, computed, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { CandidatesService } from '../../../core/candidates/candidates.service';
import { CandidateDetail, CandidateStatus } from '../../../core/candidates/candidate.model';
import { latestAnalysis, scoreBadgeClasses } from '../../../core/candidates/score-badge.util';
import { JobPositionsService } from '../../../core/job-positions/job-positions.service';
import {
  EmailTemplatesService,
  fillTemplate,
} from '../../../core/email-templates/email-templates.service';
import { EmailComposerModal } from '../email-composer-modal/email-composer-modal';

@Component({
  selector: 'app-candidate-detail-modal',
  standalone: true,
  imports: [EmailComposerModal],
  templateUrl: './candidate-detail-modal.html',
})
export class CandidateDetailModal implements OnInit {
  private readonly candidatesService = inject(CandidatesService);
  private readonly authService = inject(AuthService);
  private readonly jobPositionsService = inject(JobPositionsService);
  private readonly emailTemplatesService = inject(EmailTemplatesService);

  readonly candidateId = input.required<string>();
  readonly close = output<void>();
  readonly deleted = output<void>();
  readonly reevaluated = output<void>();

  readonly detail = signal<CandidateDetail | null>(null);
  readonly loading = signal(true);
  readonly deleting = signal(false);
  readonly loadingResume = signal(false);

  readonly jobPositions = this.jobPositionsService.jobPositions;
  readonly reevaluateTargetId = signal('');
  readonly reevaluating = signal(false);
  readonly reevaluateMessage = signal<string | null>(null);
  readonly reevaluateError = signal<string | null>(null);

  readonly updatingStatus = signal(false);

  readonly showComposer = signal(false);
  readonly composerSubject = signal('');
  readonly composerBody = signal('');
  readonly sendingEmail = signal(false);
  readonly sendEmailError = signal<string | null>(null);

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

  ngOnInit(): void {
    this.jobPositionsService.load().subscribe();
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

  onStatusChange(event: Event): void {
    const candidate = this.detail();
    if (!candidate) {
      return;
    }
    const status = (event.target as HTMLSelectElement).value as CandidateStatus;

    this.updatingStatus.set(true);
    this.candidatesService.updateStatus(candidate.id, status).subscribe({
      next: (updated) => {
        this.updatingStatus.set(false);
        this.detail.update((current) => (current ? { ...current, status: updated.status } : current));
      },
      error: () => {
        this.updatingStatus.set(false);
      },
    });
  }

  onReevaluateTargetChange(event: Event): void {
    this.reevaluateTargetId.set((event.target as HTMLSelectElement).value);
  }

  reevaluate(): void {
    const candidate = this.detail();
    const targetJobPositionId = this.reevaluateTargetId();
    if (!candidate || !targetJobPositionId || this.reevaluating()) {
      return;
    }

    this.reevaluating.set(true);
    this.reevaluateMessage.set(null);
    this.reevaluateError.set(null);

    this.candidatesService.reevaluate(candidate.id, targetJobPositionId).subscribe({
      next: (result) => {
        this.reevaluating.set(false);
        const score = latestAnalysis(result.cvAnalyses)?.matchScore;
        this.reevaluateMessage.set(
          `Re-evaluated — ${score ?? '?'}% match for ${result.jobPosition?.title ?? 'the selected job'}.`,
        );
        this.reevaluated.emit();
      },
      error: () => {
        this.reevaluating.set(false);
        this.reevaluateError.set('Could not re-evaluate this candidate. Please try again.');
      },
    });
  }

  openComposer(): void {
    const candidate = this.detail();
    if (!candidate) {
      return;
    }

    this.sendEmailError.set(null);
    this.emailTemplatesService.load('OUTREACH').subscribe((templates) => {
      const template = templates[0];
      const values = { candidateName: candidate.fullName, jobTitle: candidate.jobPosition?.title ?? 'the role' };
      this.composerSubject.set(template ? fillTemplate(template.subject, values) : '');
      this.composerBody.set(template ? fillTemplate(template.bodyTemplate, values) : '');
      this.showComposer.set(true);
    });
  }

  closeComposer(): void {
    this.showComposer.set(false);
  }

  sendEmail(payload: { subject: string; body: string }): void {
    const candidate = this.detail();
    if (!candidate) {
      return;
    }

    this.sendingEmail.set(true);
    this.sendEmailError.set(null);

    this.candidatesService.sendEmail(candidate.id, payload.subject, payload.body).subscribe({
      next: () => {
        this.sendingEmail.set(false);
        this.showComposer.set(false);
      },
      error: () => {
        this.sendingEmail.set(false);
        this.sendEmailError.set('Failed to send the email. Check your Gmail connection.');
      },
    });
  }
}
