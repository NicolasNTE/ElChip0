import { Repository } from 'typeorm';
import { AttendanceRecord } from '../../entities/attendance-record.entity';
import { Employee } from '../../entities/employee.entity';
import { ExcelImportService } from './services/excel.import.service';
export declare class AttendanceService {
    private attendanceRepository;
    private employeeRepository;
    private excelImportService;
    constructor(attendanceRepository: Repository<AttendanceRecord>, employeeRepository: Repository<Employee>, excelImportService: ExcelImportService);
    importFromExcel(filePath: string): Promise<any>;
    findByEmployee(employeeId: string, startDate?: Date, endDate?: Date): Promise<AttendanceRecord[]>;
    findByCompanyAndDate(companyId: string, startDate: Date, endDate: Date): Promise<AttendanceRecord[]>;
    getDateRange(startDate: Date, endDate: Date): Promise<AttendanceRecord[]>;
}
