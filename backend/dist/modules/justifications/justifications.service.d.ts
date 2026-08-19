import { Repository } from 'typeorm';
import { Justification } from '../../entities/justification.entity';
import { JustificationPhoto } from '../../entities/justification-photo.entity';
import { Employee } from '../../entities/employee.entity';
import { CreateJustificationDto } from './dto/create-justification.dto';
import { UpdateJustificationDto } from './dto/update-justification.dto';
export declare class JustificationsService {
    private justificationRepository;
    private photoRepository;
    private employeeRepository;
    constructor(justificationRepository: Repository<Justification>, photoRepository: Repository<JustificationPhoto>, employeeRepository: Repository<Employee>);
    create(createJustificationDto: CreateJustificationDto, photos?: Express.Multer.File[]): Promise<Justification>;
    findAll(): Promise<Justification[]>;
    findByEmployee(employeeId: string): Promise<Justification[]>;
    findByStatus(status: 'pendiente' | 'aprobada' | 'rechazada'): Promise<Justification[]>;
    findOne(id: string): Promise<Justification>;
    update(id: string, updateJustificationDto: UpdateJustificationDto, newPhotos?: Express.Multer.File[]): Promise<Justification>;
    approve(id: string, reviewedBy: string): Promise<Justification>;
    reject(id: string, rejectionReason: string, reviewedBy: string): Promise<Justification>;
    remove(id: string): Promise<void>;
    addPhoto(justificationId: string, photo: Express.Multer.File): Promise<Justification>;
    removePhoto(photoId: string): Promise<void>;
    getStatistics(): Promise<any>;
}
