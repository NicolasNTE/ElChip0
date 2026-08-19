"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelImportService = void 0;
const common_1 = require("@nestjs/common");
const XLSX = __importStar(require("xlsx"));
const fs = __importStar(require("fs"));
let ExcelImportService = class ExcelImportService {
    parseExcelFile(filePath) {
        try {
            const fileBuffer = fs.readFileSync(filePath);
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);
            return data;
        }
        catch (error) {
            throw new common_1.BadRequestException(`Error al leer archivo Excel: ${error.message}`);
        }
    }
    validateAttendanceData(data) {
        return data.map((row, index) => {
            if (!row.employeeId || !row.timestamp || !row.type) {
                throw new common_1.BadRequestException(`Fila ${index + 1}: Faltan campos requeridos (employeeId, timestamp, type)`);
            }
            if (!['entrada', 'salida'].includes(String(row.type).toLowerCase())) {
                throw new common_1.BadRequestException(`Fila ${index + 1}: El tipo debe ser 'entrada' o 'salida'`);
            }
            const timestamp = new Date(row.timestamp);
            if (isNaN(timestamp.getTime())) {
                throw new common_1.BadRequestException(`Fila ${index + 1}: Timestamp inválido: ${row.timestamp}`);
            }
            return {
                employeeId: String(row.employeeId).trim(),
                timestamp,
                type: String(row.type).toLowerCase(),
            };
        });
    }
};
exports.ExcelImportService = ExcelImportService;
exports.ExcelImportService = ExcelImportService = __decorate([
    (0, common_1.Injectable)()
], ExcelImportService);
//# sourceMappingURL=excel.import.service.js.map