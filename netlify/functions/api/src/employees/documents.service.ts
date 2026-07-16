import { Injectable, NotFoundException } from "@nestjs/common";
import type { EmployeeDocumentDto } from "@hrm/shared";
import { PrismaService } from "../prisma/prisma.service";
import { LocalStorageService } from "./storage/local-storage.service";

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalStorageService,
  ) {}

  async list(organizationId: string, employeeId: string): Promise<EmployeeDocumentDto[]> {
    await this.assertEmployeeBelongsToOrg(organizationId, employeeId);
    const documents = await this.prisma.employeeDocument.findMany({
      where: { organizationId, employeeId },
      orderBy: { createdAt: "desc" },
    });
    return documents.map((d) => ({
      id: d.id,
      fileName: d.fileName,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      category: d.category as EmployeeDocumentDto["category"],
      createdAt: d.createdAt.toISOString(),
    }));
  }

  async save(
    organizationId: string,
    employeeId: string,
    uploadedByUserId: string,
    category: string,
    file: Express.Multer.File,
  ): Promise<EmployeeDocumentDto> {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId } });
    if (!employee) {
      await this.storage.deleteFile(this.storage.toStorageKey(file.path));
      throw new NotFoundException("Employee not found");
    }

    const document = await this.prisma.employeeDocument.create({
      data: {
        employeeId,
        organizationId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageKey: this.storage.toStorageKey(file.path),
        category,
        uploadedByUserId,
      },
    });

    return {
      id: document.id,
      fileName: document.fileName,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      category: document.category as EmployeeDocumentDto["category"],
      createdAt: document.createdAt.toISOString(),
    };
  }

  async getForDownload(
    organizationId: string,
    employeeId: string,
    documentId: string,
  ): Promise<{ absolutePath: string; fileName: string; mimeType: string }> {
    const document = await this.prisma.employeeDocument.findFirst({
      where: { id: documentId, employeeId, organizationId },
    });
    if (!document) {
      throw new NotFoundException("Document not found");
    }
    return {
      absolutePath: this.storage.resolveAbsolutePath(document.storageKey),
      fileName: document.fileName,
      mimeType: document.mimeType,
    };
  }

  async remove(organizationId: string, employeeId: string, documentId: string): Promise<void> {
    const document = await this.prisma.employeeDocument.findFirst({
      where: { id: documentId, employeeId, organizationId },
    });
    if (!document) {
      throw new NotFoundException("Document not found");
    }
    await this.prisma.employeeDocument.delete({ where: { id: documentId } });
    await this.storage.deleteFile(document.storageKey);
  }

  private async assertEmployeeBelongsToOrg(organizationId: string, employeeId: string): Promise<void> {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId } });
    if (!employee) {
      throw new NotFoundException("Employee not found");
    }
  }
}
