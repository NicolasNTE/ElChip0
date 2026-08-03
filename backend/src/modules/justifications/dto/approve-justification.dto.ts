import { IsString } from 'class-validator';

export class ApproveJustificationDto {
  @IsString()
  reviewedBy: string;
}
