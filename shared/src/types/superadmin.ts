import type { OrganizationStatus, SubscriptionStatus } from "./billing";

export interface SuperAdminLoginRequest {
  email: string;
  password: string;
}

export interface SuperAdminAuthResponse {
  accessToken: string;
  name: string;
}

export interface OrganizationMembershipDto {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
}

export interface OrganizationSummaryDto {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  subscriptionStatus: SubscriptionStatus;
  planName: string | null;
  employeeCount: number;
  createdAt: string;
}

export interface OrganizationDetailDto extends OrganizationSummaryDto {
  memberships: OrganizationMembershipDto[];
}

export interface AssignPlanRequest {
  planId: string;
}
