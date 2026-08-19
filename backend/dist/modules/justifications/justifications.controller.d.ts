import { JustificationsService } from './justifications.service';
import { CreateJustificationDto } from './dto/create-justification.dto';
import { UpdateJustificationDto } from './dto/update-justification.dto';
import { ApproveJustificationDto } from './dto/approve-justification.dto';
import { RejectJustificationDto } from './dto/reject-justification.dto';
export declare class JustificationsController {
    private justificationsService;
    constructor(justificationsService: JustificationsService);
    create(createJustificationDto: CreateJustificationDto, photos?: Express.Multer.File[]): Promise<import("../../entities/justification.entity").Justification>;
    findAll(status?: string): Promise<import("../../entities/justification.entity").Justification[]>;
    getStatistics(): Promise<any>;
    getByEmployee(employeeId: string): Promise<import("../../entities/justification.entity").Justification[]>;
    findOne(id: string): Promise<import("../../entities/justification.entity").Justification>;
    update(id: string, updateJustificationDto: UpdateJustificationDto, photos?: Express.Multer.File[]): Promise<import("../../entities/justification.entity").Justification>;
    approve(id: string, approveDto: ApproveJustificationDto): Promise<import("../../entities/justification.entity").Justification>;
    reject(id: string, rejectDto: RejectJustificationDto): Promise<import("../../entities/justification.entity").Justification>;
    remove(id: string): Promise<{
        message: string;
    }>;
    addPhotos(id: string, photos: Express.Multer.File[]): Promise<import("../../entities/justification.entity").Justification>;
    removePhoto(photoId: string): Promise<{
        message: string;
    }>;
}
