import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';

@Module({
  imports: [StorageModule],
  providers: [FilesService],
  controllers: [FilesController],
  exports: [FilesService],
})
export class FilesModule {}