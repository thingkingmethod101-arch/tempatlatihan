import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface RiasecMappingInput {
  kombinasi: string;
  saranJurusan: string;
  saranKarir: string;
}

@Injectable()
export class RiasecMappingService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.riasecMapping.findMany({ orderBy: { kombinasi: 'asc' } });
  }

  create(dto: RiasecMappingInput) {
    const kombinasi = dto.kombinasi.toUpperCase().trim();
    return this.prisma.riasecMapping.upsert({
      where: { kombinasi },
      update: { saranJurusan: dto.saranJurusan, saranKarir: dto.saranKarir },
      create: { kombinasi, saranJurusan: dto.saranJurusan, saranKarir: dto.saranKarir },
    });
  }

  async bulkUpload(data: unknown) {
    if (!Array.isArray(data)) {
      throw new BadRequestException('Format JSON harus berupa daftar/array kombinasi');
    }

    let berhasil = 0;
    const gagal: string[] = [];

    for (const item of data) {
      if (
        !item || typeof item !== 'object' ||
        !('kombinasi' in item) || !('saranJurusan' in item) || !('saranKarir' in item)
      ) {
        gagal.push(JSON.stringify(item));
        continue;
      }
      const { kombinasi, saranJurusan, saranKarir } = item as RiasecMappingInput;
      if (!kombinasi || !saranJurusan || !saranKarir) {
        gagal.push(kombinasi || '(kombinasi kosong)');
        continue;
      }
      await this.create({ kombinasi, saranJurusan, saranKarir });
      berhasil++;
    }

    return { berhasil, gagal, totalDiproses: data.length };
  }

  delete(id: string) {
    return this.prisma.riasecMapping.delete({ where: { id } });
  }

  async lookup(kodeDuaHuruf: string): Promise<{ saranJurusan: string; saranKarir: string } | null> {
    const upper = kodeDuaHuruf.toUpperCase();
    const dibalik = upper.split('').reverse().join('');
    const found = await this.prisma.riasecMapping.findFirst({
      where: { OR: [{ kombinasi: upper }, { kombinasi: dibalik }] },
    });
    return found ? { saranJurusan: found.saranJurusan, saranKarir: found.saranKarir } : null;
  }
}