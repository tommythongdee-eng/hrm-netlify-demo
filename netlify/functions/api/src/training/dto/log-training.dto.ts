import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";
import { TrainingCategory } from "@hrm/shared";

const TRAINING_CATEGORIES = Object.values(TrainingCategory);

export class LogTrainingDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsIn(TRAINING_CATEGORIES)
  category!: (typeof TRAINING_CATEGORIES)[number];

  @IsDateString()
  completionDate!: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hours?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
