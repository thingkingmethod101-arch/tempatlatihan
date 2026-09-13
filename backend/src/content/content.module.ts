import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { FilesModule } from '../files/files.module';
import { TalentModule } from '../talent/talent.module';

@Module({
  imports: [StorageModule, FilesModule,TalentModule],
  providers: [ContentService],
  controllers: [ContentController],
  exports: [ContentService],
})
export class ContentModule {}