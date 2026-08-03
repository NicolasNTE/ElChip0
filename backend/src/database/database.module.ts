import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../entities/company.entity';
import { Employee } from '../entities/employee.entity';
import { AttendanceRecord } from '../entities/attendance-record.entity';
import { Justification } from '../entities/justification.entity';
import { JustificationPhoto } from '../entities/justification-photo.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'asistencias_db',
      entities: [Company, Employee, AttendanceRecord, Justification, JustificationPhoto, User],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: false,
      migrations: ['dist/database/migrations/*.js'],
      migrationsRun: true,
    }),
    TypeOrmModule.forFeature([Company, Employee, AttendanceRecord, Justification, JustificationPhoto, User]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
