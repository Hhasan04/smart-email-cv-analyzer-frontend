import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GmailService } from '../../core/gmail/gmail.service';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  templateUrl: './google-callback.html',
})
export class GoogleCallback implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly gmailService = inject(GmailService);

  readonly success = signal(false);

  ngOnInit(): void {
    const status = this.route.snapshot.queryParamMap.get('status');
    this.success.set(status === 'success');

    if (this.success()) {
      this.gmailService.refreshStatus().subscribe();
    }

    setTimeout(() => this.router.navigateByUrl('/dashboard'), 2500);
  }
}
