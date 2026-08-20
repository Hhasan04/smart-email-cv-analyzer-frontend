import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { GmailService } from '../../core/gmail/gmail.service';
import { JobPositionsService } from '../../core/job-positions/job-positions.service';
import { CandidatesService } from '../../core/candidates/candidates.service';
import { scoreBadgeClasses, latestAnalysis } from '../../core/candidates/score-badge.util';
import {
  EmailTemplatesService,
  fillTemplate,
} from '../../core/email-templates/email-templates.service';
import { CandidateDetailModal } from './candidate-detail-modal/candidate-detail-modal';
import { EmailComposerModal } from './email-composer-modal/email-composer-modal';
import { NavBar } from '../../shared/nav-bar/nav-bar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CandidateDetailModal, EmailComposerModal, NavBar],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  readonly gmailService = inject(GmailService);
  readonly jobPositionsService = inject(JobPositionsService);
  readonly candidatesService = inject(CandidatesService);
  private readonly emailTemplatesService = inject(EmailTemplatesService);

  readonly selectedJobPositionId = signal('');
  readonly selectedCandidateId = signal<string | null>(null);

  readonly startingWatch = signal(false);
  readonly watchError = signal<string | null>(null);

  readonly showRejectionComposer = signal(false);
  readonly rejectionSubject = signal('');
  readonly rejectionBody = signal('');
  readonly rejecting = signal(false);
  readonly rejectError = signal<string | null>(null);

  readonly scoreBadgeClasses = scoreBadgeClasses;
  readonly latestAnalysis = latestAnalysis;

  readonly allVisibleSelected = computed(() => {
    const visible = this.candidatesService.filteredCandidates();
    const selected = this.candidatesService.selectedIds();
    return visible.length > 0 && visible.every((c) => selected.has(c.id));
  });

  ngOnInit(): void {
    this.gmailService.refreshStatus().subscribe();
    this.jobPositionsService.load().subscribe();
    this.candidatesService.load().subscribe();
  }

  connectGmail(): void {
    this.gmailService.connect();
  }

  startWatch(): void {
    this.startingWatch.set(true);
    this.watchError.set(null);

    this.gmailService.startWatch().subscribe({
      next: () => {
        this.startingWatch.set(false);
        this.gmailService.refreshStatus().subscribe();
      },
      error: () => {
        this.startingWatch.set(false);
        this.watchError.set('Failed to start watching the inbox. Check the backend logs.');
      },
    });
  }

  onJobPositionFilterChange(event: Event): void {
    const jobPositionId = (event.target as HTMLSelectElement).value;
    this.selectedJobPositionId.set(jobPositionId);
    this.candidatesService.load(jobPositionId ? { jobPositionId } : {}).subscribe();
  }

  onSearchInput(event: Event): void {
    this.candidatesService.searchTerm.set((event.target as HTMLInputElement).value);
  }

  openCandidate(id: string): void {
    this.selectedCandidateId.set(id);
  }

  closeCandidateModal(): void {
    this.selectedCandidateId.set(null);
  }

  onCandidateReevaluated(): void {
    this.candidatesService
      .load(this.selectedJobPositionId() ? { jobPositionId: this.selectedJobPositionId() } : {})
      .subscribe();
  }

  toggleSelect(id: string, event: Event): void {
    event.stopPropagation();
    this.candidatesService.toggleSelect(id);
  }

  toggleSelectAll(): void {
    this.candidatesService.toggleSelectAll();
  }

  openRejectionComposer(): void {
    this.rejectError.set(null);
    this.emailTemplatesService.load('REJECTION').subscribe((templates) => {
      const template = templates[0];
      const values = { candidateName: 'there', jobTitle: 'the role' };
      this.rejectionSubject.set(template ? fillTemplate(template.subject, values) : '');
      this.rejectionBody.set(template ? fillTemplate(template.bodyTemplate, values) : '');
      this.showRejectionComposer.set(true);
    });
  }

  closeRejectionComposer(): void {
    this.showRejectionComposer.set(false);
  }

  submitBulkReject(payload: { subject: string; body: string }): void {
    const candidateIds = [...this.candidatesService.selectedIds()];
    if (candidateIds.length === 0) {
      return;
    }

    this.rejecting.set(true);
    this.rejectError.set(null);

    this.candidatesService.bulkReject(candidateIds, payload.subject, payload.body).subscribe({
      next: () => {
        this.rejecting.set(false);
        this.showRejectionComposer.set(false);
        this.candidatesService.clearSelection();
        this.candidatesService
          .load(this.selectedJobPositionId() ? { jobPositionId: this.selectedJobPositionId() } : {})
          .subscribe();
      },
      error: () => {
        this.rejecting.set(false);
        this.rejectError.set('Failed to send rejection emails. Check your Gmail connection.');
      },
    });
  }
}
