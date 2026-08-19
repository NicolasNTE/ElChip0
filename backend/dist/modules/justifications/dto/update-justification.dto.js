"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateJustificationDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_justification_dto_1 = require("./create-justification.dto");
class UpdateJustificationDto extends (0, mapped_types_1.PartialType)(create_justification_dto_1.CreateJustificationDto) {
}
exports.UpdateJustificationDto = UpdateJustificationDto;
//# sourceMappingURL=update-justification.dto.js.map