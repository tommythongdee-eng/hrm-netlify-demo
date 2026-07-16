export declare const MembershipRole: {
    readonly OWNER: "OWNER";
    readonly HR_ADMIN: "HR_ADMIN";
    readonly MANAGER: "MANAGER";
    readonly EMPLOYEE: "EMPLOYEE";
};
export type MembershipRole = (typeof MembershipRole)[keyof typeof MembershipRole];
export declare const MEMBERSHIP_ROLES: MembershipRole[];
