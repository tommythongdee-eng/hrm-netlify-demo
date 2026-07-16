import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { MembershipRole } from "@hrm/shared";
import { seedOrganizationDefaults } from "../src/organizations/seed-defaults";

const prisma = new PrismaClient();

const DEMO_ORG_SLUG = "demo-sme";
const DEMO_OWNER_EMAIL = "owner@demo-sme.local";
const DEMO_OWNER_PASSWORD = "Demo1234!";

const SUPERADMIN_EMAIL = "superadmin@hrm-platform.local";
const SUPERADMIN_PASSWORD = "SuperAdmin1234!";

// Platform-level product tiers — not tenant data, so seeded unconditionally
// rather than tied to any one organization's existence.
const PLANS = [
  { code: "FREE", name: "Free", maxEmployees: 5, priceThbPerMonth: 0 },
  { code: "STARTER", name: "Starter", maxEmployees: 25, priceThbPerMonth: 990 },
  { code: "PRO", name: "Pro", maxEmployees: 1_000_000, priceThbPerMonth: 2_990 },
];

async function seedPlans(): Promise<{ freePlanId: string }> {
  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      create: plan,
      update: { name: plan.name, maxEmployees: plan.maxEmployees, priceThbPerMonth: plan.priceThbPerMonth },
    });
  }
  const freePlan = await prisma.plan.findUniqueOrThrow({ where: { code: "FREE" } });
  return { freePlanId: freePlan.id };
}

async function seedSuperAdmin(): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email: SUPERADMIN_EMAIL } });
  if (existing) {
    if (!existing.isSuperAdmin) {
      await prisma.user.update({ where: { id: existing.id }, data: { isSuperAdmin: true } });
    }
    return;
  }
  const passwordHash = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);
  await prisma.user.create({
    data: { email: SUPERADMIN_EMAIL, passwordHash, name: "Platform Superadmin", isSuperAdmin: true },
  });
  console.log("Seeded superadmin account:");
  console.log(`  login email:    ${SUPERADMIN_EMAIL}`);
  console.log(`  login password: ${SUPERADMIN_PASSWORD}`);
}

async function main() {
  const { freePlanId } = await seedPlans();
  await seedSuperAdmin();

  const existing = await prisma.organization.findUnique({
    where: { slug: DEMO_ORG_SLUG },
    include: { payrollSettings: true },
  });

  if (existing) {
    console.log(`Demo organization "${DEMO_ORG_SLUG}" already exists.`);
    // Backfill Phase 1 defaults for orgs created before that logic existed.
    if (!existing.payrollSettings) {
      await prisma.$transaction((tx) => seedOrganizationDefaults(tx, existing.id));
      console.log("Backfilled Phase 1 defaults (leave types, tax brackets, payroll settings, holidays).");
    }
    // Backfill Phase 3: orgs created before plans existed had no planId.
    if (!existing.planId) {
      await prisma.organization.update({ where: { id: existing.id }, data: { planId: freePlanId } });
      console.log("Backfilled Phase 3 default (assigned FREE plan).");
    }
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_OWNER_PASSWORD, 10);

  const organization = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: { name: "Demo SME Co.", slug: DEMO_ORG_SLUG, planId: freePlanId },
    });

    const owner = await tx.user.create({
      data: { email: DEMO_OWNER_EMAIL, passwordHash, name: "Demo Owner" },
    });

    await tx.membership.create({
      data: { userId: owner.id, organizationId: organization.id, role: MembershipRole.OWNER },
    });

    await seedOrganizationDefaults(tx, organization.id);

    return organization;
  });

  console.log("Seeded demo organization and owner:");
  console.log(`  organization: ${organization.name} (${organization.slug})`);
  console.log(`  login email:    ${DEMO_OWNER_EMAIL}`);
  console.log(`  login password: ${DEMO_OWNER_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
