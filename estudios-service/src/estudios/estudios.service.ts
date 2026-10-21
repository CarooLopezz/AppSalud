
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Estudio, EstudioDocument } from './estudio.schema.js';
import { CreateEstudioDto } from './dto/create-estudio.dto.js';
import { UpdateEstudioDto } from './dto/update-estudio.dto.js';

@Injectable()
export class EstudiosService {
  constructor(
    @InjectModel(Estudio.name)
    private readonly estudioModel: Model<EstudioDocument>,
  ) {}

  private validarId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de estudio inválido');
    }
  }

  async create(
    usuarioId: string,
    dto: CreateEstudioDto,
  ): Promise<EstudioDocument> {
    const estudio = new this.estudioModel({
      ...dto,
      fecha: new Date(dto.fecha),
      proximoControl: dto.proximoControl
        ? new Date(dto.proximoControl)
        : undefined,
      usuarioId: new Types.ObjectId(usuarioId),
    });

    return estudio.save();
  }

  async findAll(usuarioId: string): Promise<EstudioDocument[]> {
    return this.estudioModel
      .find({ usuarioId: new Types.ObjectId(usuarioId) })
      .sort({ fecha: -1 })
      .exec();
  }

  async findOne(
    usuarioId: string,
    id: string,
  ): Promise<EstudioDocument> {
    this.validarId(id);

    const estudio = await this.estudioModel
      .findOne({
        _id: id,
        usuarioId: new Types.ObjectId(usuarioId),
      })
      .exec();

    if (!estudio) {
      throw new NotFoundException('Estudio no encontrado');
    }

    return estudio;
  }

  async update(
    usuarioId: string,
    id: string,
    dto: UpdateEstudioDto,
  ): Promise<EstudioDocument> {
    this.validarId(id);
    await this.findOne(usuarioId, id);

    const cambios: Record<string, unknown> = { ...dto };

    if (dto.fecha) {
      cambios.fecha = new Date(dto.fecha);
    }

    if (dto.proximoControl) {
      cambios.proximoControl = new Date(dto.proximoControl);
    }

    const estudio = await this.estudioModel
      .findOneAndUpdate(
        {
          _id: id,
          usuarioId: new Types.ObjectId(usuarioId),
        },
        { $set: cambios },
        { new: true, runValidators: true },
      )
      .exec();

    if (!estudio) {
      throw new NotFoundException('Estudio no encontrado');
    }

    return estudio;
  }

  async remove(usuarioId: string, id: string): Promise<void> {
    this.validarId(id);

    const resultado = await this.estudioModel
      .deleteOne({
        _id: id,
        usuarioId: new Types.ObjectId(usuarioId),
      })
      .exec();

    if (resultado.deletedCount === 0) {
      throw new NotFoundException('Estudio no encontrado');
    }
  }
}
