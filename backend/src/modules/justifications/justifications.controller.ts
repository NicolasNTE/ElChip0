import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UploadedFiles, UseInterceptors, Query, BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JustificationsService } from './justifications.service';
import { CreateJustificationDto } from './dto/create-justification.dto';
import { UpdateJustificationDto } from './dto/update-justification.dto';
import { ApproveJustificationDto } from './dto/approve-justification.dto';
import { RejectJustificationDto } from './dto/reject-justification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { diskStorage } from 'multer';
import * as path from 'path';

const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/justifications');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Solo se aceptan imágenes JPEG/PNG o PDF'), false);
  }
};

@Controller('justifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JustificationsController {
  constructor(private justificationsService: JustificationsService) {}

  @Post()
  @Roles('admin')
  @UseInterceptors(FilesInterceptor('photos', 5, { storage, fileFilter }))
  async create(@Body() createJustificationDto: CreateJustificationDto, @UploadedFiles() photos?: Express.Multer.File[]) {
    return this.justificationsService.create(createJustificationDto, photos);
  }

  @Get()
  @Roles('admin')
  async findAll(@Query('status') status?: string) {
    if (status) {
      const validStatus = ['pendiente', 'aprobada', 'rechazada'];
      if (!validStatus.includes(status)) {
        throw new BadRequestException('Estado inválido');
      }
      return this.justificationsService.findByStatus(status as any);
    }
    return this.justificationsService.findAll();
  }

  @Get('statistics')
  @Roles('admin')
  async getStatistics() {
    return this.justificationsService.getStatistics();
  }

  @Get('employee/:employeeId')
  @Roles('admin')
  async getByEmployee(@Param('employeeId') employeeId: string) {
    return this.justificationsService.findByEmployee(employeeId);
  }

  @Get(':id')
  @Roles('admin')
  async findOne(@Param('id') id: string) {
    return this.justificationsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @UseInterceptors(FilesInterceptor('photos', 5, { storage, fileFilter }))
  async update(
    @Param('id') id: string,
    @Body() updateJustificationDto: UpdateJustificationDto,
    @UploadedFiles() photos?: Express.Multer.File[],
  ) {
    return this.justificationsService.update(id, updateJustificationDto, photos);
  }

  @Post(':id/approve')
  @Roles('admin')
  async approve(@Param('id') id: string, @Body() approveDto: ApproveJustificationDto) {
    return this.justificationsService.approve(id, approveDto.reviewedBy);
  }

  @Post(':id/reject')
  @Roles('admin')
  async reject(@Param('id') id: string, @Body() rejectDto: RejectJustificationDto) {
    return this.justificationsService.reject(id, rejectDto.rejectionReason, rejectDto.reviewedBy);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string) {
    await this.justificationsService.remove(id);
    return { message: 'Justificación eliminada exitosamente' };
  }

  @Post(':id/photos')
  @Roles('admin')
  @UseInterceptors(FilesInterceptor('photos', 5, { storage, fileFilter }))
  async addPhotos(@Param('id') id: string, @UploadedFiles() photos: Express.Multer.File[]) {
    if (!photos || photos.length === 0) {
      throw new BadRequestException('No se proporcionaron fotos');
    }

    let justification = await this.justificationsService.findOne(id);
    for (const photo of photos) {
      justification = await this.justificationsService.addPhoto(id, photo);
    }

    return justification;
  }

  @Delete(':justificationId/photos/:photoId')
  @Roles('admin')
  async removePhoto(@Param('photoId') photoId: string) {
    await this.justificationsService.removePhoto(photoId);
    return { message: 'Foto eliminada exitosamente' };
  }
}
