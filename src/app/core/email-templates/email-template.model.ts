export type EmailTemplateType = 'OUTREACH' | 'REJECTION';

export interface EmailTemplate {
  id: string;
  title: string;
  type: EmailTemplateType;
  subject: string;
  bodyTemplate: string;
  createdAt: string;
  updatedAt: string;
}
