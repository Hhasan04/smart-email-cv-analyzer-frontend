export type UserRole = 'ADMIN' | 'RECRUITER';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthResult {
  accessToken: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  role?: UserRole;
}
