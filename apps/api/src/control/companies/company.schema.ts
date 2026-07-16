import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true })
export class Company {
  @Prop({ required: true }) name: string;
  @Prop() shortName: string;
  @Prop() rfc: string;
  @Prop({ default: '#01AEF0' }) color: string;
  @Prop({ default: true }) isActive: boolean;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
