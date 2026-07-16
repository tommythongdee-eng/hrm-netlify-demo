// Simplified Thai payroll math. Real ภ.ง.ด.1 withholding depends on
// per-employee deductions (dependents, spouse, insurance, provident fund,
// etc.) that this Phase 1 engine does not model — it applies only the
// standard expense deduction and a flat personal allowance. Verify with an
// accountant before running real payroll; rates/brackets are configurable
// per organization specifically so they can be corrected without a redeploy.

export interface TaxBracketInput {
  minIncome: number;
  maxIncome: number | null;
  rate: number;
}

export interface SocialSecuritySettings {
  employeeRate: number;
  employerRate: number;
  wageFloor: number;
  wageCeiling: number;
}

export interface SocialSecurityResult {
  employeeContribution: number;
  employerContribution: number;
}

export interface ProvidentFundSettings {
  employeeRate: number;
  employerRate: number;
}

export interface ProvidentFundResult {
  employeeContribution: number;
  employerContribution: number;
}

const STANDARD_EXPENSE_DEDUCTION_RATE = 0.5;
const STANDARD_EXPENSE_DEDUCTION_CAP = 100_000;
const PERSONAL_ALLOWANCE = 60_000;

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateSocialSecurity(wage: number, settings: SocialSecuritySettings): SocialSecurityResult {
  if (wage <= 0) {
    return { employeeContribution: 0, employerContribution: 0 };
  }
  const contributoryWage = Math.min(Math.max(wage, settings.wageFloor), settings.wageCeiling);
  return {
    employeeContribution: round2(contributoryWage * settings.employeeRate),
    employerContribution: round2(contributoryWage * settings.employerRate),
  };
}

// Provident fund is opt-in per employee (Employee.providentFundOptIn) and
// off by default at the org level — callers only invoke this once both are
// confirmed true. Unlike SSF there's no wage floor/ceiling in real PF rules.
export function calculateProvidentFund(wage: number, settings: ProvidentFundSettings): ProvidentFundResult {
  if (wage <= 0) {
    return { employeeContribution: 0, employerContribution: 0 };
  }
  return {
    employeeContribution: round2(wage * settings.employeeRate),
    employerContribution: round2(wage * settings.employerRate),
  };
}

export function calculateAnnualTax(taxableIncome: number, brackets: TaxBracketInput[]): number {
  if (taxableIncome <= 0) return 0;
  const sorted = [...brackets].sort((a, b) => a.minIncome - b.minIncome);

  let tax = 0;
  for (const bracket of sorted) {
    if (taxableIncome <= bracket.minIncome) break;
    const upper = bracket.maxIncome ?? Infinity;
    const amountInBracket = Math.min(taxableIncome, upper) - bracket.minIncome;
    if (amountInBracket > 0) {
      tax += amountInBracket * bracket.rate;
    }
  }
  return tax;
}

// Annualizes the given month's gross pay (x12), applies the standard expense
// deduction + flat personal allowance + this month's deductible contributions
// (SSF employee side, and provident fund employee side when opted in — both
// are pre-tax deductions under real Thai rules, also annualized), then
// de-annualizes the resulting tax.
export function calculateMonthlyWithholdingTax(
  monthlyGrossPay: number,
  monthlyDeductibleContributions: number,
  brackets: TaxBracketInput[],
): number {
  if (monthlyGrossPay <= 0) return 0;

  const annualIncome = monthlyGrossPay * 12;
  const expenseDeduction = Math.min(annualIncome * STANDARD_EXPENSE_DEDUCTION_RATE, STANDARD_EXPENSE_DEDUCTION_CAP);
  const annualContributions = monthlyDeductibleContributions * 12;
  const taxableIncome = Math.max(0, annualIncome - expenseDeduction - PERSONAL_ALLOWANCE - annualContributions);

  const annualTax = calculateAnnualTax(taxableIncome, brackets);
  return round2(annualTax / 12);
}
