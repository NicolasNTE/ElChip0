import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Justification } from '../../entities/justification.entity';
import { JustificationPhoto } from '../../entities/justification-photo.entity';
import { Employee } from '../../entities/employee.entity';
import { JustificationsService } from './justifications.service';
import { JustificationsController } from './justifications.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Justification, JustificationPhoto, Employee])],
  controllers: [JustificationsController],
  providers: [JustificationsService],
  exports: [JustificationsService],
})
export class JustificationsModule {}
