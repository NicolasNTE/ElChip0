import { Employee } from './employee.entity';
import { JustificationPhoto } from './justification-photo.entity';
export declare class Justification {
    id: string;
    employee: Employee;
    employeeId: string;
    justificationDate: Date;
    description: string;
    status: 'pendiente' | 'aprobada' | 'rechazada';
    rejectionReason: string;
    photos: JustificationPhoto[];
    reviewedBy: string;
    reviewedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
