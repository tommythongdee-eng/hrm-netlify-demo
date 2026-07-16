import { IsBoolean, IsNumber, IsOptional, IsString, Matches, Min, MinLength } from "class-validator";

export class CreateLeaveTypeDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @Matches(/^[A-Z0-9_]+$/, { message: "code must be upper-case letters, numbers, or underscores" })
  code!: string;

  @IsNumber()
  @Min(0)
  defaultDaysPerYear!: number;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
}
