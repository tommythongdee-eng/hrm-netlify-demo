import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { EmailModule } from "../email/email.module";
import { DepartmentsController } from "./departments.controller";
import { DepartmentsService } from "./departments.service";
import { DocumentsController } from "./documents.controller";
import { DocumentsService } from "./documents.service";
import { EmployeesController } from "./employees.controller";
import { EmployeesService } from "./employees.service";
import { LocalStorageService } from "./storage/local-storage.service";

@Module({
  imports: [AuthModule, EmailModule],
  controllers: [EmployeesController, DepartmentsController, DocumentsController],
  providers: [EmployeesService, DepartmentsService, DocumentsService, LocalStorageService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
