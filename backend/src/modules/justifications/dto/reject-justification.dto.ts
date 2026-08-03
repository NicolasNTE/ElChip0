import { IsString, MinLength } from 'class-validator';

export class RejectJustificationDto {
  @IsString()
  @MinLength(10)
  rejectionReason: string;

  @IsString()
  reviewedBy: string;
}
