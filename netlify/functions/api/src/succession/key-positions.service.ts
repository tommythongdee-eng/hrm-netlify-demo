import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { KeyPositionDto } from "@hrm/shared";
import { PrismaService } from "../prisma/prisma.service";
import { AddSuccessorCandidateDto } from "./dto/add-successor-candidate.dto";
import { CreateKeyPositionDto } from "./dto/create-key-position.dto";
import { UpdateSuccessorCandidateDto } from "./dto/update-successor-candidate.dto";

@Injectable()
export class KeyPositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string): Promise<KeyPositionDto[]> {
    const positions = await this.prisma.keyPosition.findMany({
      where: { organizationId },
      include: {
        currentHolder: { select: { firstName: true, lastName: true } },
        candidates: { include: { employee: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return positions.map((p) => this.toDto(p));
  }

  async create(organizationId: string, dto: CreateKeyPositionDto): Promise<KeyPositionDto> {
    const position = await this.prisma.keyPosition.create({
      data: {
        organizationId,
        title: dto.title,
        criticality: dto.criticality,
        notes: dto.notes,
        currentHolderId: dto.currentHolderId,
      },
      include: {
        currentHolder: { select: { firstName: true, lastName: true } },
        candidates: { include: { employee: { select: { firstName: true, lastName: true } } } },
      },
    });
    return this.toDto(position);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    await this.findPositionOrThrow(organizationId, id);
    await this.prisma.keyPosition.delete({ where: { id } });
  }

  async addCandidate(
    organizationId: string,
    keyPositionId: string,
    dto: AddSuccessorCandidateDto,
  ): Promise<KeyPositionDto> {
    await this.findPositionOrThrow(organizationId, keyPositionId);

    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, organizationId },
    });
    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    const existing = await this.prisma.successorCandidate.findUnique({
      where: { keyPositionId_employeeId: { keyPositionId, employeeId: dto.employeeId } },
    });
    if (existing) {
      throw new ConflictException("This employee is already a candidate for this position");
    }

    await this.prisma.successorCandidate.create({
      data: {
        keyPositionId,
        employeeId: dto.employeeId,
        organizationId,
        readiness: dto.readiness,
        notes: dto.notes,
      },
    });

    return this.getOneOrThrow(organizationId, keyPositionId);
  }

  async updateCandidate(
    organizationId: string,
    keyPositionId: string,
    candidateId: string,
    dto: UpdateSuccessorCandidateDto,
  ): Promise<KeyPositionDto> {
    await this.findPositionOrThrow(organizationId, keyPositionId);
    const candidate = await this.prisma.successorCandidate.findFirst({
      where: { id: candidateId, keyPositionId, organizationId },
    });
    if (!candidate) {
      throw new NotFoundException("Successor candidate not found");
    }
    await this.prisma.successorCandidate.update({ where: { id: candidateId }, data: { ...dto } });
    return this.getOneOrThrow(organizationId, keyPositionId);
  }

  async removeCandidate(organizationId: string, keyPositionId: string, candidateId: string): Promise<void> {
    const candidate = await this.prisma.successorCandidate.findFirst({
      where: { id: candidateId, keyPositionId, organizationId },
    });
    if (!candidate) {
      throw new NotFoundException("Successor candidate not found");
    }
    await this.prisma.successorCandidate.delete({ where: { id: candidateId } });
  }

  private async getOneOrThrow(organizationId: string, id: string): Promise<KeyPositionDto> {
    const position = await this.prisma.keyPosition.findFirst({
      where: { id, organizationId },
      include: {
        currentHolder: { select: { firstName: true, lastName: true } },
        candidates: { include: { employee: { select: { firstName: true, lastName: true } } } },
      },
    });
    if (!position) {
      throw new NotFoundException("Key position not found");
    }
    return this.toDto(position);
  }

  private async findPositionOrThrow(organizationId: string, id: string) {
    const position = await this.prisma.keyPosition.findFirst({ where: { id, organizationId } });
    if (!position) {
      throw new NotFoundException("Key position not found");
    }
    return position;
  }

  private toDto(position: {
    id: string;
    title: string;
    criticality: string | null;
    notes: string | null;
    currentHolderId: string | null;
    currentHolder: { firstName: string; lastName: string } | null;
    candidates: {
      id: string;
      employeeId: string;
      employee: { firstName: string; lastName: string };
      readiness: string;
      notes: string | null;
    }[];
  }): KeyPositionDto {
    return {
      id: position.id,
      title: position.title,
      criticality: position.criticality as KeyPositionDto["criticality"],
      notes: position.notes,
      currentHolderId: position.currentHolderId,
      currentHolderName: position.currentHolder
        ? `${position.currentHolder.firstName} ${position.currentHolder.lastName}`
        : null,
      candidates: position.candidates.map((c) => ({
        id: c.id,
        employeeId: c.employeeId,
        employeeName: `${c.employee.firstName} ${c.employee.lastName}`,
        readiness: c.readiness as KeyPositionDto["candidates"][number]["readiness"],
        notes: c.notes,
      })),
    };
  }
}
