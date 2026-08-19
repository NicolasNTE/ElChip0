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
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const employee_entity_1 = require("../../entities/employee.entity");
const companies_service_1 = require("../companies/companies.service");
let EmployeesService = class EmployeesService {
    employeeRepository;
    companiesService;
    constructor(employeeRepository, companiesService) {
        this.employeeRepository = employeeRepository;
        this.companiesService = companiesService;
    }
    async create(createEmployeeDto) {
        await this.companiesService.findOne(createEmployeeDto.companyId);
        const existingEmployee = await this.employeeRepository.findOne({
            where: { employeeId: createEmployeeDto.employeeId },
        });
        if (existingEmployee) {
            throw new common_1.BadRequestException('El ID de empleado ya existe');
        }
        const employee = this.employeeRepository.create(createEmployeeDto);
        return this.employeeRepository.save(employee);
    }
    async findAll() {
        return this.employeeRepository.find({
            relations: { company: true },
            order: { createdAt: 'DESC' },
        });
    }
    async findByCompany(companyId) {
        await this.companiesService.findOne(companyId);
        return this.employeeRepository.find({
            where: { companyId },
            relations: { company: true },
        });
    }
    async findOne(id) {
        const employee = await this.employeeRepository.findOne({
            where: { id },
            relations: { company: true, attendanceRecords: true },
        });
        if (!employee) {
            throw new common_1.NotFoundException(`Empleado con ID ${id} no encontrado`);
        }
        return employee;
    }
    async update(id, updateEmployeeDto) {
        const employee = await this.findOne(id);
        if (updateEmployeeDto.employeeId && updateEmployeeDto.employeeId !== employee.employeeId) {
            const existing = await this.employeeRepository.findOne({
                where: { employeeId: updateEmployeeDto.employeeId },
            });
            if (existing) {
                throw new common_1.BadRequestException('El ID de empleado ya existe');
            }
        }
        if (updateEmployeeDto.companyId) {
            await this.companiesService.findOne(updateEmployeeDto.companyId);
        }
        await this.employeeRepository.update(id, updateEmployeeDto);
        return this.findOne(id);
    }
    async remove(id) {
        const employee = await this.findOne(id);
        await this.employeeRepository.remove(employee);
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        companies_service_1.CompaniesService])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map