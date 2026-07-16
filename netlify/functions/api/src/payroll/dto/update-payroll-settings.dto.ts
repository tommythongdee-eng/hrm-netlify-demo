import { IsBoolean, IsNumber, IsOptional, Max, Min } from "class-validator";

export class UpdatePayrollSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  socialSecurityEmployeeRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  socialSecurityEmployerRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  socialSecurityWageFloor?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  socialSecurityWageCeiling?: number;

  @IsOptional()
  @IsBoolean()
  providentFundEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  providentFundDefaultEmployeeRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  providentFundDefaultEmployerRate?: number;
}
