// A const-object "pseudo-enum" instead of a TS `enum`. This is the single
// source of truth for valid roles now that Membership.role is a plain
// String column (SQLite has no native enum type — see apps/api schema.prisma).
export const MembershipRole = {
  OWNER: "OWNER",
  HR_ADMIN: "HR_ADMIN",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
} as const;

export type MembershipRole = (typeof MembershipRole)[keyof typeof MembershipRole];

export const MEMBERSHIP_ROLES: MembershipRole[] = Object.values(MembershipRole);
