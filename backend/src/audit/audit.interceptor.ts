import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';
import { AUDIT_KEY, AuditMetadata } from './audit.decorator';

function sanitize(value: any) {
  // Prisma bisa mengembalikan tipe Decimal/Date yang tidak otomatis jadi JSON aman;
  // round-trip lewat JSON.stringify memastikan cuma data serializable yang disimpan.
  if (value === null || value === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return undefined;
  }
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const meta = this.reflector.get<AuditMetadata>(AUDIT_KEY, context.getHandler());
    if (!meta) return next.handle(); // endpoint tanpa @Audit() -> tidak diproses sama sekali

    const request = context.switchToHttp().getRequest();
    const entityId: string | undefined = request.params?.id;
    const actorId: string | null = request.user?.id ?? null;
    const actorRole = request.user?.role ?? null;
    const ipAddress: string | undefined = request.ip;

    let beforeState: any = undefined;
    const model = (this.prisma as any)[meta.prismaModel];
    if (entityId && model) {
      beforeState = await model.findUnique({ where: { id: entityId } }).catch(() => undefined);
    }

    return next.handle().pipe(
      tap((result) => {
        // Fire-and-forget: TIDAK menunggu, TIDAK menggagalkan response kalau audit gagal disimpan
        this.prisma.auditLog
          .create({
            data: {
              actorId,
              actorRole,
              aksi: meta.aksi,
              entityType: meta.entityType,
              entityId: entityId ?? result?.id ?? 'unknown',
              beforeState: sanitize(beforeState),
              afterState: sanitize(result),
              ipAddress,
            },
          })
          .catch((err) => {
            console.error('[AuditInterceptor] Gagal menyimpan AuditLog:', err.message);
          });
      }),
    );
  }
}