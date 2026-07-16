import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import type { LeaveBalanceDto, LeaveRequestDto } from "@hrm/shared";
import { MembershipRole } from "@hrm/shared";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { RequestUser } from "../auth/request-context";
import { CreateLeaveRequestDto } from "./dto/create-leave-request.dto";
import { RespondLeaveRequestDto } from "./dto/respond-leave-request.dto";
import { LeaveRequestsService } from "./leave-requests.service";

@Controller("leave-requests")
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveRequestsController {
  constructor(private readonly leaveRequestsService: LeaveRequestsService) {}

  @Get("my-balances")
  myBalances(@CurrentUser() user: RequestUser): Promise<LeaveBalanceDto[]> {
    return this.leaveRequestsService.myBalances(user.organizationId, user.sub);
  }

  @Get("my-requests")
  myRequests(@CurrentUser() user: RequestUser): Promise<LeaveRequestDto[]> {
    return this.leaveRequestsService.myRequests(user.organizationId, user.sub);
  }

  // Scope (own reports vs. everyone) is resolved in the service based on the
  // caller's role/manager status, so no @Roles restriction here — any signed
  // in member may have reports even without the MANAGER role.
  @Get("pending-approvals")
  pendingApprovals(@CurrentUser() user: RequestUser): Promise<LeaveRequestDto[]> {
    return this.leaveRequestsService.pendingApprovals(user.organizationId, user.sub, user.role);
  }

  @Get("employee/:employeeId/balances")
  @Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN, MembershipRole.MANAGER)
  balancesForEmployee(
    @CurrentUser() user: RequestUser,
    @Param("employeeId") employeeId: string,
  ): Promise<LeaveBalanceDto[]> {
    return this.leaveRequestsService.balancesForEmployee(user.organizationId, employeeId);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateLeaveRequestDto): Promise<LeaveRequestDto> {
    return this.leaveRequestsService.create(user.organizationId, user.sub, dto);
  }

  @Post(":id/respond")
  respond(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body() dto: RespondLeaveRequestDto,
  ): Promise<LeaveRequestDto> {
    return this.leaveRequestsService.respond(user.organizationId, user.sub, user.role, id, dto.decision);
  }

  @Post(":id/cancel")
  cancel(@CurrentUser() user: RequestUser, @Param("id") id: string): Promise<LeaveRequestDto> {
    return this.leaveRequestsService.cancel(user.organizationId, user.sub, id);
  }
}
