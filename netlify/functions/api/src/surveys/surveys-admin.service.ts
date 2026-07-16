import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { SurveyDto, SurveyQuestionResultDto, SurveyResultsDto } from "@hrm/shared";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSurveyDto } from "./dto/create-survey.dto";

@Injectable()
export class SurveysAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string): Promise<SurveyDto[]> {
    const surveys = await this.prisma.survey.findMany({
      where: { organizationId },
      include: { questions: { orderBy: { order: "asc" } }, _count: { select: { participations: true } } },
      orderBy: { createdAt: "desc" },
    });
    const totalEmployeeCount = await this.prisma.employee.count({
      where: { organizationId, status: "ACTIVE" },
    });
    return surveys.map((s) => this.toDto(s, s._count.participations, totalEmployeeCount));
  }

  async create(organizationId: string, dto: CreateSurveyDto): Promise<SurveyDto> {
    const survey = await this.prisma.survey.create({
      data: {
        organizationId,
        title: dto.title,
        description: dto.description,
        status: "DRAFT",
        questions: {
          create: dto.questions.map((q, index) => ({ text: q.text, type: q.type, order: index })),
        },
      },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    const totalEmployeeCount = await this.prisma.employee.count({
      where: { organizationId, status: "ACTIVE" },
    });
    return this.toDto(survey, 0, totalEmployeeCount);
  }

  async open(organizationId: string, id: string): Promise<SurveyDto> {
    const survey = await this.findSurveyOrThrow(organizationId, id);
    if (survey.status !== "DRAFT") {
      throw new BadRequestException("Only a draft survey can be opened");
    }
    return this.updateStatus(organizationId, id, "OPEN");
  }

  async close(organizationId: string, id: string): Promise<SurveyDto> {
    await this.findSurveyOrThrow(organizationId, id);
    const survey = await this.prisma.survey.update({
      where: { id },
      data: { status: "CLOSED", closedAt: new Date() },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    const participantCount = await this.prisma.surveyParticipation.count({ where: { surveyId: id } });
    const totalEmployeeCount = await this.prisma.employee.count({
      where: { organizationId, status: "ACTIVE" },
    });
    return this.toDto(survey, participantCount, totalEmployeeCount);
  }

  async getResults(organizationId: string, id: string): Promise<SurveyResultsDto> {
    const survey = await this.prisma.survey.findFirst({
      where: { id, organizationId },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    if (!survey) {
      throw new NotFoundException("Survey not found");
    }

    const participantCount = await this.prisma.surveyParticipation.count({ where: { surveyId: id } });
    const totalEmployeeCount = await this.prisma.employee.count({
      where: { organizationId, status: "ACTIVE" },
    });

    const questions: SurveyQuestionResultDto[] = await Promise.all(
      survey.questions.map(async (q) => {
        const answers = await this.prisma.surveyAnswer.findMany({ where: { questionId: q.id } });

        if (q.type === "TEXT") {
          const textAnswers = answers.map((a) => a.textValue).filter((v): v is string => Boolean(v));
          return {
            questionId: q.id,
            text: q.text,
            type: q.type as SurveyQuestionResultDto["type"],
            responseCount: textAnswers.length,
            averageValue: null,
            distribution: {},
            textAnswers,
          };
        }

        const numericAnswers = answers.map((a) => a.numericValue).filter((v): v is number => v !== null);
        const distribution: Record<string, number> = {};
        for (const value of numericAnswers) {
          distribution[value] = (distribution[value] ?? 0) + 1;
        }
        const averageValue =
          numericAnswers.length > 0
            ? Math.round((numericAnswers.reduce((sum, v) => sum + v, 0) / numericAnswers.length) * 100) / 100
            : null;

        return {
          questionId: q.id,
          text: q.text,
          type: q.type as SurveyQuestionResultDto["type"],
          responseCount: numericAnswers.length,
          averageValue,
          distribution,
          textAnswers: [],
        };
      }),
    );

    return { surveyId: survey.id, title: survey.title, participantCount, totalEmployeeCount, questions };
  }

  private async updateStatus(organizationId: string, id: string, status: string): Promise<SurveyDto> {
    const survey = await this.prisma.survey.update({
      where: { id },
      data: { status },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    const participantCount = await this.prisma.surveyParticipation.count({ where: { surveyId: id } });
    const totalEmployeeCount = await this.prisma.employee.count({
      where: { organizationId, status: "ACTIVE" },
    });
    return this.toDto(survey, participantCount, totalEmployeeCount);
  }

  private async findSurveyOrThrow(organizationId: string, id: string) {
    const survey = await this.prisma.survey.findFirst({ where: { id, organizationId } });
    if (!survey) {
      throw new NotFoundException("Survey not found");
    }
    return survey;
  }

  private toDto(
    survey: {
      id: string;
      title: string;
      description: string | null;
      status: string;
      questions: { id: string; text: string; type: string; order: number }[];
    },
    participantCount: number,
    totalEmployeeCount: number,
  ): SurveyDto {
    return {
      id: survey.id,
      title: survey.title,
      description: survey.description,
      status: survey.status as SurveyDto["status"],
      questions: survey.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type as SurveyDto["questions"][number]["type"],
        order: q.order,
      })),
      participantCount,
      totalEmployeeCount,
    };
  }
}
