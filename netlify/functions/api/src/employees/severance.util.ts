// Statutory severance pay under the Thai Labor Protection Act — tenure-based
// tiers only. This does NOT model cause-based exemptions (e.g. dismissal for
// serious misconduct forfeits severance entirely) — HR must judge that
// manually before relying on this figure. Daily rate uses the common
// simplified convention of monthly salary / 30, same "verify with an
// accountant" caveat as the rest of the payroll math (tax-engine.ts).

export interface SeveranceResult {
  yearsOfService: number;
  daysOfPay: number;
  dailyRate: number;
  amount: number;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysOfPayForTenure(yearsOfService: number, daysEmployed: number): number {
  if (yearsOfService >= 20) return 400;
  if (yearsOfService >= 10) return 300;
  if (yearsOfService >= 6) return 240;
  if (yearsOfService >= 3) return 180;
  if (yearsOfService >= 1) return 90;
  if (daysEmployed >= 120) return 30;
  return 0;
}

export function calculateSeverance(startDate: Date, endDate: Date, baseSalary: number): SeveranceResult {
  const daysEmployed = Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / MS_PER_DAY));
  const yearsOfService = Math.round((daysEmployed / 365) * 100) / 100;
  const daysOfPay = daysOfPayForTenure(yearsOfService, daysEmployed);
  const dailyRate = Math.round((baseSalary / 30) * 100) / 100;
  const amount = Math.round(dailyRate * daysOfPay * 100) / 100;

  return { yearsOfService, daysOfPay, dailyRate, amount };
}
