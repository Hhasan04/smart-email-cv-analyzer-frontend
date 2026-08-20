import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EmailTemplate, EmailTemplateType } from './email-template.model';

@Injectable({ providedIn: 'root' })
export class EmailTemplatesService {
  constructor(private readonly http: HttpClient) {}

  load(type?: EmailTemplateType): Observable<EmailTemplate[]> {
    let params = new HttpParams();
    if (type) {
      params = params.set('type', type);
    }
    return this.http.get<EmailTemplate[]>(`${environment.apiUrl}/email-templates`, { params });
  }
}

export function fillTemplate(
  template: string,
  values: { candidateName: string; jobTitle: string },
): string {
  return template
    .replace(/{{\s*candidateName\s*}}/g, values.candidateName)
    .replace(/{{\s*jobTitle\s*}}/g, values.jobTitle);
}
