import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConceptDocument = Concept & Document;

@Schema({ timestamps: true })
export class Concept {
  @Prop({ required: true }) name: string;
  @Prop() description: string;
  @Prop({ default: true }) isActive: boolean;
}

export const ConceptSchema = SchemaFactory.createForClass(Concept);
