import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Justification } from '../../entities/justification.entity';
import { JustificationPhoto } from '../../entities/justification-photo.entity';
import { Employee } from '../../entities/employee.entity';
import { CreateJustificationDto } from './dto/create-justification.dto';
import { UpdateJustificationDto } from './dto/update-justification.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class JustificationsService {
  constructor(
    @InjectRepository(Justification) private justificationRepository: Repository<Justification>,
    @InjectRepository(JustificationPhoto) private photoRepository: Repository<JustificationPhoto>,
    @InjectRepository(Employee) private employeeRepository: Repository<Employee>,
  ) {}

  async create(createJustificationDto: CreateJustificationDto, photos?: Express.Multer.File[]): Promise<Justification> {
    const employee = await this.employeeRepository.findOne({
      where: { id: createJustificationDto.employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Empleado no encontrado');
    }

    const justification = this.justificationRepository.create({
      ...createJustificationDto,
      status: 'pendiente',
    });

    const savedJustification = await this.justificationRepository.save(justification);

    if (photos && photos.length > 0) {
      for (const photo of photos) {
        await this.photoRepository.save({
          justificationId: savedJustification.id,
          fileName: photo.originalname,
          filePath: photo.path,
          mimeType: photo.mimetype,
          fileSize: photo.size,
        });
      }
    }

    return this.findOne(savedJustification.id);
  }

  async findAll(): Promise<Justification[]> {
    return this.justificationRepository.find({
      relations: { photos: true, employee: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByEmployee(employeeId: string): Promise<Justification[]> {
    return this.justificationRepository.find({
      where: { employeeId },
      relations: { photos: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(status: 'pendiente' | 'aprobada' | 'rechazada'): Promise<Justification[]> {
    return this.justificationRepository.find({
      where: { status },
      relations: { employee: true, photos: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Justification> {
    const justification = await this.justificationRepository.findOne({
      where: { id },
      relations: { photos: true, employee: true },
    });

    if (!justification) {
      throw new NotFoundException(`Justificación con ID ${id} no encontrada`);
    }

    return justification;
  }

  async update(id: string, updateJustificationDto: UpdateJustificationDto, newPhotos?: Express.Multer.File[]): Promise<Justification> {
    const justification = await this.findOne(id);

    if (justification.status !== 'pendiente') {
      throw new BadRequestException('No se puede editar una justificación que ya fue revisada');
    }

    await this.justificationRepository.update(id, updateJustificationDto);

    if (newPhotos && newPhotos.length > 0) {
      for (const photo of newPhotos) {
        await this.photoRepository.save({
          justificationId: id,
          fileName: photo.originalname,
          filePath: photo.path,
          mimeType: photo.mimetype,
          fileSize: photo.size,
        });
      }
    }

    return this.findOne(id);
  }

  async approve(id: string, reviewedBy: string): Promise<Justification> {
    const justification = await this.findOne(id);

    await this.justificationRepository.update(id, {
      status: 'aprobada',
      reviewedBy,
      reviewedAt: new Date(),
    });

    return this.findOne(id);
  }

  async reject(id: string, rejectionReason: string, reviewedBy: string): Promise<Justification> {
    const justification = await this.findOne(id);

    await this.justificationRepository.update(id, {
      status: 'rechazada',
      rejectionReason,
      reviewedBy,
      reviewedAt: new Date(),
    });

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const justification = await this.findOne(id);

    const photos = await this.photoRepository.find({ where: { justificationId: id } });
    for (const photo of photos) {
      if (fs.existsSync(photo.filePath)) {
        fs.unlinkSync(photo.filePath);
      }
    }

    await this.photoRepository.delete({ justificationId: id });
    await this.justificationRepository.remove(justification);
  }

  async addPhoto(justificationId: string, photo: Express.Multer.File): Promise<Justification> {
    const justification = await this.findOne(justificationId);

    await this.photoRepository.save({
      justificationId,
      fileName: photo.originalname,
      filePath: photo.path,
      mimeType: photo.mimetype,
      fileSize: photo.size,
    });

    return this.findOne(justificationId);
  }

  async removePhoto(photoId: string): Promise<void> {
    const photo = await this.photoRepository.findOne({ where: { id: photoId } });

    if (!photo) {
      throw new NotFoundException('Foto no encontrada');
    }

    if (fs.existsSync(photo.filePath)) {
      fs.unlinkSync(photo.filePath);
    }

    await this.photoRepository.remove(photo);
  }

  async getStatistics(): Promise<any> {
    const total = await this.justificationRepository.count();
    const pending = await this.justificationRepository.countBy({ status: 'pendiente' });
    const approved = await this.justificationRepository.countBy({ status: 'aprobada' });
    const rejected = await this.justificationRepository.countBy({ status: 'rechazada' });

    return {
      total,
      pending,
      approved,
      rejected,
      approvalRate: total > 0 ? ((approved / total) * 100).toFixed(2) : 0,
    };
  }
}
