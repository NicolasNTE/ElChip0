import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceRecord } from '../../entities/attendance-record.entity';
import { Employee } from '../../entities/employee.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { ExcelImportService } from './services/excel.import.service';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceRecord, Employee])],
  controllers: [AttendanceController],
  providers: [AttendanceService, ExcelImportService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
