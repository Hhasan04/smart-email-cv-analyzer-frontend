import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-email-composer-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './email-composer-modal.html',
})
export class EmailComposerModal implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly title = input.required<string>();
  readonly initialSubject = input.required<string>();
  readonly initialBody = input.required<string>();
  readonly submitting = input(false);
  readonly sendError = input<string | null>(null);

  readonly close = output<void>();
  readonly send = output<{ subject: string; body: string }>();

  private readonly initialized = signal(false);

  readonly form = this.fb.nonNullable.group({
    subject: ['', [Validators.required]],
    body: ['', [Validators.required]],
  });

  ngOnInit(): void {
    if (!this.initialized()) {
      this.form.setValue({ subject: this.initialSubject(), body: this.initialBody() });
      this.initialized.set(true);
    }
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      return;
    }
    const raw = this.form.getRawValue();
    this.send.emit({ subject: raw.subject, body: raw.body });
  }
}
