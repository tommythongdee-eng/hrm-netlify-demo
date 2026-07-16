import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { MembershipRole } from "@hrm/shared";
import { ROLES_KEY } from "../decorators/roles.decorator";
import type { RequestUser } from "../request-context";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<MembershipRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser | undefined;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException("Insufficient role for this action");
    }

    return true;
  }
}
