import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { GmailService } from '../../core/gmail/gmail.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  readonly authService = inject(AuthService);
  readonly gmailService = inject(GmailService);

  ngOnInit(): void {
    this.gmailService.refreshStatus().subscribe();
  }

  connectGmail(): void {
    this.gmailService.connect();
  }
}
