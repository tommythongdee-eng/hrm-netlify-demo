import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { createReadStream } from "fs";
import type { EmployeeDocumentDto } from "@hrm/shared";
import { MembershipRole } from "@hrm/shared";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { RequestUser } from "../auth/request-context";
import { DocumentsService } from "./documents.service";
import { UploadDocumentDto } from "./dto/upload-document.dto";
import { createEmployeeDocumentsStorage } from "./storage/local-storage.service";

@Controller("employees/:id/documents")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Param("id") employeeId: string): Promise<EmployeeDocumentDto[]> {
    return this.documentsService.list(user.organizationId, employeeId);
  }

  @Post()
  @UseInterceptors(FileInterceptor("file", { storage: createEmployeeDocumentsStorage() }))
  upload(
    @CurrentUser() user: RequestUser,
    @Param("id") employeeId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadDocumentDto,
  ): Promise<EmployeeDocumentDto> {
    return this.documentsService.save(user.organizationId, employeeId, user.sub, body.category, file);
  }

  @Get(":documentId/download")
  async download(
    @CurrentUser() user: RequestUser,
    @Param("id") employeeId: string,
    @Param("documentId") documentId: string,
  ): Promise<StreamableFile> {
    const { absolutePath, fileName, mimeType } = await this.documentsService.getForDownload(
      user.organizationId,
      employeeId,
      documentId,
    );
    return new StreamableFile(createReadStream(absolutePath), {
      type: mimeType,
      disposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
    });
  }

  @Delete(":documentId")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: RequestUser,
    @Param("id") employeeId: string,
    @Param("documentId") documentId: string,
  ): Promise<void> {
    return this.documentsService.remove(user.organizationId, employeeId, documentId);
  }
}
