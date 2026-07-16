import { IsDateString, IsOptional, IsString } from "class-validator";

export class ManualAttendanceDto {
  @IsString()
  employeeId!: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsDateString()
  clockIn?: string;

  @IsOptional()
  @IsDateString()
  clockOut?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
