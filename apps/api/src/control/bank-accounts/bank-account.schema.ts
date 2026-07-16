import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BankAccountDocument = BankAccount & Document;

@Schema({ timestamps: true })
export class BankAccount {
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) bankName: string;
  @Prop() lastFourDigits: string;
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true }) company: Types.ObjectId;
  @Prop({ default: true }) isActive: boolean;
}

export const BankAccountSchema = SchemaFactory.createForClass(BankAccount);
