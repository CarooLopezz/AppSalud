
import { PartialType } from '@nestjs/swagger';
import { CreateEstudioDto } from './create-estudio.dto.js';

export class UpdateEstudioDto extends PartialType(CreateEstudioDto) {}
