"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionStatus = exports.OrganizationStatus = void 0;
exports.OrganizationStatus = {
    ACTIVE: "ACTIVE",
    SUSPENDED: "SUSPENDED",
};
// No payment gateway in this phase — this tracks intent/state only, and is
// set manually by the superadmin, never by a billing webhook.
exports.SubscriptionStatus = {
    TRIALING: "TRIALING",
    ACTIVE: "ACTIVE",
    PAST_DUE: "PAST_DUE",
    CANCELED: "CANCELED",
};
