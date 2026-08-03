import { AttendanceService } from './attendance.service';
export declare class AttendanceController {
    private attendanceService;
    constructor(attendanceService: AttendanceService);
    importExcel(file: Express.Multer.File): Promise<any>;
    getByEmployee(employeeId: string, startDate?: string, endDate?: string): Promise<import("../../entities/attendance-record.entity").AttendanceRecord[]>;
    getByCompany(companyId: string, startDate: string, endDate: string): Promise<import("../../entities/attendance-record.entity").AttendanceRecord[]>;
    getDateRange(startDate: string, endDate: string): Promise<import("../../entities/attendance-record.entity").AttendanceRecord[]>;
}
