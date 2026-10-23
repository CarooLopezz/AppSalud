import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Medicamento,
  MedicamentoDocument,
} from './schemas/medicamento.schema.js';
import { CreateMedicamentoInput } from './dto/create-medicamento.input.js';
import { UpdateMedicamentoInput } from './dto/update-medicamento.input.js';

@Injectable()
export class MedicamentosService {
  constructor(
    @InjectModel(Medicamento.name)
    private readonly medicamentoModel: Model<MedicamentoDocument>,
  ) {}

  async crear(input: CreateMedicamentoInput): Promise<MedicamentoDocument> {
    const medicamento = new this.medicamentoModel(input);
    return medicamento.save();
  }

  async listar(): Promise<MedicamentoDocument[]> {
    return this.medicamentoModel.find().exec();
  }

  async buscarPorId(id: string): Promise<MedicamentoDocument> {
    const medicamento = await this.medicamentoModel.findById(id).exec();

    if (!medicamento) {
      throw new NotFoundException('Medicamento no encontrado');
    }

    return medicamento;
  }

  async actualizar(
    input: UpdateMedicamentoInput,
  ): Promise<MedicamentoDocument> {
    const { id, ...datos } = input;

    const medicamento = await this.medicamentoModel
      .findByIdAndUpdate(id, datos, { new: true })
      .exec();

    if (!medicamento) {
      throw new NotFoundException('Medicamento no encontrado');
    }

    return medicamento;
  }

  async eliminar(id: string): Promise<boolean> {
    const resultado = await this.medicamentoModel
      .findByIdAndDelete(id)
      .exec();

    if (!resultado) {
      throw new NotFoundException('Medicamento no encontrado');
    }

    return true;
  }
}
