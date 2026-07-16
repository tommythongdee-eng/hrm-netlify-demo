import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import type { LeaveTypeDto } from "@hrm/shared";
import { MembershipRole } from "@hrm/shared";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { RequestUser } from "../auth/request-context";
import { CreateLeaveTypeDto } from "./dto/create-leave-type.dto";
import { LeaveTypesService } from "./leave-types.service";

@Controller("leave-types")
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveTypesController {
  constructor(private readonly leaveTypesService: LeaveTypesService) {}

  @Get()
  findAll(@CurrentUser() user: RequestUser): Promise<LeaveTypeDto[]> {
    return this.leaveTypesService.findAll(user.organizationId);
  }

  @Post()
  @Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateLeaveTypeDto): Promise<LeaveTypeDto> {
    return this.leaveTypesService.create(user.organizationId, dto);
  }
}
