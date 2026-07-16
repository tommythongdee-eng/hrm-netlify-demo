import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import type { TrainingRecordDto } from "@hrm/shared";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { RequestUser } from "../auth/request-context";
import { LogTrainingDto } from "./dto/log-training.dto";
import { LogTrainingForEmployeeDto } from "./dto/log-training-for-employee.dto";
import { TrainingService } from "./training.service";

@Controller("training")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get("my-training")
  myRecords(@CurrentUser() user: RequestUser): Promise<TrainingRecordDto[]> {
    return this.trainingService.myRecords(user.organizationId, user.sub);
  }

  @Post("my-training")
  logMine(@CurrentUser() user: RequestUser, @Body() dto: LogTrainingDto): Promise<TrainingRecordDto> {
    return this.trainingService.logMine(user.organizationId, user.sub, dto);
  }

  // Scope (own reports vs. everyone) is resolved in the service based on the
  // caller's role/manager status, not RBAC role — a manager may hold the
  // EMPLOYEE membership role and still need to log/view their reports' training.
  @Get()
  listAll(@CurrentUser() user: RequestUser): Promise<TrainingRecordDto[]> {
    return this.trainingService.listAll(user.organizationId, user.sub, user.role);
  }

  @Post()
  logForEmployee(
    @CurrentUser() user: RequestUser,
    @Body() dto: LogTrainingForEmployeeDto,
  ): Promise<TrainingRecordDto> {
    return this.trainingService.logForEmployee(user.organizationId, user.sub, user.role, dto);
  }

  @Get("employee/:employeeId")
  listForEmployee(
    @CurrentUser() user: RequestUser,
    @Param("employeeId") employeeId: string,
  ): Promise<TrainingRecordDto[]> {
    return this.trainingService.listForEmployeeAsManager(user.organizationId, user.sub, user.role, employeeId);
  }
}
