import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { OrganizationsController } from "./organizations.controller";
import { OrganizationsService } from "./organizations.service";
import { PlansController } from "./plans.controller";

@Module({
  imports: [AuthModule],
  controllers: [OrganizationsController, PlansController],
  providers: [OrganizationsService],
})
export class SuperAdminModule {}
