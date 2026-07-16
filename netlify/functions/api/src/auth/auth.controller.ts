import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import type { AuthResponse, AuthenticatedUser, SuperAdminAuthResponse } from "@hrm/shared";
import { CurrentUser } from "./decorators/current-user.decorator";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { RegisterOrganizationDto } from "./dto/register-organization.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import type { RequestUser } from "./request-context";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register-organization")
  registerOrganization(@Body() dto: RegisterOrganizationDto): Promise<AuthResponse> {
    return this.authService.registerOrganization(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto): Promise<AuthResponse> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post("superadmin-login")
  @HttpCode(HttpStatus.OK)
  superadminLogin(@Body() dto: LoginDto): Promise<SuperAdminAuthResponse> {
    return this.authService.superadminLogin(dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: RequestUser): Promise<AuthenticatedUser> {
    return this.authService.getCurrentUser(user);
  }
}
