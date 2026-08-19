"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JustificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const justification_entity_1 = require("../../entities/justification.entity");
const justification_photo_entity_1 = require("../../entities/justification-photo.entity");
const employee_entity_1 = require("../../entities/employee.entity");
const fs = __importStar(require("fs"));
let JustificationsService = class JustificationsService {
    justificationRepository;
    photoRepository;
    employeeRepository;
    constructor(justificationRepository, photoRepository, employeeRepository) {
        this.justificationRepository = justificationRepository;
        this.photoRepository = photoRepository;
        this.employeeRepository = employeeRepository;
    }
    async create(createJustificationDto, photos) {
        const employee = await this.employeeRepository.findOne({
            where: { id: createJustificationDto.employeeId },
        });
        if (!employee) {
            throw new common_1.NotFoundException('Empleado no encontrado');
        }
        const justification = this.justificationRepository.create({
            ...createJustificationDto,
            status: 'pendiente',
        });
        const savedJustification = await this.justificationRepository.save(justification);
        if (photos && photos.length > 0) {
            for (const photo of photos) {
                await this.photoRepository.save({
                    justificationId: savedJustification.id,
                    fileName: photo.originalname,
                    filePath: photo.path,
                    mimeType: photo.mimetype,
                    fileSize: photo.size,
                });
            }
        }
        return this.findOne(savedJustification.id);
    }
    async findAll() {
        return this.justificationRepository.find({
            relations: { photos: true, employee: true },
            order: { createdAt: 'DESC' },
        });
    }
    async findByEmployee(employeeId) {
        return this.justificationRepository.find({
            where: { employeeId },
            relations: { photos: true },
            order: { createdAt: 'DESC' },
        });
    }
    async findByStatus(status) {
        return this.justificationRepository.find({
            where: { status },
            relations: { employee: true, photos: true },
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const justification = await this.justificationRepository.findOne({
            where: { id },
            relations: { photos: true, employee: true },
        });
        if (!justification) {
            throw new common_1.NotFoundException(`Justificación con ID ${id} no encontrada`);
        }
        return justification;
    }
    async update(id, updateJustificationDto, newPhotos) {
        const justification = await this.findOne(id);
        if (justification.status !== 'pendiente') {
            throw new common_1.BadRequestException('No se puede editar una justificación que ya fue revisada');
        }
        await this.justificationRepository.update(id, updateJustificationDto);
        if (newPhotos && newPhotos.length > 0) {
            for (const photo of newPhotos) {
                await this.photoRepository.save({
                    justificationId: id,
                    fileName: photo.originalname,
                    filePath: photo.path,
                    mimeType: photo.mimetype,
                    fileSize: photo.size,
                });
            }
        }
        return this.findOne(id);
    }
    async approve(id, reviewedBy) {
        const justification = await this.findOne(id);
        await this.justificationRepository.update(id, {
            status: 'aprobada',
            reviewedBy,
            reviewedAt: new Date(),
        });
        return this.findOne(id);
    }
    async reject(id, rejectionReason, reviewedBy) {
        const justification = await this.findOne(id);
        await this.justificationRepository.update(id, {
            status: 'rechazada',
            rejectionReason,
            reviewedBy,
            reviewedAt: new Date(),
        });
        return this.findOne(id);
    }
    async remove(id) {
        const justification = await this.findOne(id);
        const photos = await this.photoRepository.find({ where: { justificationId: id } });
        for (const photo of photos) {
            if (fs.existsSync(photo.filePath)) {
                fs.unlinkSync(photo.filePath);
            }
        }
        await this.photoRepository.delete({ justificationId: id });
        await this.justificationRepository.remove(justification);
    }
    async addPhoto(justificationId, photo) {
        const justification = await this.findOne(justificationId);
        await this.photoRepository.save({
            justificationId,
            fileName: photo.originalname,
            filePath: photo.path,
            mimeType: photo.mimetype,
            fileSize: photo.size,
        });
        return this.findOne(justificationId);
    }
    async removePhoto(photoId) {
        const photo = await this.photoRepository.findOne({ where: { id: photoId } });
        if (!photo) {
            throw new common_1.NotFoundException('Foto no encontrada');
        }
        if (fs.existsSync(photo.filePath)) {
            fs.unlinkSync(photo.filePath);
        }
        await this.photoRepository.remove(photo);
    }
    async getStatistics() {
        const total = await this.justificationRepository.count();
        const pending = await this.justificationRepository.countBy({ status: 'pendiente' });
        const approved = await this.justificationRepository.countBy({ status: 'aprobada' });
        const rejected = await this.justificationRepository.countBy({ status: 'rechazada' });
        return {
            total,
            pending,
            approved,
            rejected,
            approvalRate: total > 0 ? ((approved / total) * 100).toFixed(2) : 0,
        };
    }
};
exports.JustificationsService = JustificationsService;
exports.JustificationsService = JustificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(justification_entity_1.Justification)),
    __param(1, (0, typeorm_1.InjectRepository)(justification_photo_entity_1.JustificationPhoto)),
    __param(2, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], JustificationsService);
//# sourceMappingURL=justifications.service.js.map