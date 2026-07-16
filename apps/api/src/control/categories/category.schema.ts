import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true }) name: string;
  @Prop({ default: '#01AEF0' }) color: string;
  @Prop({ default: true }) isActive: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
