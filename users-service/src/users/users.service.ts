import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Rol, User, UserDocument } from './schemas/user.schema.js';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(data: { nombre: string; email: string; password: string }) {
    const email = data.email.toLowerCase();
    const existe = await this.userModel.findOne({ email });
    if (existe) {
      throw new ConflictException('El email ya está registrado');
    }
    const password = await bcrypt.hash(data.password, 10);
    try {
      return await this.userModel.create({ ...data, email, password });
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException('El email ya está registrado');
      }
      throw error;
    }
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  findMedicos() {
    return this.userModel
      .find({ rol: Rol.MEDICO })
      .select('nombre email')
      .sort({ nombre: 1 })
      .lean();
  }
}