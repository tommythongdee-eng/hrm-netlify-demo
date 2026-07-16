export declare const OrganizationStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly SUSPENDED: "SUSPENDED";
};
export type OrganizationStatus = (typeof OrganizationStatus)[keyof typeof OrganizationStatus];
export declare const SubscriptionStatus: {
    readonly TRIALING: "TRIALING";
    readonly ACTIVE: "ACTIVE";
    readonly PAST_DUE: "PAST_DUE";
    readonly CANCELED: "CANCELED";
};
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
