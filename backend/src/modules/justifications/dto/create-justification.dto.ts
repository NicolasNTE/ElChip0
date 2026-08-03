import { IsString, IsUUID, MinLength, IsDateString } from 'class-validator';

export class CreateJustificationDto {
  @IsUUID()
  employeeId: string;

  @IsDateString()
  justificationDate: string;

  @IsString()
  @MinLength(10)
  description: string;
}
