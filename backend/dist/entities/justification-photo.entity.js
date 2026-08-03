"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JustificationPhoto = void 0;
const typeorm_1 = require("typeorm");
const justification_entity_1 = require("./justification.entity");
let JustificationPhoto = class JustificationPhoto {
    id;
    justification;
    justificationId;
    fileName;
    filePath;
    mimeType;
    fileSize;
    createdAt;
};
exports.JustificationPhoto = JustificationPhoto;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], JustificationPhoto.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => justification_entity_1.Justification, (justification) => justification.photos, { onDelete: 'CASCADE' }),
    __metadata("design:type", justification_entity_1.Justification)
], JustificationPhoto.prototype, "justification", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], JustificationPhoto.prototype, "justificationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], JustificationPhoto.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], JustificationPhoto.prototype, "filePath", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], JustificationPhoto.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], JustificationPhoto.prototype, "fileSize", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], JustificationPhoto.prototype, "createdAt", void 0);
exports.JustificationPhoto = JustificationPhoto = __decorate([
    (0, typeorm_1.Entity)('justification_photos')
], JustificationPhoto);
//# sourceMappingURL=justification-photo.entity.js.map