export interface JobPosition {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobPositionPayload {
  title: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  isActive?: boolean;
}

export type UpdateJobPositionPayload = Partial<CreateJobPositionPayload>;
