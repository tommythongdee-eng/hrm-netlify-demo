import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { MembershipRole } from "@hrm/shared";
import type { PerformanceReviewDto } from "@hrm/shared";
import type { Employee, PerformanceReview, ReviewCycle } from "@prisma/client";
import { EmployeesService } from "../employees/employees.service";
import { PrismaService } from "../prisma/prisma.service";
import { SubmitManagerReviewDto } from "./dto/submit-manager-review.dto";
import { SubmitSelfReviewDto } from "./dto/submit-self-review.dto";

type ReviewWithRelations = PerformanceReview & {
  employee: Pick<Employee, "firstName" | "lastName" | "managerId">;
  cycle: Pick<ReviewCycle, "name" | "status">;
};

@Injectable()
export class PerformanceReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeesService: EmployeesService,
  ) {}

  async myReviews(organizationId: string, userId: string): Promise<PerformanceReviewDto[]> {
    const employee = await this.requireSelfServiceEmployee(organizationId, userId);
    const reviews = await this.prisma.performanceReview.findMany({
      where: { organizationId, employeeId: employee.id },
      include: this.include(),
      orderBy: { createdAt: "desc" },
    });
    return reviews.map((r) => this.toDto(r));
  }

  async forCycle(organizationId: string, cycleId: string): Promise<PerformanceReviewDto[]> {
    const reviews = await this.prisma.performanceReview.findMany({
      where: { organizationId, cycleId },
      include: this.include(),
      orderBy: [{ status: "asc" }],
    });
    return reviews.map((r) => this.toDto(r));
  }

  async pendingManagerReviews(
    organizationId: string,
    userId: string,
    role: MembershipRole,
  ): Promise<PerformanceReviewDto[]> {
    const isHrOrOwner = role === MembershipRole.OWNER || role === MembershipRole.HR_ADMIN;
    const actingEmployee = await this.employeesService.findByUserId(organizationId, userId);

    const reviews = await this.prisma.performanceReview.findMany({
      where: isHrOrOwner
        ? { organizationId, status: { not: "COMPLETED" }, cycle: { status: "ACTIVE" } }
        : {
            organizationId,
            status: { not: "COMPLETED" },
            cycle: { status: "ACTIVE" },
            employee: { managerId: actingEmployee?.id ?? "__none__" },
          },
      include: this.include(),
      orderBy: { createdAt: "asc" },
    });
    return reviews.map((r) => this.toDto(r));
  }

  async submitSelfReview(
    organizationId: string,
    userId: string,
    reviewId: string,
    dto: SubmitSelfReviewDto,
  ): Promise<PerformanceReviewDto> {
    const employee = await this.requireSelfServiceEmployee(organizationId, userId);
    const review = await this.prisma.performanceReview.findFirst({
      where: { id: reviewId, organizationId, employeeId: employee.id },
      include: { cycle: true },
    });
    if (!review) {
      throw new NotFoundException("Review not found");
    }
    if (review.cycle.status !== "ACTIVE") {
      throw new BadRequestException("This review cycle is not active");
    }

    const updated = await this.prisma.performanceReview.update({
      where: { id: reviewId },
      data: {
        selfRating: dto.selfRating,
        selfComments: dto.selfComments,
        selfSubmittedAt: new Date(),
        status: review.status === "NOT_STARTED" ? "SELF_SUBMITTED" : review.status,
      },
      include: this.include(),
    });
    return this.toDto(updated);
  }

  async submitManagerReview(
    organizationId: string,
    actingUserId: string,
    actingRole: MembershipRole,
    reviewId: string,
    dto: SubmitManagerReviewDto,
  ): Promise<PerformanceReviewDto> {
    const review = await this.prisma.performanceReview.findFirst({
      where: { id: reviewId, organizationId },
      include: { employee: true, cycle: true },
    });
    if (!review) {
      throw new NotFoundException("Review not found");
    }
    if (review.cycle.status !== "ACTIVE") {
      throw new BadRequestException("This review cycle is not active");
    }

    const isHrOrOwner = actingRole === MembershipRole.OWNER || actingRole === MembershipRole.HR_ADMIN;
    if (!isHrOrOwner) {
      const actingEmployee = await this.employeesService.findByUserId(organizationId, actingUserId);
      if (!actingEmployee || actingEmployee.id !== review.employee.managerId) {
        throw new ForbiddenException("Only this employee's manager or HR can submit their review");
      }
    }

    const updated = await this.prisma.performanceReview.update({
      where: { id: reviewId },
      data: {
        managerRating: dto.managerRating,
        managerComments: dto.managerComments,
        managerSubmittedAt: new Date(),
        status: "COMPLETED",
      },
      include: this.include(),
    });
    return this.toDto(updated);
  }

  private async requireSelfServiceEmployee(organizationId: string, userId: string): Promise<Employee> {
    const employee = await this.employeesService.findByUserId(organizationId, userId);
    if (!employee) {
      throw new NotFoundException("Your account isn't linked to an employee record yet");
    }
    return employee;
  }

  private include() {
    return {
      employee: { select: { firstName: true, lastName: true, managerId: true } },
      cycle: { select: { name: true, status: true } },
    } as const;
  }

  private toDto(review: ReviewWithRelations): PerformanceReviewDto {
    return {
      id: review.id,
      cycleId: review.cycleId,
      cycleName: review.cycle.name,
      employeeId: review.employeeId,
      employeeName: `${review.employee.firstName} ${review.employee.lastName}`,
      selfRating: review.selfRating,
      selfComments: review.selfComments,
      managerRating: review.managerRating,
      managerComments: review.managerComments,
      status: review.status as PerformanceReviewDto["status"],
    };
  }
}
