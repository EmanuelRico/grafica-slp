import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  CONTROL_ADMIN = 'control_admin',
  CONTROL_OPERATOR = 'control_operator',
  CONTROL_READ = 'control_read',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true }) name: string;
  @Prop({ required: true, unique: true }) email: string;
  @Prop({ required: true }) passwordHash: string;
  @Prop({ enum: UserRole, default: UserRole.OPERATOR }) role: UserRole;
  @Prop({ default: true }) isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
