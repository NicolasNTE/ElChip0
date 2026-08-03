import { Employee } from './employee.entity';
export declare class Company {
    id: string;
    name: string;
    ruc: string;
    address: string;
    employees: Employee[];
    createdAt: Date;
    updatedAt: Date;
}
