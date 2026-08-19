import { Employee } from './employee.entity';
export declare class AttendanceRecord {
    id: string;
    employee: Employee;
    employeeId: string;
    timestamp: Date;
    recordDate: Date;
    type: 'entrada' | 'salida';
    source: string;
    createdAt: Date;
    updatedAt: Date;
}
