"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const company_entity_1 = require("../entities/company.entity");
const employee_entity_1 = require("../entities/employee.entity");
const attendance_record_entity_1 = require("../entities/attendance-record.entity");
const justification_entity_1 = require("../entities/justification.entity");
const justification_photo_entity_1 = require("../entities/justification-photo.entity");
const user_entity_1 = require("../entities/user.entity");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '5432'),
                username: process.env.DB_USERNAME || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
                database: process.env.DB_NAME || 'asistencias_db',
                entities: [company_entity_1.Company, employee_entity_1.Employee, attendance_record_entity_1.AttendanceRecord, justification_entity_1.Justification, justification_photo_entity_1.JustificationPhoto, user_entity_1.User],
                synchronize: process.env.NODE_ENV !== 'production',
                logging: false,
                migrations: ['dist/database/migrations/*.js'],
                migrationsRun: true,
            }),
            typeorm_1.TypeOrmModule.forFeature([company_entity_1.Company, employee_entity_1.Employee, attendance_record_entity_1.AttendanceRecord, justification_entity_1.Justification, justification_photo_entity_1.JustificationPhoto, user_entity_1.User]),
        ],
        exports: [typeorm_1.TypeOrmModule],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map