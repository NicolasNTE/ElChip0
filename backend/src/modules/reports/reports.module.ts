import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceRecord } from '../../entities/attendance-record.entity';
import { Justification } from '../../entities/justification.entity';
import { Employee } from '../../entities/employee.entity';
import { Company } from '../../entities/company.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceRecord, Justification, Employee, Company])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
