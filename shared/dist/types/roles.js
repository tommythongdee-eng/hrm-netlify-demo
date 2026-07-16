"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEMBERSHIP_ROLES = exports.MembershipRole = void 0;
// A const-object "pseudo-enum" instead of a TS `enum`. This is the single
// source of truth for valid roles now that Membership.role is a plain
// String column (SQLite has no native enum type — see apps/api schema.prisma).
exports.MembershipRole = {
    OWNER: "OWNER",
    HR_ADMIN: "HR_ADMIN",
    MANAGER: "MANAGER",
    EMPLOYEE: "EMPLOYEE",
};
exports.MEMBERSHIP_ROLES = Object.values(exports.MembershipRole);
