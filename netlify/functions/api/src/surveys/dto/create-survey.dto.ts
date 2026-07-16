import { Type } from "class-transformer";
import { ArrayMinSize, IsIn, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";
import { SurveyQuestionType } from "@hrm/shared";

const QUESTION_TYPES = Object.values(SurveyQuestionType);

export class CreateSurveyQuestionDto {
  @IsString()
  @MinLength(1)
  text!: string;

  @IsIn(QUESTION_TYPES)
  type!: (typeof QUESTION_TYPES)[number];
}

export class CreateSurveyDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @ValidateNested({ each: true })
  @Type(() => CreateSurveyQuestionDto)
  @ArrayMinSize(1)
  questions!: CreateSurveyQuestionDto[];
}
