import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { BeritaService } from './berita.service';
import { BeritaController } from './berita.controller';

@Module({
  imports: [StorageModule],
  providers: [BeritaService],
  controllers: [BeritaController],
})
export class BeritaModule {}