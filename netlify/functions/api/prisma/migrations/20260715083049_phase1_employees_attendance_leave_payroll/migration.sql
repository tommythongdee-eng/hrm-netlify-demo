-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "standardEndTime" TEXT;
ALTER TABLE "organizations" ADD COLUMN "standardStartTime" TEXT;

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "departments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "employees" (
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

-- CreateTable
CREATE TABLE "employee_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "employee_documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "employee_documents_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "clockIn" DATETIME,
    "clockOut" DATETIME,
    "source" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "attendance_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "leave_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "defaultDaysPerYear" REAL NOT NULL,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "leave_types_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "leave_balances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "allocatedDays" REAL NOT NULL,
    "usedDays" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "leave_balances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "leave_balances_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_types" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "daysCount" REAL NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL,
    "respondedByUserId" TEXT,
    "respondedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "leave_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "leave_requests_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "leave_requests_respondedByUserId_fkey" FOREIGN KEY ("respondedByUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "public_holidays" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "public_holidays_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payroll_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "socialSecurityEmployeeRate" REAL NOT NULL DEFAULT 0.05,
    "socialSecurityEmployerRate" REAL NOT NULL DEFAULT 0.05,
    "socialSecurityWageFloor" REAL NOT NULL DEFAULT 1650,
    "socialSecurityWageCeiling" REAL NOT NULL DEFAULT 15000,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payroll_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tax_brackets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "minIncome" REAL NOT NULL,
    "maxIncome" REAL,
    "rate" REAL NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "tax_brackets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedAt" DATETIME,
    CONSTRAINT "payroll_runs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payslips" (
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
    "netPay" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payslips_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "payroll_runs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payslips_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_organizationId_name_key" ON "departments"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "employees_userId_key" ON "employees"("userId");

-- CreateIndex
CREATE INDEX "employees_organizationId_idx" ON "employees"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_organizationId_employeeCode_key" ON "employees"("organizationId", "employeeCode");

-- CreateIndex
CREATE INDEX "employee_documents_organizationId_idx" ON "employee_documents"("organizationId");

-- CreateIndex
CREATE INDEX "employee_documents_employeeId_idx" ON "employee_documents"("employeeId");

-- CreateIndex
CREATE INDEX "attendance_records_organizationId_idx" ON "attendance_records"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_employeeId_date_key" ON "attendance_records"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_organizationId_code_key" ON "leave_types"("organizationId", "code");

-- CreateIndex
CREATE INDEX "leave_balances_organizationId_idx" ON "leave_balances"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_employeeId_leaveTypeId_year_key" ON "leave_balances"("employeeId", "leaveTypeId", "year");

-- CreateIndex
CREATE INDEX "leave_requests_organizationId_idx" ON "leave_requests"("organizationId");

-- CreateIndex
CREATE INDEX "leave_requests_employeeId_idx" ON "leave_requests"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "public_holidays_organizationId_date_key" ON "public_holidays"("organizationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_settings_organizationId_key" ON "payroll_settings"("organizationId");

-- CreateIndex
CREATE INDEX "tax_brackets_organizationId_idx" ON "tax_brackets"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_runs_organizationId_periodYear_periodMonth_key" ON "payroll_runs"("organizationId", "periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "payslips_organizationId_idx" ON "payslips"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_payrollRunId_employeeId_key" ON "payslips"("payrollRunId", "employeeId");
