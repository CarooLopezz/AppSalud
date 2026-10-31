import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { UsersController } from '../users/users.controller.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Appointment, AppointmentSchema } from '../appointments/appointment.schema.js';
import { AppointmentsController } from '../appointments/appointments.controller.js';
import { AppointmentsService } from '../appointments/appointments.service.js';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([{ name: Appointment.name, schema: AppointmentSchema }]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: 3600 },
      }),
    }),
  ],
  providers: [AuthService, JwtAuthGuard, AppointmentsService],
  controllers: [AuthController, UsersController, AppointmentsController],
})
export class AuthModule {}