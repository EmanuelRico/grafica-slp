import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProviderDocument = Provider & Document;

@Schema({ timestamps: true })
export class Provider {
  @Prop({ required: true }) name: string;
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Company' }], default: [] }) companies: Types.ObjectId[];
  @Prop({ default: true }) isActive: boolean;
}

export const ProviderSchema = SchemaFactory.createForClass(Provider);
