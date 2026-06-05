import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrintTypesController } from './print-types.controller';
import { PrintType, PrintTypeSchema } from './print-type.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: PrintType.name, schema: PrintTypeSchema }])],
  controllers: [PrintTypesController],
})
export class PrintTypesModule {}
