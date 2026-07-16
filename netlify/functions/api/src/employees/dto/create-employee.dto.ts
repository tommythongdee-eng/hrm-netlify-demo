import { IsBoolean, IsDateString, IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";
import { EmploymentType } from "@hrm/shared";

const EMPLOYMENT_TYPES = Object.values(EmploymentType);

export class CreateEmployeeDto {
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

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

  @IsString()
  @MinLength(1)
  position!: string;

  @IsIn(EMPLOYMENT_TYPES)
  employmentType!: (typeof EMPLOYMENT_TYPES)[number];

  @IsOptional()
  @IsString()
  managerId?: string;

  @IsNumber()
  @Min(0)
  baseSalary!: number;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsBoolean()
  providentFundOptIn?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  providentFundEmployeeRate?: number;
}
