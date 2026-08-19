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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const attendance_record_entity_1 = require("../../entities/attendance-record.entity");
const employee_entity_1 = require("../../entities/employee.entity");
const excel_import_service_1 = require("./services/excel.import.service");
const fs = __importStar(require("fs"));
let AttendanceService = class AttendanceService {
    attendanceRepository;
    employeeRepository;
    excelImportService;
    constructor(attendanceRepository, employeeRepository, excelImportService) {
        this.attendanceRepository = attendanceRepository;
        this.employeeRepository = employeeRepository;
        this.excelImportService = excelImportService;
    }
    async importFromExcel(filePath) {
        const data = this.excelImportService.parseExcelFile(filePath);
        const validatedData = this.excelImportService.validateAttendanceData(data);
        const results = [];
        let successCount = 0;
        let errorCount = 0;
        for (const record of validatedData) {
            try {
                const employee = await this.employeeRepository.findOne({
                    where: { employeeId: record.employeeId },
                });
                if (!employee) {
                    results.push({
                        employeeId: record.employeeId,
                        status: 'error',
                        message: `Empleado con ID ${record.employeeId} no encontrado`,
                    });
                    errorCount++;
                    continue;
                }
                const recordDate = new Date(record.timestamp);
                recordDate.setHours(0, 0, 0, 0);
                const existingRecord = await this.attendanceRepository.findOne({
                    where: {
                        employeeId: employee.id,
                        type: record.type,
                        recordDate,
                    },
                });
                if (existingRecord) {
                    results.push({
                        employeeId: record.employeeId,
                        timestamp: record.timestamp,
                        status: 'skipped',
                        message: 'Registro duplicado',
                    });
                    continue;
                }
                const attendanceRecord = this.attendanceRepository.create({
                    employeeId: employee.id,
                    timestamp: record.timestamp,
                    type: record.type,
                    recordDate,
                    source: 'biometric',
                });
                await this.attendanceRepository.save(attendanceRecord);
                successCount++;
                results.push({
                    employeeId: record.employeeId,
                    timestamp: record.timestamp,
                    status: 'success',
                });
            }
            catch (error) {
                errorCount++;
                results.push({
                    employeeId: record.employeeId,
                    status: 'error',
                    message: error.message,
                });
            }
        }
        fs.unlinkSync(filePath);
        return {
            totalRecords: validatedData.length,
            successCount,
            errorCount,
            results,
        };
    }
    async findByEmployee(employeeId, startDate, endDate) {
        const query = this.attendanceRepository.createQueryBuilder('attendance').where('attendance.employeeId = :employeeId', {
            employeeId,
        });
        if (startDate && endDate) {
            query.andWhere('attendance.recordDate BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            });
        }
        return query.orderBy('attendance.timestamp', 'ASC').getMany();
    }
    async findByCompanyAndDate(companyId, startDate, endDate) {
        return this.attendanceRepository
            .createQueryBuilder('attendance')
            .leftJoinAndSelect('attendance.employee', 'employee')
            .where('employee.companyId = :companyId', { companyId })
            .andWhere('attendance.recordDate BETWEEN :startDate AND :endDate', { startDate, endDate })
            .orderBy('attendance.recordDate', 'ASC')
            .addOrderBy('attendance.timestamp', 'ASC')
            .getMany();
    }
    async getDateRange(startDate, endDate) {
        return this.attendanceRepository
            .createQueryBuilder('attendance')
            .leftJoinAndSelect('attendance.employee', 'employee')
            .where('attendance.recordDate BETWEEN :startDate AND :endDate', { startDate, endDate })
            .orderBy('attendance.recordDate', 'ASC')
            .addOrderBy('attendance.timestamp', 'ASC')
            .getMany();
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(attendance_record_entity_1.AttendanceRecord)),
    __param(1, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        excel_import_service_1.ExcelImportService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map