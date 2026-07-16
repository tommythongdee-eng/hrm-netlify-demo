import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { SuperAdminGuard } from "./guards/superadmin.guard";

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard, SuperAdminGuard],
  // JwtModule must be re-exported (not just the guards) so any module that
  // imports AuthModule can resolve JwtAuthGuard's JwtService dependency too.
  exports: [JwtModule, JwtAuthGuard, RolesGuard, SuperAdminGuard],
})
export class AuthModule {}
