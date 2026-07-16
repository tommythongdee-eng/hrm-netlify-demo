import { IsIn, IsOptional, IsString, MinLength } from "class-validator";
import { PositionCriticality } from "@hrm/shared";

const CRITICALITY_LEVELS = Object.values(PositionCriticality);

export class CreateKeyPositionDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsIn(CRITICALITY_LEVELS)
  criticality?: (typeof CRITICALITY_LEVELS)[number];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  currentHolderId?: string;
}
