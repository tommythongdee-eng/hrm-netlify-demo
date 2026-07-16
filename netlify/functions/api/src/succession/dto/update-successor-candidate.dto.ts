import { IsIn, IsOptional, IsString } from "class-validator";
import { ReadinessLevel } from "@hrm/shared";

const READINESS_LEVELS = Object.values(ReadinessLevel);

export class UpdateSuccessorCandidateDto {
  @IsOptional()
  @IsIn(READINESS_LEVELS)
  readiness?: (typeof READINESS_LEVELS)[number];

  @IsOptional()
  @IsString()
  notes?: string;
}
