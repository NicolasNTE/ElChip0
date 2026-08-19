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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const roles_guard_1 = require("../auth/guards/roles.guard");
let ReportsController = class ReportsController {
    reportsService;
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async getEmployeeAttendance(employeeId, startDate, endDate) {
        if (!startDate || !endDate) {
            throw new common_1.BadRequestException('startDate y endDate son requeridos');
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new common_1.BadRequestException('Fechas inválidas');
        }
        return this.reportsService.getEmployeeAttendanceReport(employeeId, start, end);
    }
    async getPayrollReport(startDate, endDate, companyId) {
        if (!startDate || !endDate) {
            throw new common_1.BadRequestException('startDate y endDate son requeridos');
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new common_1.BadRequestException('Fechas inválidas');
        }
        return this.reportsService.getPayrollReport(start, end, companyId);
    }
    async downloadPayrollCSV(startDate, endDate, companyId, res) {
        if (!startDate || !endDate) {
            throw new common_1.BadRequestException('startDate y endDate son requeridos');
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new common_1.BadRequestException('Fechas inválidas');
        }
        const csv = await this.reportsService.exportPayrollToCSV(start, end, companyId);
        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename=payroll_report.csv');
        res.send(csv);
    }
    async getPendingJustifications() {
        return this.reportsService.getPendingJustificationsReport();
    }
    async getCompanyReport(companyId, startDate, endDate) {
        if (!startDate || !endDate) {
            throw new common_1.BadRequestException('startDate y endDate son requeridos');
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new common_1.BadRequestException('Fechas inválidas');
        }
        return this.reportsService.getCompanyReport(companyId, start, end);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('attendance/:employeeId'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getEmployeeAttendance", null);
__decorate([
    (0, common_1.Get)('payroll'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getPayrollReport", null);
__decorate([
    (0, common_1.Get)('payroll/csv'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('companyId')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "downloadPayrollCSV", null);
__decorate([
    (0, common_1.Get)('justifications/pending'),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getPendingJustifications", null);
__decorate([
    (0, common_1.Get)('company/:companyId'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getCompanyReport", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map