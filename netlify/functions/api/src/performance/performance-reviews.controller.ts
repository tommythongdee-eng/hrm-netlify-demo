import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import type { PerformanceReviewDto } from "@hrm/shared";
import { MembershipRole } from "@hrm/shared";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { RequestUser } from "../auth/request-context";
import { SubmitManagerReviewDto } from "./dto/submit-manager-review.dto";
import { SubmitSelfReviewDto } from "./dto/submit-self-review.dto";
import { PerformanceReviewsService } from "./performance-reviews.service";

@Controller("performance/reviews")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PerformanceReviewsController {
  constructor(private readonly performanceReviewsService: PerformanceReviewsService) {}

  @Get("my-reviews")
  myReviews(@CurrentUser() user: RequestUser): Promise<PerformanceReviewDto[]> {
    return this.performanceReviewsService.myReviews(user.organizationId, user.sub);
  }

  // Scope (own reports vs. everyone) is resolved in the service based on the
  // caller's role/manager status — same shape as leave-requests' pending-approvals.
  @Get("pending")
  pending(@CurrentUser() user: RequestUser): Promise<PerformanceReviewDto[]> {
    return this.performanceReviewsService.pendingManagerReviews(user.organizationId, user.sub, user.role);
  }

  @Get()
  @Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN)
  forCycle(
    @CurrentUser() user: RequestUser,
    @Query("cycleId") cycleId: string,
  ): Promise<PerformanceReviewDto[]> {
    return this.performanceReviewsService.forCycle(user.organizationId, cycleId);
  }

  @Post(":id/self-review")
  submitSelfReview(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body() dto: SubmitSelfReviewDto,
  ): Promise<PerformanceReviewDto> {
    return this.performanceReviewsService.submitSelfReview(user.organizationId, user.sub, id, dto);
  }

  @Post(":id/manager-review")
  submitManagerReview(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body() dto: SubmitManagerReviewDto,
  ): Promise<PerformanceReviewDto> {
    return this.performanceReviewsService.submitManagerReview(
      user.organizationId,
      user.sub,
      user.role,
      id,
      dto,
    );
  }
}
