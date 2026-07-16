import { IsString } from "class-validator";
import { LogTrainingDto } from "./log-training.dto";

export class LogTrainingForEmployeeDto extends LogTrainingDto {
  @IsString()
  employeeId!: string;
}
