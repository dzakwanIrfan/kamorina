import { PartialType } from '@nestjs/mapped-types';
import { CreateGolonganDto } from './create-golongan.dto';

export class UpdateGolonganDto extends PartialType(CreateGolonganDto) {}