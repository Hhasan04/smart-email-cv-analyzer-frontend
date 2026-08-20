export interface JobPosition {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  isActive: boolean;
  skillsWeight: number;
  experienceWeight: number;
  educationWeight: number;
  customPromptTemplate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobPositionPayload {
  title: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  isActive?: boolean;
  skillsWeight?: number;
  experienceWeight?: number;
  educationWeight?: number;
  customPromptTemplate?: string;
}

export type UpdateJobPositionPayload = Partial<CreateJobPositionPayload>;
