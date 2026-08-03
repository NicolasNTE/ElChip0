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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const attendance_record_entity_1 = require("../../entities/attendance-record.entity");
const justification_entity_1 = require("../../entities/justification.entity");
const employee_entity_1 = require("../../entities/employee.entity");
const company_entity_1 = require("../../entities/company.entity");
let ReportsService = class ReportsService {
    attendanceRepository;
    justificationRepository;
    employeeRepository;
    companyRepository;
    constructor(attendanceRepository, justificationRepository, employeeRepository, companyRepository) {
        this.attendanceRepository = attendanceRepository;
        this.justificationRepository = justificationRepository;
        this.employeeRepository = employeeRepository;
        this.companyRepository = companyRepository;
    }
    async getEmployeeAttendanceReport(employeeId, startDate, endDate) {
        const employee = await this.employeeRepository.findOne({
            where: { id: employeeId },
            relations: { company: true },
        });
        if (!employee) {
            throw new common_1.NotFoundException('Empleado no encontrado');
        }
        const records = await this.attendanceRepository.find({
            where: {
                employeeId,
                recordDate: (0, typeorm_2.Between)(startDate, endDate),
            },
            order: { recordDate: 'ASC', timestamp: 'ASC' },
        });
        return {
            employee: {
                id: employee.id,
                firstName: employee.firstName,
                lastName: employee.lastName,
                employeeId: employee.employeeId,
                company: employee.company.name,
            },
            period: { startDate, endDate },
            records,
            totalRecords: records.length,
        };
    }
    async getPayrollReport(startDate, endDate, companyId) {
        let employees = [];
        if (companyId) {
            const company = await this.companyRepository.findOne({ where: { id: companyId } });
            if (!company) {
                throw new common_1.NotFoundException('Empresa no encontrada');
            }
            employees = await this.employeeRepository.find({ where: { companyId } });
        }
        else {
            employees = await this.employeeRepository.find();
        }
        const payrollData = [];
        for (const employee of employees) {
            const attendanceRecords = await this.attendanceRepository.find({
                where: {
                    employeeId: employee.id,
                    recordDate: (0, typeorm_2.Between)(startDate, endDate),
                },
            });
            const justifications = await this.justificationRepository.find({
                where: {
                    employeeId: employee.id,
                    justificationDate: (0, typeorm_2.Between)(startDate, endDate),
                    status: 'aprobada',
                },
            });
            const workDays = this.getBusinessDays(startDate, endDate);
            const attendedDays = this.getUniqueDaysAttended(attendanceRecords);
            const justifiedAbsenceDays = justifications.length;
            const unjustifiedAbsenceDays = workDays - attendedDays - justifiedAbsenceDays;
            payrollData.push({
                employee: {
                    id: employee.id,
                    firstName: employee.firstName,
                    lastName: employee.lastName,
                    employeeId: employee.employeeId,
                },
                workDays,
                attendedDays,
                justifiedAbsenceDays,
                unjustifiedAbsenceDays,
                attendancePercentage: ((attendedDays / workDays) * 100).toFixed(2),
            });
        }
        return {
            period: { startDate, endDate },
            totalEmployees: employees.length,
            payrollData,
        };
    }
    async getPendingJustificationsReport() {
        const justifications = await this.justificationRepository.find({
            where: { status: 'pendiente' },
            relations: { employee: true },
            order: { createdAt: 'ASC' },
        });
        const groupedByEmployee = {};
        for (const justification of justifications) {
            if (!groupedByEmployee[justification.employeeId]) {
                groupedByEmployee[justification.employeeId] = {
                    employee: {
                        id: justification.employee.id,
                        firstName: justification.employee.firstName,
                        lastName: justification.employee.lastName,
                    },
                    justifications: [],
                };
            }
            groupedByEmployee[justification.employeeId].justifications.push({
                id: justification.id,
                date: justification.justificationDate,
                description: justification.description,
                createdAt: justification.createdAt,
            });
        }
        return {
            totalPending: justifications.length,
            groupedByEmployee: Object.values(groupedByEmployee),
        };
    }
    async getCompanyReport(companyId, startDate, endDate) {
        const company = await this.companyRepository.findOne({
            where: { id: companyId },
            relations: { employees: true },
        });
        if (!company) {
            throw new common_1.NotFoundException('Empresa no encontrada');
        }
        const attendanceRecords = await this.attendanceRepository
            .createQueryBuilder('attendance')
            .leftJoinAndSelect('attendance.employee', 'employee')
            .where('employee.companyId = :companyId', { companyId })
            .andWhere('attendance.recordDate BETWEEN :startDate AND :endDate', { startDate, endDate })
            .orderBy('attendance.recordDate', 'ASC')
            .getMany();
        const justifications = await this.justificationRepository.find({
            where: {
                justificationDate: (0, typeorm_2.Between)(startDate, endDate),
            },
            relations: { employee: true },
        });
        const companyJustifications = justifications.filter((j) => j.employee.companyId === companyId);
        return {
            company: {
                id: company.id,
                name: company.name,
            },
            period: { startDate, endDate },
            totalEmployees: company.employees.length,
            totalAttendanceRecords: attendanceRecords.length,
            totalJustifications: companyJustifications.length,
            justificationsByStatus: {
                pendiente: companyJustifications.filter((j) => j.status === 'pendiente').length,
                aprobada: companyJustifications.filter((j) => j.status === 'aprobada').length,
                rechazada: companyJustifications.filter((j) => j.status === 'rechazada').length,
            },
        };
    }
    getBusinessDays(startDate, endDate) {
        let count = 0;
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                count++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return count;
    }
    getUniqueDaysAttended(records) {
        const uniqueDays = new Set();
        records.forEach((record) => {
            const dateStr = record.recordDate.toISOString().split('T')[0];
            uniqueDays.add(dateStr);
        });
        return uniqueDays.size;
    }
    async exportPayrollToCSV(startDate, endDate, companyId) {
        const report = await this.getPayrollReport(startDate, endDate, companyId);
        let csv = 'ID Empleado,Nombre,Apellido,Días Laborales,Días Asistidos,Faltas Justificadas,Faltas Sin Justificar,% Asistencia\n';
        for (const data of report.payrollData) {
            csv += `${data.employee.employeeId},${data.employee.firstName},${data.employee.lastName},${data.workDays},${data.attendedDays},${data.justifiedAbsenceDays},${data.unjustifiedAbsenceDays},${data.attendancePercentage}%\n`;
        }
        return csv;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(attendance_record_entity_1.AttendanceRecord)),
    __param(1, (0, typeorm_1.InjectRepository)(justification_entity_1.Justification)),
    __param(2, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __param(3, (0, typeorm_1.InjectRepository)(company_entity_1.Company)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ReportsService);
//# sourceMappingURL=reports.service.js.map