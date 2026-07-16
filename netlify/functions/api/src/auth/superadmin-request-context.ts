// Deliberately a separate shape from RequestUser (auth/request-context.ts) —
// a superadmin has no organizationId/role, since they operate outside every
// tenant's scope entirely. Kept distinct rather than making those fields
// optional on RequestUser, so every existing tenant-scoped guard/service can
// keep assuming organizationId is always present.
export interface SuperAdminUser {
  sub: string; // userId
  isSuperAdmin: true;
}
