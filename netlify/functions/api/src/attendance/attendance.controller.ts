import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import type { AttendanceRecordDto } from "@hrm/shared";
import { MembershipRole } from "@hrm/shared";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { RequestUser } from "../auth/request-context";
import { AttendanceService } from "./attendance.service";
import { ManualAttendanceDto } from "./dto/manual-attendance.dto";

@Controller("attendance")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post("clock-in")
  clockIn(@CurrentUser() user: RequestUser): Promise<AttendanceRecordDto> {
    return this.attendanceService.clockIn(user.organizationId, user.sub);
  }

  @Post("clock-out")
  clockOut(@CurrentUser() user: RequestUser): Promise<AttendanceRecordDto> {
    return this.attendanceService.clockOut(user.organizationId, user.sub);
  }

  @Get("me")
  myHistory(@CurrentUser() user: RequestUser): Promise<AttendanceRecordDto[]> {
    return this.attendanceService.myHistory(user.organizationId, user.sub);
  }

  @Get()
  @Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN, MembershipRole.MANAGER)
  listAll(@CurrentUser() user: RequestUser): Promise<AttendanceRecordDto[]> {
    return this.attendanceService.listAll(user.organizationId);
  }

  @Get("employee/:employeeId")
  @Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN, MembershipRole.MANAGER)
  listForEmployee(
    @CurrentUser() user: RequestUser,
    @Param("employeeId") employeeId: string,
  ): Promise<AttendanceRecordDto[]> {
    return this.attendanceService.listForEmployee(user.organizationId, employeeId);
  }

  @Post("manual")
  @Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN)
  manualUpsert(
    @CurrentUser() user: RequestUser,
    @Body() dto: ManualAttendanceDto,
  ): Promise<AttendanceRecordDto> {
    return this.attendanceService.manualUpsert(user.organizationId, dto);
  }
}
