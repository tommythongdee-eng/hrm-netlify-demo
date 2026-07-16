import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { SuperAdminUser } from "../superadmin-request-context";

export const CurrentSuperAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SuperAdminUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.superAdmin as SuperAdminUser;
  },
);
