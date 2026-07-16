import { Type } from "class-transformer";
import { ArrayMinSize, IsInt, IsOptional, IsString, ValidateNested } from "class-validator";

export class SubmitSurveyAnswerDto {
  @IsString()
  questionId!: string;

  @IsOptional()
  @IsInt()
  numericValue?: number;

  @IsOptional()
  @IsString()
  textValue?: string;
}

export class SubmitSurveyResponseDto {
  @ValidateNested({ each: true })
  @Type(() => SubmitSurveyAnswerDto)
  @ArrayMinSize(1)
  answers!: SubmitSurveyAnswerDto[];
}
