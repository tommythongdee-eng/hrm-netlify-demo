export const PayrollRunStatus = {
  DRAFT: "DRAFT",
  FINALIZED: "FINALIZED",
  PAID: "PAID",
} as const;
export type PayrollRunStatus = (typeof PayrollRunStatus)[keyof typeof PayrollRunStatus];

export interface PayrollSettingsDto {
  socialSecurityEmployeeRate: number;
  socialSecurityEmployerRate: number;
  socialSecurityWageFloor: number;
  socialSecurityWageCeiling: number;
  providentFundEnabled: boolean;
  providentFundDefaultEmployeeRate: number;
  providentFundDefaultEmployerRate: number;
}

export interface TaxBracketDto {
  id: string;
  minIncome: number;
  maxIncome: number | null;
  rate: number;
  order: number;
}

export interface PayrollRunDto {
  id: string;
  periodYear: number;
  periodMonth: number;
  status: PayrollRunStatus;
  createdAt: string;
}

export interface PayslipDto {
  id: string;
  employeeId: string;
  employeeName: string;
  periodYear: number;
  periodMonth: number;
  baseSalary: number;
  unpaidLeaveDeduction: number;
  grossPay: number;
  socialSecurityEmployee: number;
  socialSecurityEmployer: number;
  withholdingTax: number;
  providentFundEmployee: number;
  providentFundEmployer: number;
  netPay: number;
}

export interface RunPayrollRequest {
  periodYear: number;
  periodMonth: number;
}

export type UpdatePayrollSettingsRequest = Partial<PayrollSettingsDto>;

export interface UpdateTaxBracketRequest {
  minIncome?: number;
  maxIncome?: number | null;
  rate?: number;
}
