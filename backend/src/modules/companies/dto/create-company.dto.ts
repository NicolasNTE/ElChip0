import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @IsOptional()
  ruc?: string;

  @IsString()
  @IsOptional()
  address?: string;
}
