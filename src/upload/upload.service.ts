import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FileUpload } from './schemas/file-upload.schema';
import { Response } from 'express';
import { join, isAbsolute } from 'path';
import { existsSync, unlinkSync } from 'fs';

@Injectable()
export class UploadService {
  constructor(
    @InjectModel(FileUpload.name)
    private fileUploadModel: Model<FileUpload>,
  ) {}

  async saveFileInfo(
    file: Express.Multer.File,
    extra?: {
      uploadedBy?: string;
      relatedEntity?: string;
      relatedEntityType?: string;
    },
  ) {
    const fileUpload = new this.fileUploadModel({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      uploadDate: new Date(),
      uploadedBy: extra?.uploadedBy,
      relatedEntity: extra?.relatedEntity,
      relatedEntityType: extra?.relatedEntityType,
    });
    const saved = await fileUpload.save();
    return {
      id: saved._id,
      originalName: saved.originalName,
      filename: saved.filename,
      mimetype: saved.mimetype,
      size: saved.size,
      uploadDate: saved.uploadDate,
      downloadUrl: `/upload/file/${saved.filename}`,
      uploadedBy: (saved as any).uploadedBy,
      relatedEntity: (saved as any).relatedEntity,
      relatedEntityType: (saved as any).relatedEntityType,
    };
  }

  async downloadFile(filename: string, res: Response) {
    const file = await this.fileUploadModel.findOne({ filename });
    if (!file) throw new NotFoundException('Archivo no encontrado');
    const storedPath = (file as any).path as string;
    const primaryPath =
      storedPath && isAbsolute(storedPath)
        ? storedPath
        : storedPath
          ? join(process.cwd(), storedPath)
          : join(process.cwd(), 'uploads', (file as any).filename as string);
    const altPath = join(
      process.cwd(),
      'uploads',
      (file as any).filename as string,
    );
    const resolved = existsSync(primaryPath) ? primaryPath : altPath;
    if (!existsSync(resolved))
      throw new NotFoundException('Archivo físico no encontrado');
    return res.download(resolved, (file as any).originalName as string);
  }

  async deleteFile(id: string) {
    const file = await this.fileUploadModel.findById(id);
    if (!file) throw new NotFoundException('Archivo no encontrado');
    const storedPath = (file as any).path as string;
    const primaryPath =
      storedPath && isAbsolute(storedPath)
        ? storedPath
        : storedPath
          ? join(process.cwd(), storedPath)
          : join(process.cwd(), 'uploads', (file as any).filename as string);
    try {
      if (existsSync(primaryPath)) unlinkSync(primaryPath);
    } catch {}
    await this.fileUploadModel.deleteOne({ _id: file._id });
    return { deleted: true };
  }

  async getFilesByEntity(relatedEntityType: string, relatedEntity: string) {
    const files = await this.fileUploadModel
      .find({ relatedEntityType, relatedEntity })
      .sort({ uploadDate: -1 })
      .lean();
    return files.map((file: any) => {
      const storedPath = file.path as string;
      const primaryPath =
        storedPath && isAbsolute(storedPath)
          ? storedPath
          : storedPath
            ? join(process.cwd(), storedPath)
            : join(process.cwd(), 'uploads', file.filename as string);
      const altPath = join(process.cwd(), 'uploads', file.filename as string);
      const exists = existsSync(primaryPath) || existsSync(altPath);
      return {
        id: file._id,
        originalName: file.originalName,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        uploadDate: file.uploadDate,
        downloadUrl: `/upload/file/${file.filename}`,
        relatedEntity: file.relatedEntity,
        relatedEntityType: file.relatedEntityType,
        exists,
      };
    });
  }

  async getAllFiles() {
    const files = await this.fileUploadModel
      .find()
      .sort({ uploadDate: -1 })
      .lean();
    return files.map((file: any) => ({
      id: file._id,
      originalName: file.originalName,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      uploadDate: file.uploadDate,
      downloadUrl: `/upload/file/${file.filename}`,
      uploadedBy: file.uploadedBy,
      relatedEntity: file.relatedEntity,
      relatedEntityType: file.relatedEntityType,
    }));
  }

  async validateFileType(mimetype: string, allowedTypes: string[]) {
    return allowedTypes.includes(mimetype);
  }

  async validateFileSize(size: number, maxSize: number) {
    return size <= maxSize;
  }
}
