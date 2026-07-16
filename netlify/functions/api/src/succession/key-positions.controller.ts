import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { KeyPositionDto } from "@hrm/shared";
import { MembershipRole } from "@hrm/shared";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { RequestUser } from "../auth/request-context";
import { AddSuccessorCandidateDto } from "./dto/add-successor-candidate.dto";
import { CreateKeyPositionDto } from "./dto/create-key-position.dto";
import { UpdateSuccessorCandidateDto } from "./dto/update-successor-candidate.dto";
import { KeyPositionsService } from "./key-positions.service";

// Entirely HR/Owner — see talent-assessments.controller.ts for the same rationale.
@Controller("succession/key-positions")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN)
export class KeyPositionsController {
  constructor(private readonly keyPositionsService: KeyPositionsService) {}

  @Get()
  findAll(@CurrentUser() user: RequestUser): Promise<KeyPositionDto[]> {
    return this.keyPositionsService.findAll(user.organizationId);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateKeyPositionDto): Promise<KeyPositionDto> {
    return this.keyPositionsService.create(user.organizationId, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: RequestUser, @Param("id") id: string): Promise<void> {
    return this.keyPositionsService.remove(user.organizationId, id);
  }

  @Post(":id/candidates")
  addCandidate(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body() dto: AddSuccessorCandidateDto,
  ): Promise<KeyPositionDto> {
    return this.keyPositionsService.addCandidate(user.organizationId, id, dto);
  }

  @Patch(":id/candidates/:candidateId")
  updateCandidate(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Param("candidateId") candidateId: string,
    @Body() dto: UpdateSuccessorCandidateDto,
  ): Promise<KeyPositionDto> {
    return this.keyPositionsService.updateCandidate(user.organizationId, id, candidateId, dto);
  }

  @Delete(":id/candidates/:candidateId")
  @HttpCode(HttpStatus.NO_CONTENT)
  removeCandidate(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Param("candidateId") candidateId: string,
  ): Promise<void> {
    return this.keyPositionsService.removeCandidate(user.organizationId, id, candidateId);
  }
}
