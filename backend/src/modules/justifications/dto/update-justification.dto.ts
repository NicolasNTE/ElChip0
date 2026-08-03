import { PartialType } from '@nestjs/mapped-types';
import { CreateJustificationDto } from './create-justification.dto';

export class UpdateJustificationDto extends PartialType(CreateJustificationDto) {}
