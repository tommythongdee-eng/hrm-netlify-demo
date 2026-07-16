export const OrganizationStatus = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;
export type OrganizationStatus = (typeof OrganizationStatus)[keyof typeof OrganizationStatus];

// No payment gateway in this phase — this tracks intent/state only, and is
// set manually by the superadmin, never by a billing webhook.
export const SubscriptionStatus = {
  TRIALING: "TRIALING",
  ACTIVE: "ACTIVE",
  PAST_DUE: "PAST_DUE",
  CANCELED: "CANCELED",
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export interface PlanDto {
  id: string;
  code: string;
  name: string;
  maxEmployees: number;
  priceThbPerMonth: number;
}

export interface BillingSummaryDto {
  plan: PlanDto | null;
  subscriptionStatus: SubscriptionStatus;
  employeeCount: number;
}
