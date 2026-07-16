import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { RequestUser } from "../request-context";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException("Missing access token");
    }

    try {
      const payload = await this.jwtService.verifyAsync<RequestUser>(token, {
        secret: this.configService.get<string>("JWT_ACCESS_SECRET"),
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }
  }

  private extractToken(request: { headers: Record<string, string | undefined> }): string | undefined {
    const header = request.headers["authorization"];
    if (!header) return undefined;
    const [scheme, token] = header.split(" ");
    return scheme === "Bearer" ? token : undefined;
  }
}
