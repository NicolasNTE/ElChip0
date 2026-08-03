import { Repository } from 'typeorm';
import { AttendanceRecord } from '../../entities/attendance-record.entity';
import { Justification } from '../../entities/justification.entity';
import { Employee } from '../../entities/employee.entity';
import { Company } from '../../entities/company.entity';
export declare class ReportsService {
    private attendanceRepository;
    private justificationRepository;
    private employeeRepository;
    private companyRepository;
    constructor(attendanceRepository: Repository<AttendanceRecord>, justificationRepository: Repository<Justification>, employeeRepository: Repository<Employee>, companyRepository: Repository<Company>);
    getEmployeeAttendanceReport(employeeId: string, startDate: Date, endDate: Date): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeId: string;
            company: string;
        };
        period: {
            startDate: Date;
            endDate: Date;
        };
        records: AttendanceRecord[];
        totalRecords: number;
    }>;
    getPayrollReport(startDate: Date, endDate: Date, companyId?: string): Promise<{
        period: {
            startDate: Date;
            endDate: Date;
        };
        totalEmployees: number;
        payrollData: any[];
    }>;
    getPendingJustificationsReport(): Promise<{
        totalPending: number;
        groupedByEmployee: unknown[];
    }>;
    getCompanyReport(companyId: string, startDate: Date, endDate: Date): Promise<{
        company: {
            id: string;
            name: string;
        };
        period: {
            startDate: Date;
            endDate: Date;
        };
        totalEmployees: number;
        totalAttendanceRecords: number;
        totalJustifications: number;
        justificationsByStatus: {
            pendiente: number;
            aprobada: number;
            rechazada: number;
        };
    }>;
    private getBusinessDays;
    private getUniqueDaysAttended;
    exportPayrollToCSV(startDate: Date, endDate: Date, companyId?: string): Promise<string>;
}
