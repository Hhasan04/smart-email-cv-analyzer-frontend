import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { JobPositionsService } from '../../core/job-positions/job-positions.service';
import { JobPosition } from '../../core/job-positions/job-position.model';
import { NavBar } from '../../shared/nav-bar/nav-bar';

type SkillType = 'required' | 'preferred';

@Component({
  selector: 'app-job-positions',
  standalone: true,
  imports: [ReactiveFormsModule, NavBar],
  templateUrl: './job-positions.html',
})
export class JobPositions implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly jobPositionsService = inject(JobPositionsService);
  private readonly authService = inject(AuthService);

  readonly jobPositions = this.jobPositionsService.jobPositions;
  readonly isAdmin = computed(() => this.authService.currentUser()?.role === 'ADMIN');

  readonly editingId = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly requiredSkills = signal<string[]>([]);
  readonly preferredSkills = signal<string[]>([]);
  readonly skillInput = signal('');
  readonly skillType = signal<SkillType>('required');

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    isActive: [true],
  });

  ngOnInit(): void {
    this.jobPositionsService.load().subscribe();
  }

  onSkillInputChange(event: Event): void {
    this.skillInput.set((event.target as HTMLInputElement).value);
  }

  onSkillTypeChange(event: Event): void {
    this.skillType.set((event.target as HTMLSelectElement).value as SkillType);
  }

  addSkill(): void {
    const skill = this.skillInput().trim();
    if (!skill) {
      return;
    }

    const target = this.skillType() === 'required' ? this.requiredSkills : this.preferredSkills;
    if (!target().includes(skill)) {
      target.update((skills) => [...skills, skill]);
    }
    this.skillInput.set('');
  }

  removeSkill(type: SkillType, skill: string): void {
    const target = type === 'required' ? this.requiredSkills : this.preferredSkills;
    target.update((skills) => skills.filter((s) => s !== skill));
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();
    const payload = {
      title: raw.title,
      description: raw.description,
      requiredSkills: this.requiredSkills(),
      preferredSkills: this.preferredSkills(),
      isActive: raw.isActive,
    };

    const request = this.editingId()
      ? this.jobPositionsService.update(this.editingId()!, payload)
      : this.jobPositionsService.create(payload);

    request.subscribe({
      next: () => {
        this.submitting.set(false);
        this.resetForm();
      },
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('Failed to save the job position.');
      },
    });
  }

  edit(jobPosition: JobPosition): void {
    this.editingId.set(jobPosition.id);
    this.form.setValue({
      title: jobPosition.title,
      description: jobPosition.description,
      isActive: jobPosition.isActive,
    });
    this.requiredSkills.set([...jobPosition.requiredSkills]);
    this.preferredSkills.set([...jobPosition.preferredSkills]);
  }

  cancelEdit(): void {
    this.resetForm();
  }

  toggleActive(jobPosition: JobPosition): void {
    this.jobPositionsService.toggleActive(jobPosition).subscribe();
  }

  remove(jobPosition: JobPosition): void {
    if (!window.confirm(`Delete "${jobPosition.title}"? This cannot be undone.`)) {
      return;
    }
    this.jobPositionsService.remove(jobPosition.id).subscribe();
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.form.reset({ title: '', description: '', isActive: true });
    this.requiredSkills.set([]);
    this.preferredSkills.set([]);
    this.skillInput.set('');
  }
}
