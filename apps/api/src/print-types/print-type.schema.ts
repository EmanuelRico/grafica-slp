import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PrintTypeDocument = PrintType & Document;

@Schema({ timestamps: true })
export class PrintType {
  @Prop({ required: true, unique: true }) slug: string;
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) widthCm: number;
  @Prop({ required: true }) minLengthCm: number;
  @Prop({ required: true }) pricePerMeter: number;
  @Prop({ default: 'MXN' }) currency: string;
  @Prop({ default: true }) isActive: boolean;
}

export const PrintTypeSchema = SchemaFactory.createForClass(PrintType);
