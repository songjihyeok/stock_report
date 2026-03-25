import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '@vb/shared';

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthUser = request.user;

    if (!user) return undefined;
    return data ? user[data] : user;
  },
);
