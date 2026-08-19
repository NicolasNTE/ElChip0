import { Repository } from 'typeorm';
import { Employee } from '../../entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CompaniesService } from '../companies/companies.service';
export declare class EmployeesService {
    private employeeRepository;
    private companiesService;
    constructor(employeeRepository: Repository<Employee>, companiesService: CompaniesService);
    create(createEmployeeDto: CreateEmployeeDto): Promise<Employee>;
    findAll(): Promise<Employee[]>;
    findByCompany(companyId: string): Promise<Employee[]>;
    findOne(id: string): Promise<Employee>;
    update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee>;
    remove(id: string): Promise<void>;
}
