-- CreateTable
CREATE TABLE "severance_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "yearsOfService" REAL NOT NULL,
    "daysOfPay" INTEGER NOT NULL,
    "dailyRate" REAL NOT NULL,
    "amount" REAL NOT NULL,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "severance_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_employees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "employeeCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "firstNameTh" TEXT,
    "lastNameTh" TEXT,
    "nationalId" TEXT,
    "dateOfBirth" DATETIME,
    "gender" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "departmentId" TEXT,
    "position" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL,
    "managerId" TEXT,
    "baseSalary" REAL NOT NULL,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "providentFundOptIn" BOOLEAN NOT NULL DEFAULT false,
    "providentFundEmployeeRate" REAL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "employees_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "employees_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_employees" ("address", "bankAccountNumber", "bankName", "baseSalary", "createdAt", "dateOfBirth", "departmentId", "email", "employeeCode", "employmentType", "endDate", "firstName", "firstNameTh", "gender", "id", "lastName", "lastNameTh", "managerId", "nationalId", "organizationId", "phone", "position", "startDate", "status", "updatedAt", "userId") SELECT "address", "bankAccountNumber", "bankName", "baseSalary", "createdAt", "dateOfBirth", "departmentId", "email", "employeeCode", "employmentType", "endDate", "firstName", "firstNameTh", "gender", "id", "lastName", "lastNameTh", "managerId", "nationalId", "organizationId", "phone", "position", "startDate", "status", "updatedAt", "userId" FROM "employees";
DROP TABLE "employees";
ALTER TABLE "new_employees" RENAME TO "employees";
CREATE UNIQUE INDEX "employees_userId_key" ON "employees"("userId");
CREATE INDEX "employees_organizationId_idx" ON "employees"("organizationId");
CREATE UNIQUE INDEX "employees_organizationId_employeeCode_key" ON "employees"("organizationId", "employeeCode");
CREATE TABLE "new_payroll_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "socialSecurityEmployeeRate" REAL NOT NULL DEFAULT 0.05,
    "socialSecurityEmployerRate" REAL NOT NULL DEFAULT 0.05,
    "socialSecurityWageFloor" REAL NOT NULL DEFAULT 1650,
    "socialSecurityWageCeiling" REAL NOT NULL DEFAULT 15000,
    "providentFundEnabled" BOOLEAN NOT NULL DEFAULT false,
    "providentFundDefaultEmployeeRate" REAL NOT NULL DEFAULT 0.03,
    "providentFundDefaultEmployerRate" REAL NOT NULL DEFAULT 0.03,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payroll_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_payroll_settings" ("id", "organizationId", "socialSecurityEmployeeRate", "socialSecurityEmployerRate", "socialSecurityWageCeiling", "socialSecurityWageFloor", "updatedAt") SELECT "id", "organizationId", "socialSecurityEmployeeRate", "socialSecurityEmployerRate", "socialSecurityWageCeiling", "socialSecurityWageFloor", "updatedAt" FROM "payroll_settings";
DROP TABLE "payroll_settings";
ALTER TABLE "new_payroll_settings" RENAME TO "payroll_settings";
CREATE UNIQUE INDEX "payroll_settings_organizationId_key" ON "payroll_settings"("organizationId");
CREATE TABLE "new_payslips" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "baseSalary" REAL NOT NULL,
    "unpaidLeaveDeduction" REAL NOT NULL DEFAULT 0,
    "grossPay" REAL NOT NULL,
    "socialSecurityEmployee" REAL NOT NULL,
    "socialSecurityEmployer" REAL NOT NULL,
    "withholdingTax" REAL NOT NULL,
    "providentFundEmployee" REAL NOT NULL DEFAULT 0,
    "providentFundEmployer" REAL NOT NULL DEFAULT 0,
    "netPay" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payslips_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "payroll_runs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payslips_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_payslips" ("baseSalary", "createdAt", "employeeId", "grossPay", "id", "netPay", "organizationId", "payrollRunId", "socialSecurityEmployee", "socialSecurityEmployer", "unpaidLeaveDeduction", "withholdingTax") SELECT "baseSalary", "createdAt", "employeeId", "grossPay", "id", "netPay", "organizationId", "payrollRunId", "socialSecurityEmployee", "socialSecurityEmployer", "unpaidLeaveDeduction", "withholdingTax" FROM "payslips";
DROP TABLE "payslips";
ALTER TABLE "new_payslips" RENAME TO "payslips";
CREATE INDEX "payslips_organizationId_idx" ON "payslips"("organizationId");
CREATE UNIQUE INDEX "payslips_payrollRunId_employeeId_key" ON "payslips"("payrollRunId", "employeeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "severance_records_employeeId_key" ON "severance_records"("employeeId");

-- CreateIndex
CREATE INDEX "severance_records_organizationId_idx" ON "severance_records"("organizationId");
