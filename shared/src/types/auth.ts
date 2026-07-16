import type { MembershipRole } from "./roles";

export interface RegisterOrganizationRequest {
  organizationName: string;
  ownerName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  organizationName: string;
  role: MembershipRole;
}

export interface AuthResponse extends AuthTokens {
  user: AuthenticatedUser;
}
