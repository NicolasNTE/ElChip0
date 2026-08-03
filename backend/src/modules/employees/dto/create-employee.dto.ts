import { IsString, IsEmail, IsOptional, MinLength, IsUUID } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsString()
  employeeId: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  scheduledStartTime: string;

  @IsString()
  scheduledEndTime: string;

  @IsUUID()
  companyId: string;
}
