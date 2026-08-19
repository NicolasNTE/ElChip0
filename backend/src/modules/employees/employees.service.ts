import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../../entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CompaniesService } from '../companies/companies.service';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee) private employeeRepository: Repository<Employee>,
    private companiesService: CompaniesService,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    await this.companiesService.findOne(createEmployeeDto.companyId);

    const existingEmployee = await this.employeeRepository.findOne({
      where: { employeeId: createEmployeeDto.employeeId },
    });

    if (existingEmployee) {
      throw new BadRequestException('El ID de empleado ya existe');
    }

    const employee = this.employeeRepository.create(createEmployeeDto);
    return this.employeeRepository.save(employee);
  }

  async findAll(): Promise<Employee[]> {
    return this.employeeRepository.find({
      relations: { company: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByCompany(companyId: string): Promise<Employee[]> {
    await this.companiesService.findOne(companyId);
    return this.employeeRepository.find({
      where: { companyId },
      relations: { company: true },
    });
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id },
      relations: { company: true, attendanceRecords: true },
    });
    if (!employee) {
      throw new NotFoundException(`Empleado con ID ${id} no encontrado`);
    }
    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee> {
    const employee = await this.findOne(id);

    if (updateEmployeeDto.employeeId && updateEmployeeDto.employeeId !== employee.employeeId) {
      const existing = await this.employeeRepository.findOne({
        where: { employeeId: updateEmployeeDto.employeeId },
      });
      if (existing) {
        throw new BadRequestException('El ID de empleado ya existe');
      }
    }

    if (updateEmployeeDto.companyId) {
      await this.companiesService.findOne(updateEmployeeDto.companyId);
    }

    await this.employeeRepository.update(id, updateEmployeeDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const employee = await this.findOne(id);
    await this.employeeRepository.remove(employee);
  }
}
