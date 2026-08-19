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
exports.JustificationsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const justifications_service_1 = require("./justifications.service");
const create_justification_dto_1 = require("./dto/create-justification.dto");
const update_justification_dto_1 = require("./dto/update-justification.dto");
const approve_justification_dto_1 = require("./dto/approve-justification.dto");
const reject_justification_dto_1 = require("./dto/reject-justification.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const roles_guard_1 = require("../auth/guards/roles.guard");
const multer_1 = require("multer");
const path = __importStar(require("path"));
const storage = (0, multer_1.diskStorage)({
    destination: (req, file, cb) => {
        cb(null, './uploads/justifications');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new common_1.BadRequestException('Solo se aceptan imágenes JPEG/PNG o PDF'), false);
    }
};
let JustificationsController = class JustificationsController {
    justificationsService;
    constructor(justificationsService) {
        this.justificationsService = justificationsService;
    }
    async create(createJustificationDto, photos) {
        return this.justificationsService.create(createJustificationDto, photos);
    }
    async findAll(status) {
        if (status) {
            const validStatus = ['pendiente', 'aprobada', 'rechazada'];
            if (!validStatus.includes(status)) {
                throw new common_1.BadRequestException('Estado inválido');
            }
            return this.justificationsService.findByStatus(status);
        }
        return this.justificationsService.findAll();
    }
    async getStatistics() {
        return this.justificationsService.getStatistics();
    }
    async getByEmployee(employeeId) {
        return this.justificationsService.findByEmployee(employeeId);
    }
    async findOne(id) {
        return this.justificationsService.findOne(id);
    }
    async update(id, updateJustificationDto, photos) {
        return this.justificationsService.update(id, updateJustificationDto, photos);
    }
    async approve(id, approveDto) {
        return this.justificationsService.approve(id, approveDto.reviewedBy);
    }
    async reject(id, rejectDto) {
        return this.justificationsService.reject(id, rejectDto.rejectionReason, rejectDto.reviewedBy);
    }
    async remove(id) {
        await this.justificationsService.remove(id);
        return { message: 'Justificación eliminada exitosamente' };
    }
    async addPhotos(id, photos) {
        if (!photos || photos.length === 0) {
            throw new common_1.BadRequestException('No se proporcionaron fotos');
        }
        let justification = await this.justificationsService.findOne(id);
        for (const photo of photos) {
            justification = await this.justificationsService.addPhoto(id, photo);
        }
        return justification;
    }
    async removePhoto(photoId) {
        await this.justificationsService.removePhoto(photoId);
        return { message: 'Foto eliminada exitosamente' };
    }
};
exports.JustificationsController = JustificationsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('photos', 5, { storage, fileFilter })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_justification_dto_1.CreateJustificationDto, Array]),
    __metadata("design:returntype", Promise)
], JustificationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JustificationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JustificationsController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)('employee/:employeeId'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JustificationsController.prototype, "getByEmployee", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JustificationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('photos', 5, { storage, fileFilter })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_justification_dto_1.UpdateJustificationDto, Array]),
    __metadata("design:returntype", Promise)
], JustificationsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, approve_justification_dto_1.ApproveJustificationDto]),
    __metadata("design:returntype", Promise)
], JustificationsController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reject_justification_dto_1.RejectJustificationDto]),
    __metadata("design:returntype", Promise)
], JustificationsController.prototype, "reject", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JustificationsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/photos'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('photos', 5, { storage, fileFilter })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], JustificationsController.prototype, "addPhotos", null);
__decorate([
    (0, common_1.Delete)(':justificationId/photos/:photoId'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('photoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JustificationsController.prototype, "removePhoto", null);
exports.JustificationsController = JustificationsController = __decorate([
    (0, common_1.Controller)('justifications'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [justifications_service_1.JustificationsService])
], JustificationsController);
//# sourceMappingURL=justifications.controller.js.map