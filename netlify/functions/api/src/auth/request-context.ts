import type { MembershipRole } from "@hrm/shared";

// Shape of the JWT access token payload, and of `request.user` once the
// JwtAuthGuard has run. organizationId/role come from the token so every
// downstream handler gets tenant scoping for free without another DB call.
export interface RequestUser {
  sub: string; // userId
  email: string;
  organizationId: string;
  role: MembershipRole;
}
