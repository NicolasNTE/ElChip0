import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
export declare class CompaniesController {
    private companiesService;
    constructor(companiesService: CompaniesService);
    create(createCompanyDto: CreateCompanyDto): Promise<import("../../entities/company.entity").Company>;
    findAll(): Promise<import("../../entities/company.entity").Company[]>;
    findOne(id: string): Promise<import("../../entities/company.entity").Company>;
    update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<import("../../entities/company.entity").Company>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
