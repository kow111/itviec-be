import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { MulterModule } from '@nestjs/platform-express';
import { MulterConfigService } from './multer.config';
import { FirebaseService } from './firebase.service';

@Module({
  controllers: [FilesController],
  providers: [FilesService, FirebaseService],
})
export class FilesModule {}
