import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class SubmitSelfReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  selfRating!: number;

  @IsOptional()
  @IsString()
  selfComments?: string;
}
