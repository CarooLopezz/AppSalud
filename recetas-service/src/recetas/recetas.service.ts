import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Receta,
  RecetaDocument,
} from './schemas/receta.schema.js';
import { CreateRecetaInput } from './dto/create-receta.input.js';
import { UpdateRecetaInput } from './dto/update-receta.input.js';

@Injectable()
export class RecetasService {
  constructor(
    @InjectModel(Receta.name)
    private readonly recetaModel: Model<RecetaDocument>,
  ) {}

  async crear(input: CreateRecetaInput): Promise<RecetaDocument> {
    const tiposPermitidos = [
      'application/pdf',
      'image/jpeg',
      'image/png',
    ];

    if (input.tipoArchivo && !tiposPermitidos.includes(input.tipoArchivo)) {
      throw new Error('Tipo de archivo no permitido');
    }

    if (input.tipoArchivo && !input.archivo) {
      throw new Error('Debe enviar el archivo');
    }

    const receta = new this.recetaModel(input);
    return receta.save();
  }

  async listar(): Promise<RecetaDocument[]> {
    return this.recetaModel.find().exec();
  }

  async buscarPorId(id: string): Promise<RecetaDocument> {
    const receta = await this.recetaModel.findById(id).exec();

    if (!receta) {
      throw new NotFoundException('Receta no encontrada');
    }

    return receta;
  }

  async actualizar(
    input: UpdateRecetaInput,
  ): Promise<RecetaDocument> {
    const { id, ...datos } = input;

    const receta = await this.recetaModel
      .findByIdAndUpdate(id, datos, { new: true })
      .exec();

    if (!receta) {
      throw new NotFoundException('Receta no encontrada');
    }

    return receta;
  }

  async eliminar(id: string): Promise<boolean> {
    const resultado = await this.recetaModel
      .findByIdAndDelete(id)
      .exec();

    if (!resultado) {
      throw new NotFoundException('Receta no encontrada');
    }

    return true;
  }
}