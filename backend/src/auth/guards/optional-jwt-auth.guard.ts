import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Jangan pernah throw error otentikasi -- kembalikan user kalau ada token valid,
  // atau null kalau tidak ada token / token tidak valid. TIDAK menolak request.
  handleRequest(err: any, user: any) {
    return user || null;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // abaikan error otentikasi apapun -- endpoint tetap boleh diakses tanpa login
    }
    return true;
  }
}