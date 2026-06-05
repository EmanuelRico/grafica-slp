import { Controller, Get } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrintType, PrintTypeDocument } from './print-type.schema';

@Controller('print-types')
export class PrintTypesController {
  constructor(@InjectModel(PrintType.name) private printTypeModel: Model<PrintTypeDocument>) {}

  @Get()
  async findAll() {
    return this.printTypeModel.find({ isActive: true });
  }
}
