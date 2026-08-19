import { ReportsService } from './reports.service';
export declare class ReportsController {
    private reportsService;
    constructor(reportsService: ReportsService);
    getEmployeeAttendance(employeeId: string, startDate: string, endDate: string): Promise<{
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
        records: import("../../entities/attendance-record.entity").AttendanceRecord[];
        totalRecords: number;
    }>;
    getPayrollReport(startDate: string, endDate: string, companyId?: string): Promise<{
        period: {
            startDate: Date;
            endDate: Date;
        };
        totalEmployees: number;
        payrollData: any[];
    }>;
    downloadPayrollCSV(startDate: string, endDate: string, companyId: string, res: any): Promise<void>;
    getPendingJustifications(): Promise<{
        totalPending: number;
        groupedByEmployee: unknown[];
    }>;
    getCompanyReport(companyId: string, startDate: string, endDate: string): Promise<{
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
}
