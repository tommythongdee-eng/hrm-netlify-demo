import { IsIn, IsOptional, IsString } from "class-validator";
import { RatingLevel } from "@hrm/shared";

const RATING_LEVELS = Object.values(RatingLevel);

export class UpsertTalentAssessmentDto {
  @IsIn(RATING_LEVELS)
  performanceRating!: (typeof RATING_LEVELS)[number];

  @IsIn(RATING_LEVELS)
  potentialRating!: (typeof RATING_LEVELS)[number];

  @IsOptional()
  @IsString()
  notes?: string;
}
