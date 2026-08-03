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
exports.Justification = void 0;
const typeorm_1 = require("typeorm");
const employee_entity_1 = require("./employee.entity");
const justification_photo_entity_1 = require("./justification-photo.entity");
let Justification = class Justification {
    id;
    employee;
    employeeId;
    justificationDate;
    description;
    status;
    rejectionReason;
    photos;
    reviewedBy;
    reviewedAt;
    createdAt;
    updatedAt;
};
exports.Justification = Justification;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Justification.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => employee_entity_1.Employee, (employee) => employee.justifications, { onDelete: 'CASCADE' }),
    (0, typeorm_1.ForeignKey)(() => employee_entity_1.Employee),
    __metadata("design:type", employee_entity_1.Employee)
], Justification.prototype, "employee", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], Justification.prototype, "employeeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Justification.prototype, "justificationDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Justification.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'pendiente' }),
    __metadata("design:type", String)
], Justification.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Justification.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => justification_photo_entity_1.JustificationPhoto, (photo) => photo.justification, { cascade: true }),
    __metadata("design:type", Array)
], Justification.prototype, "photos", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Justification.prototype, "reviewedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Justification.prototype, "reviewedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Justification.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Justification.prototype, "updatedAt", void 0);
exports.Justification = Justification = __decorate([
    (0, typeorm_1.Entity)('justifications')
], Justification);
//# sourceMappingURL=justification.entity.js.map