import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { SurveyDto } from "@hrm/shared";
import { EmployeesService } from "../employees/employees.service";
import { PrismaService } from "../prisma/prisma.service";
import { SubmitSurveyResponseDto } from "./dto/submit-survey-response.dto";

@Injectable()
export class SurveyResponsesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeesService: EmployeesService,
  ) {}

  async listOpen(organizationId: string, userId: string): Promise<SurveyDto[]> {
    const employee = await this.requireSelfServiceEmployee(organizationId, userId);

    const participations = await this.prisma.surveyParticipation.findMany({
      where: { employeeId: employee.id },
      select: { surveyId: true },
    });
    const respondedSurveyIds = participations.map((p) => p.surveyId);

    const surveys = await this.prisma.survey.findMany({
      where: { organizationId, status: "OPEN", id: { notIn: respondedSurveyIds } },
      include: { questions: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" },
    });

    return surveys.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      status: s.status as SurveyDto["status"],
      questions: s.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type as SurveyDto["questions"][number]["type"],
        order: q.order,
      })),
      participantCount: 0,
      totalEmployeeCount: 0,
    }));
  }

  async submit(
    organizationId: string,
    userId: string,
    surveyId: string,
    dto: SubmitSurveyResponseDto,
  ): Promise<void> {
    const employee = await this.requireSelfServiceEmployee(organizationId, userId);

    const survey = await this.prisma.survey.findFirst({
      where: { id: surveyId, organizationId },
      include: { questions: true },
    });
    if (!survey) {
      throw new NotFoundException("Survey not found");
    }
    if (survey.status !== "OPEN") {
      throw new BadRequestException("This survey is not currently open");
    }

    const existing = await this.prisma.surveyParticipation.findUnique({
      where: { surveyId_employeeId: { surveyId, employeeId: employee.id } },
    });
    if (existing) {
      throw new ConflictException("You've already responded to this survey");
    }

    const questionsById = new Map(survey.questions.map((q) => [q.id, q]));
    for (const answer of dto.answers) {
      const question = questionsById.get(answer.questionId);
      if (!question) {
        throw new BadRequestException("Answer references a question not on this survey");
      }
      if (question.type === "TEXT" && !answer.textValue) {
        throw new BadRequestException(`Question "${question.text}" requires a text answer`);
      }
      if (question.type === "RATING_1_5" && (answer.numericValue == null || answer.numericValue < 1 || answer.numericValue > 5)) {
        throw new BadRequestException(`Question "${question.text}" requires a rating from 1 to 5`);
      }
      if (question.type === "NPS_0_10" && (answer.numericValue == null || answer.numericValue < 0 || answer.numericValue > 10)) {
        throw new BadRequestException(`Question "${question.text}" requires a score from 0 to 10`);
      }
    }

    // Deliberately no employeeId on SurveyResponse/SurveyAnswer — only the
    // separate SurveyParticipation marker (used for dedup/completion rate)
    // links this submission to an employee.
    await this.prisma.$transaction(async (tx) => {
      await tx.surveyResponse.create({
        data: {
          surveyId,
          answers: {
            create: dto.answers.map((a) => ({
              questionId: a.questionId,
              numericValue: a.numericValue,
              textValue: a.textValue,
            })),
          },
        },
      });
      await tx.surveyParticipation.create({ data: { surveyId, employeeId: employee.id } });
    });
  }

  private async requireSelfServiceEmployee(organizationId: string, userId: string) {
    const employee = await this.employeesService.findByUserId(organizationId, userId);
    if (!employee) {
      throw new NotFoundException("Your account isn't linked to an employee record yet");
    }
    return employee;
  }
}
