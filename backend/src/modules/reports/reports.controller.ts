import { Controller, Get, Param, Query, UseGuards, BadRequestException, Res } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('attendance/:employeeId')
  @Roles('admin')
  async getEmployeeAttendance(
    @Param('employeeId') employeeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate y endDate son requeridos');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Fechas inválidas');
    }

    return this.reportsService.getEmployeeAttendanceReport(employeeId, start, end);
  }

  @Get('payroll')
  @Roles('admin')
  async getPayrollReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('companyId') companyId?: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate y endDate son requeridos');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Fechas inválidas');
    }

    return this.reportsService.getPayrollReport(start, end, companyId);
  }

  @Get('payroll/csv')
  @Roles('admin')
  async downloadPayrollCSV(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('companyId') companyId: string,
    @Res() res: any,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate y endDate son requeridos');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Fechas inválidas');
    }

    const csv = await this.reportsService.exportPayrollToCSV(start, end, companyId);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=payroll_report.csv');
    res.send(csv);
  }

  @Get('justifications/pending')
  @Roles('admin')
  async getPendingJustifications() {
    return this.reportsService.getPendingJustificationsReport();
  }

  @Get('company/:companyId')
  @Roles('admin')
  async getCompanyReport(
    @Param('companyId') companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate y endDate son requeridos');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Fechas inválidas');
    }

    return this.reportsService.getCompanyReport(companyId, start, end);
  }
}
