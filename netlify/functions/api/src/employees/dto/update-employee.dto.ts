import { IsBoolean, IsDateString, IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";
import { EmployeeStatus, EmploymentType } from "@hrm/shared";

const EMPLOYMENT_TYPES = Object.values(EmploymentType);
const EMPLOYEE_STATUSES = Object.values(EmployeeStatus);

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @IsOptional()
  @IsString()
  firstNameTh?: string;

  @IsOptional()
  @IsString()
  lastNameTh?: string;

  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  position?: string;

  @IsOptional()
  @IsIn(EMPLOYMENT_TYPES)
  employmentType?: (typeof EMPLOYMENT_TYPES)[number];

  @IsOptional()
  @IsString()
  managerId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalary?: number;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn(EMPLOYEE_STATUSES)
  status?: (typeof EMPLOYEE_STATUSES)[number];

  @IsOptional()
  @IsBoolean()
  providentFundOptIn?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  providentFundEmployeeRate?: number;
}
