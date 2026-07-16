import type { Prisma } from "@prisma/client";

// Thai personal income tax brackets (progressive, annual net income, THB).
// Verify against the current Revenue Department table before real payroll use.
const DEFAULT_TAX_BRACKETS = [
  { minIncome: 0, maxIncome: 150_000, rate: 0, order: 1 },
  { minIncome: 150_000, maxIncome: 300_000, rate: 0.05, order: 2 },
  { minIncome: 300_000, maxIncome: 500_000, rate: 0.1, order: 3 },
  { minIncome: 500_000, maxIncome: 750_000, rate: 0.15, order: 4 },
  { minIncome: 750_000, maxIncome: 1_000_000, rate: 0.2, order: 5 },
  { minIncome: 1_000_000, maxIncome: 2_000_000, rate: 0.25, order: 6 },
  { minIncome: 2_000_000, maxIncome: 5_000_000, rate: 0.3, order: 7 },
  { minIncome: 5_000_000, maxIncome: null, rate: 0.35, order: 8 },
];

// Statutory minimums / common defaults under the Thai Labor Protection Act.
// HR can add more leave types (e.g. ordination leave) after setup.
const DEFAULT_LEAVE_TYPES = [
  { code: "ANNUAL", name: "Annual Leave", defaultDaysPerYear: 6, isPaid: true },
  { code: "SICK", name: "Sick Leave", defaultDaysPerYear: 30, isPaid: true },
  { code: "PERSONAL", name: "Personal Leave", defaultDaysPerYear: 3, isPaid: true },
  { code: "MATERNITY", name: "Maternity Leave", defaultDaysPerYear: 98, isPaid: true },
];

// Only fixed-date national holidays are seeded here — Buddhist observances
// (Makha Bucha, Visakha Bucha, Asalha Bucha, Buddhist Lent) follow the lunar
// calendar and shift every year, so HR should add those manually rather than
// trust a guessed date.
function defaultPublicHolidays(year: number): Array<{ date: Date; name: string }> {
  return [
    { date: new Date(Date.UTC(year, 0, 1)), name: "New Year's Day" },
    { date: new Date(Date.UTC(year, 3, 6)), name: "Chakri Memorial Day" },
    { date: new Date(Date.UTC(year, 3, 13)), name: "Songkran Festival" },
    { date: new Date(Date.UTC(year, 3, 14)), name: "Songkran Festival" },
    { date: new Date(Date.UTC(year, 3, 15)), name: "Songkran Festival" },
    { date: new Date(Date.UTC(year, 4, 1)), name: "National Labour Day" },
    { date: new Date(Date.UTC(year, 4, 4)), name: "Coronation Day" },
    { date: new Date(Date.UTC(year, 6, 28)), name: "H.M. King's Birthday" },
    { date: new Date(Date.UTC(year, 7, 12)), name: "H.M. Queen's Birthday / Mother's Day" },
    { date: new Date(Date.UTC(year, 9, 13)), name: "Anniversary of the Death of King Bhumibol" },
    { date: new Date(Date.UTC(year, 9, 23)), name: "Chulalongkorn Day" },
    { date: new Date(Date.UTC(year, 11, 5)), name: "Father's Day (King Bhumibol's Birthday)" },
    { date: new Date(Date.UTC(year, 11, 10)), name: "Constitution Day" },
    { date: new Date(Date.UTC(year, 11, 31)), name: "New Year's Eve" },
  ];
}

// Runs inside the same transaction as organization creation so a new tenant
// gets sensible Thai-market defaults (leave types, tax brackets, payroll
// settings, this year's fixed holidays) with nothing left half-configured.
export async function seedOrganizationDefaults(
  tx: Prisma.TransactionClient,
  organizationId: string,
  year: number = new Date().getFullYear(),
): Promise<void> {
  await tx.leaveType.createMany({
    data: DEFAULT_LEAVE_TYPES.map((lt) => ({ ...lt, organizationId })),
  });

  await tx.taxBracket.createMany({
    data: DEFAULT_TAX_BRACKETS.map((b) => ({ ...b, organizationId })),
  });

  await tx.payrollSettings.create({ data: { organizationId } });

  await tx.publicHoliday.createMany({
    data: defaultPublicHolidays(year).map((h) => ({ ...h, organizationId })),
  });
}
