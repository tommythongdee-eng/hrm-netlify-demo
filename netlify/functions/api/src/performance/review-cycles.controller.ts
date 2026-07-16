import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import type { ReviewCycleDto } from "@hrm/shared";
import { MembershipRole } from "@hrm/shared";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { RequestUser } from "../auth/request-context";
import { CreateReviewCycleDto } from "./dto/create-review-cycle.dto";
import { ReviewCyclesService } from "./review-cycles.service";

@Controller("performance/cycles")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewCyclesController {
  constructor(private readonly reviewCyclesService: ReviewCyclesService) {}

  @Get()
  findAll(@CurrentUser() user: RequestUser): Promise<ReviewCycleDto[]> {
    return this.reviewCyclesService.findAll(user.organizationId);
  }

  @Post()
  @Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateReviewCycleDto): Promise<ReviewCycleDto> {
    return this.reviewCyclesService.create(user.organizationId, dto);
  }

  @Post(":id/activate")
  @Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN)
  activate(@CurrentUser() user: RequestUser, @Param("id") id: string): Promise<ReviewCycleDto> {
    return this.reviewCyclesService.activate(user.organizationId, id);
  }

  @Post(":id/close")
  @Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN)
  close(@CurrentUser() user: RequestUser, @Param("id") id: string): Promise<ReviewCycleDto> {
    return this.reviewCyclesService.close(user.organizationId, id);
  }
}
