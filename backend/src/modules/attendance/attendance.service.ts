import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AttendanceRecord } from '../../entities/attendance-record.entity';
import { Employee } from '../../entities/employee.entity';
import { ExcelImportService } from './services/excel.import.service';
import * as fs from 'fs';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceRecord) private attendanceRepository: Repository<AttendanceRecord>,
    @InjectRepository(Employee) private employeeRepository: Repository<Employee>,
    private excelImportService: ExcelImportService,
  ) {}

  async importFromExcel(filePath: string): Promise<any> {
    const data = this.excelImportService.parseExcelFile(filePath);
    const validatedData = this.excelImportService.validateAttendanceData(data);

    const results: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const record of validatedData) {
      try {
        const employee = await this.employeeRepository.findOne({
          where: { employeeId: record.employeeId },
        });

        if (!employee) {
          results.push({
            employeeId: record.employeeId,
            status: 'error',
            message: `Empleado con ID ${record.employeeId} no encontrado`,
          });
          errorCount++;
          continue;
        }

        const recordDate = new Date(record.timestamp);
        recordDate.setHours(0, 0, 0, 0);

        const existingRecord = await this.attendanceRepository.findOne({
          where: {
            employeeId: employee.id,
            type: record.type,
            recordDate,
          },
        });

        if (existingRecord) {
          results.push({
            employeeId: record.employeeId,
            timestamp: record.timestamp,
            status: 'skipped',
            message: 'Registro duplicado',
          });
          continue;
        }

        const attendanceRecord = this.attendanceRepository.create({
          employeeId: employee.id,
          timestamp: record.timestamp,
          type: record.type,
          recordDate,
          source: 'biometric',
        });

        await this.attendanceRepository.save(attendanceRecord);
        successCount++;
        results.push({
          employeeId: record.employeeId,
          timestamp: record.timestamp,
          status: 'success',
        });
      } catch (error) {
        errorCount++;
        results.push({
          employeeId: record.employeeId,
          status: 'error',
          message: error.message,
        });
      }
    }

    fs.unlinkSync(filePath);

    return {
      totalRecords: validatedData.length,
      successCount,
      errorCount,
      results,
    };
  }

  async findByEmployee(employeeId: string, startDate?: Date, endDate?: Date) {
    const query = this.attendanceRepository.createQueryBuilder('attendance').where('attendance.employeeId = :employeeId', {
      employeeId,
    });

    if (startDate && endDate) {
      query.andWhere('attendance.recordDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    return query.orderBy('attendance.timestamp', 'ASC').getMany();
  }

  async findByCompanyAndDate(companyId: string, startDate: Date, endDate: Date) {
    return this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee')
      .where('employee.companyId = :companyId', { companyId })
      .andWhere('attendance.recordDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('attendance.recordDate', 'ASC')
      .addOrderBy('attendance.timestamp', 'ASC')
      .getMany();
  }

  async getDateRange(startDate: Date, endDate: Date) {
    return this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee')
      .where('attendance.recordDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('attendance.recordDate', 'ASC')
      .addOrderBy('attendance.timestamp', 'ASC')
      .getMany();
  }
}
