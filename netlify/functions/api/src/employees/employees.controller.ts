import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type { EmployeeDetail, EmployeeSummary, SeveranceRecordDto } from "@hrm/shared";
import { MembershipRole } from "@hrm/shared";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { RequestUser } from "../auth/request-context";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { InviteEmployeeDto } from "./dto/invite-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { EmployeesService } from "./employees.service";

@Controller("employees")
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  findAll(@CurrentUser() user: RequestUser): Promise<EmployeeSummary[]> {
    return this.employeesService.findAll(user.organizationId);
  }

  // Full detail includes salary/national ID/bank details, so it's HR-only —
  // unlike the summary list above, which any signed-in member can browse.
  @Get(":id")
  @Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN)
  findOne(@CurrentUser() user: RequestUser, @Param("id") id: string): Promise<EmployeeDetail> {
    return this.employeesService.findOne(user.organizationId, id);
  }

  @Post()
  @Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateEmployeeDto): Promise<EmployeeDetail> {
    return this.employeesService.create(user.organizationId, dto);
  }

  @Patch(":id")
  @Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN)
  update(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<EmployeeDetail> {
    return this.employeesService.update(user.organizationId, id, dto);
  }

  @Post(":id/invite")
  @Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN)
  invite(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body() dto: InviteEmployeeDto,
  ): Promise<EmployeeDetail> {
    return this.employeesService.invite(user.organizationId, id, dto);
  }

  @Get(":id/severance")
  @Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN)
  getSeverance(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
  ): Promise<SeveranceRecordDto | null> {
    return this.employeesService.getSeverance(user.organizationId, id);
  }
}
