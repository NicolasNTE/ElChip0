import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

@Injectable()
export class ExcelImportService {
  parseExcelFile(filePath: string): Array<any> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      return data;
    } catch (error) {
      throw new BadRequestException(`Error al leer archivo Excel: ${error.message}`);
    }
  }

  validateAttendanceData(data: Array<any>): Array<any> {
    return data.map((row, index) => {
      if (!row.employeeId || !row.timestamp || !row.type) {
        throw new BadRequestException(
          `Fila ${index + 1}: Faltan campos requeridos (employeeId, timestamp, type)`,
        );
      }

      if (!['entrada', 'salida'].includes(String(row.type).toLowerCase())) {
        throw new BadRequestException(
          `Fila ${index + 1}: El tipo debe ser 'entrada' o 'salida'`,
        );
      }

      const timestamp = new Date(row.timestamp);
      if (isNaN(timestamp.getTime())) {
        throw new BadRequestException(
          `Fila ${index + 1}: Timestamp inválido: ${row.timestamp}`,
        );
      }

      return {
        employeeId: String(row.employeeId).trim(),
        timestamp,
        type: String(row.type).toLowerCase(),
      };
    });
  }
}
