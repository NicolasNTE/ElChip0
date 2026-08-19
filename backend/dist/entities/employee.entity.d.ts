import { Company } from './company.entity';
import { AttendanceRecord } from './attendance-record.entity';
import { Justification } from './justification.entity';
export declare class Employee {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    phone: string;
    email: string;
    scheduledStartTime: string;
    scheduledEndTime: string;
    company: Company;
    companyId: string;
    isActive: boolean;
    attendanceRecords: AttendanceRecord[];
    justifications: Justification[];
    createdAt: Date;
    updatedAt: Date;
}
