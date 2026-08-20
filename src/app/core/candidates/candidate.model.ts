export interface CvAnalysis {
  id: string;
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  summaryText: string;
  createdAt: string;
}

export interface EmailMetadataSummary {
  id: string;
  subject: string;
  bodyText: string;
  senderEmail: string;
  receivedAt: string;
  status: string;
}

export interface CandidateJobPosition {
  id: string;
  title: string;
}

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  parsedCvText: string | null;
  resumeFileName: string | null;
  jobPositionId: string | null;
  jobPosition: CandidateJobPosition | null;
  cvAnalyses: CvAnalysis[];
  createdAt: string;
}

export interface CandidateDetail extends Candidate {
  emailMetadata: EmailMetadataSummary[];
}

export interface PaginatedCandidates {
  data: Candidate[];
  total: number;
  page: number;
  limit: number;
}

export interface CandidateFilters {
  jobPositionId?: string;
  minScore?: number;
}
