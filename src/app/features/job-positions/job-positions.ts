import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { JobPositionsService } from '../../core/job-positions/job-positions.service';
import { JobPosition } from '../../core/job-positions/job-position.model';
import { NavBar } from '../../shared/nav-bar/nav-bar';

type SkillType = 'required' | 'preferred';

const DEFAULT_SKILLS_WEIGHT = 50;
const DEFAULT_EXPERIENCE_WEIGHT = 30;
const DEFAULT_EDUCATION_WEIGHT = 20;

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

  readonly skillsWeight = signal(DEFAULT_SKILLS_WEIGHT);
  readonly experienceWeight = signal(DEFAULT_EXPERIENCE_WEIGHT);
  readonly educationWeight = signal(DEFAULT_EDUCATION_WEIGHT);

  readonly weightTotal = computed(
    () => this.skillsWeight() + this.experienceWeight() + this.educationWeight(),
  );

  readonly weightStatus = computed<'over' | 'under' | 'valid'>(() => {
    const total = this.weightTotal();
    if (total > 100) return 'over';
    if (total < 100) return 'under';
    return 'valid';
  });

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    isActive: [true],
    customPromptTemplate: [''],
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

  onSkillsWeightChange(event: Event): void {
    this.skillsWeight.set(Number((event.target as HTMLInputElement).value));
  }

  onExperienceWeightChange(event: Event): void {
    this.experienceWeight.set(Number((event.target as HTMLInputElement).value));
  }

  onEducationWeightChange(event: Event): void {
    this.educationWeight.set(Number((event.target as HTMLInputElement).value));
  }

  submit(): void {
    if (this.form.invalid || this.submitting() || this.weightStatus() !== 'valid') {
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
      skillsWeight: this.skillsWeight(),
      experienceWeight: this.experienceWeight(),
      educationWeight: this.educationWeight(),
      customPromptTemplate: raw.customPromptTemplate.trim() || undefined,
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
      customPromptTemplate: jobPosition.customPromptTemplate ?? '',
    });
    this.requiredSkills.set([...jobPosition.requiredSkills]);
    this.preferredSkills.set([...jobPosition.preferredSkills]);
    this.skillsWeight.set(jobPosition.skillsWeight);
    this.experienceWeight.set(jobPosition.experienceWeight);
    this.educationWeight.set(jobPosition.educationWeight);
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
    this.form.reset({ title: '', description: '', isActive: true, customPromptTemplate: '' });
    this.requiredSkills.set([]);
    this.preferredSkills.set([]);
    this.skillInput.set('');
    this.skillsWeight.set(DEFAULT_SKILLS_WEIGHT);
    this.experienceWeight.set(DEFAULT_EXPERIENCE_WEIGHT);
    this.educationWeight.set(DEFAULT_EDUCATION_WEIGHT);
  }
}
