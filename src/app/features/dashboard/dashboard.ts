import { Component, inject, OnInit, signal } from '@angular/core';
import { GmailService } from '../../core/gmail/gmail.service';
import { JobPositionsService } from '../../core/job-positions/job-positions.service';
import { CandidatesService } from '../../core/candidates/candidates.service';
import { scoreBadgeClasses, latestAnalysis } from '../../core/candidates/score-badge.util';
import { CandidateDetailModal } from './candidate-detail-modal/candidate-detail-modal';
import { NavBar } from '../../shared/nav-bar/nav-bar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CandidateDetailModal, NavBar],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  readonly gmailService = inject(GmailService);
  readonly jobPositionsService = inject(JobPositionsService);
  readonly candidatesService = inject(CandidatesService);

  readonly selectedJobPositionId = signal('');
  readonly selectedCandidateId = signal<string | null>(null);

  readonly startingWatch = signal(false);
  readonly watchError = signal<string | null>(null);

  readonly scoreBadgeClasses = scoreBadgeClasses;
  readonly latestAnalysis = latestAnalysis;

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
}
