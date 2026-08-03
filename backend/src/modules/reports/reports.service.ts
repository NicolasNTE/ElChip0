import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AttendanceRecord } from '../../entities/attendance-record.entity';
import { Justification } from '../../entities/justification.entity';
import { Employee } from '../../entities/employee.entity';
import { Company } from '../../entities/company.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(AttendanceRecord) private attendanceRepository: Repository<AttendanceRecord>,
    @InjectRepository(Justification) private justificationRepository: Repository<Justification>,
    @InjectRepository(Employee) private employeeRepository: Repository<Employee>,
    @InjectRepository(Company) private companyRepository: Repository<Company>,
  ) {}

  async getEmployeeAttendanceReport(employeeId: string, startDate: Date, endDate: Date) {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
      relations: { company: true },
    });

    if (!employee) {
      throw new NotFoundException('Empleado no encontrado');
    }

    const records = await this.attendanceRepository.find({
      where: {
        employeeId,
        recordDate: Between(startDate, endDate),
      },
      order: { recordDate: 'ASC', timestamp: 'ASC' },
    });

    return {
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        employeeId: employee.employeeId,
        company: employee.company.name,
      },
      period: { startDate, endDate },
      records,
      totalRecords: records.length,
    };
  }

  async getPayrollReport(startDate: Date, endDate: Date, companyId?: string) {
    let employees: Employee[] = [];

    if (companyId) {
      const company = await this.companyRepository.findOne({ where: { id: companyId } });
      if (!company) {
        throw new NotFoundException('Empresa no encontrada');
      }
      employees = await this.employeeRepository.find({ where: { companyId } });
    } else {
      employees = await this.employeeRepository.find();
    }

    const payrollData: any[] = [];

    for (const employee of employees) {
      const attendanceRecords = await this.attendanceRepository.find({
        where: {
          employeeId: employee.id,
          recordDate: Between(startDate, endDate),
        },
      });

      const justifications = await this.justificationRepository.find({
        where: {
          employeeId: employee.id,
          justificationDate: Between(startDate, endDate),
          status: 'aprobada',
        },
      });

      const workDays = this.getBusinessDays(startDate, endDate);
      const attendedDays = this.getUniqueDaysAttended(attendanceRecords);
      const justifiedAbsenceDays = justifications.length;
      const unjustifiedAbsenceDays = workDays - attendedDays - justifiedAbsenceDays;

      payrollData.push({
        employee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          employeeId: employee.employeeId,
        },
        workDays,
        attendedDays,
        justifiedAbsenceDays,
        unjustifiedAbsenceDays,
        attendancePercentage: ((attendedDays / workDays) * 100).toFixed(2),
      });
    }

    return {
      period: { startDate, endDate },
      totalEmployees: employees.length,
      payrollData,
    };
  }

  async getPendingJustificationsReport() {
    const justifications = await this.justificationRepository.find({
      where: { status: 'pendiente' },
      relations: { employee: true },
      order: { createdAt: 'ASC' },
    });

    const groupedByEmployee: any = {};

    for (const justification of justifications) {
      if (!groupedByEmployee[justification.employeeId]) {
        groupedByEmployee[justification.employeeId] = {
          employee: {
            id: justification.employee.id,
            firstName: justification.employee.firstName,
            lastName: justification.employee.lastName,
          },
          justifications: [],
        };
      }
      groupedByEmployee[justification.employeeId].justifications.push({
        id: justification.id,
        date: justification.justificationDate,
        description: justification.description,
        createdAt: justification.createdAt,
      });
    }

    return {
      totalPending: justifications.length,
      groupedByEmployee: Object.values(groupedByEmployee),
    };
  }

  async getCompanyReport(companyId: string, startDate: Date, endDate: Date) {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      relations: { employees: true },
    });

    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
    }

    const attendanceRecords = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee')
      .where('employee.companyId = :companyId', { companyId })
      .andWhere('attendance.recordDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('attendance.recordDate', 'ASC')
      .getMany();

    const justifications = await this.justificationRepository.find({
      where: {
        justificationDate: Between(startDate, endDate),
      },
      relations: { employee: true },
    });

    const companyJustifications = justifications.filter((j) => j.employee.companyId === companyId);

    return {
      company: {
        id: company.id,
        name: company.name,
      },
      period: { startDate, endDate },
      totalEmployees: company.employees.length,
      totalAttendanceRecords: attendanceRecords.length,
      totalJustifications: companyJustifications.length,
      justificationsByStatus: {
        pendiente: companyJustifications.filter((j) => j.status === 'pendiente').length,
        aprobada: companyJustifications.filter((j) => j.status === 'aprobada').length,
        rechazada: companyJustifications.filter((j) => j.status === 'rechazada').length,
      },
    };
  }

  private getBusinessDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
  }

  private getUniqueDaysAttended(records: AttendanceRecord[]): number {
    const uniqueDays = new Set();
    records.forEach((record) => {
      const dateStr = record.recordDate.toISOString().split('T')[0];
      uniqueDays.add(dateStr);
    });
    return uniqueDays.size;
  }

  async exportPayrollToCSV(startDate: Date, endDate: Date, companyId?: string): Promise<string> {
    const report = await this.getPayrollReport(startDate, endDate, companyId);
    let csv = 'ID Empleado,Nombre,Apellido,Días Laborales,Días Asistidos,Faltas Justificadas,Faltas Sin Justificar,% Asistencia\n';

    for (const data of report.payrollData) {
      csv += `${data.employee.employeeId},${data.employee.firstName},${data.employee.lastName},${data.workDays},${data.attendedDays},${data.justifiedAbsenceDays},${data.unjustifiedAbsenceDays},${data.attendancePercentage}%\n`;
    }

    return csv;
  }
}
