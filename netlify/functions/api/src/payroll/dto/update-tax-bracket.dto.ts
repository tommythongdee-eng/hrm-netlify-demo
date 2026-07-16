import { IsNumber, IsOptional, Min } from "class-validator";

export class UpdateTaxBracketDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  minIncome?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxIncome?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;
}
