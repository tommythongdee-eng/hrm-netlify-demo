import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class SubmitManagerReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  managerRating!: number;

  @IsOptional()
  @IsString()
  managerComments?: string;
}
