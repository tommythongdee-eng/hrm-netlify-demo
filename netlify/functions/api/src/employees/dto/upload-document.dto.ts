import { IsIn } from "class-validator";
import { DocumentCategory } from "@hrm/shared";

const DOCUMENT_CATEGORIES = Object.values(DocumentCategory);

export class UploadDocumentDto {
  @IsIn(DOCUMENT_CATEGORIES)
  category!: (typeof DOCUMENT_CATEGORIES)[number];
}
