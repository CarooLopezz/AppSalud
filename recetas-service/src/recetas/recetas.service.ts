
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

  async recetasPorVencer(): Promise<RecetaDocument[]> {
    const recetas = await this.recetaModel.find().exec();

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + 3);

    return recetas.filter((receta) => {
      const partesFecha = receta.fecha.split('-');

      if (partesFecha.length !== 3) {
        return false;
      }

      const fechaInicio = new Date(
        Number(partesFecha[0]),
        Number(partesFecha[1]) - 1,
        Number(partesFecha[2]),
      );

      const resultado = receta.duracion.match(/\d+/);

      if (!resultado) {
        return false;
      }

      const dias = Number(resultado[0]);

      const fechaVencimiento = new Date(fechaInicio);
      fechaVencimiento.setDate(fechaVencimiento.getDate() + dias);
      fechaVencimiento.setHours(0, 0, 0, 0);

      return fechaVencimiento >= hoy && fechaVencimiento <= limite;
    });
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
