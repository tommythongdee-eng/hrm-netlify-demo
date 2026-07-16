import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import type { DepartmentDto } from "@hrm/shared";
import { MembershipRole } from "@hrm/shared";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { RequestUser } from "../auth/request-context";
import { DepartmentsService } from "./departments.service";
import { CreateDepartmentDto } from "./dto/create-department.dto";

@Controller("departments")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  findAll(@CurrentUser() user: RequestUser): Promise<DepartmentDto[]> {
    return this.departmentsService.findAll(user.organizationId);
  }

  @Post()
  @Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateDepartmentDto): Promise<DepartmentDto> {
    return this.departmentsService.create(user.organizationId, dto);
  }

  @Delete(":id")
  @Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: RequestUser, @Param("id") id: string): Promise<void> {
    return this.departmentsService.remove(user.organizationId, id);
  }
}
