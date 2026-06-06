import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  RECEIVED = 'received',
  IN_PRODUCTION = 'in_production',
  FINISHED = 'finished',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Schema({ _id: false })
class StatusHistoryEntry {
  @Prop() from: string;
  @Prop({ required: true }) to: string;
  @Prop() changedBy: string;
  @Prop() note: string;
  @Prop({ default: Date.now }) changedAt: Date;
  @Prop() whatsappSentAt?: Date;
}

@Schema({ _id: false })
class OrderFile {
  @Prop({ required: true }) storageKey: string;
  @Prop({ required: true }) originalName: string;
  @Prop() fileSizeBytes: number;
  @Prop() mimeType: string;
  @Prop({ default: Date.now }) uploadedAt: Date;
}

@Schema({ _id: false })
class PrintTypeSnapshot {
  @Prop({ required: true }) slug: string;
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) widthCm: number;
  @Prop({ required: true }) minLengthCm: number;
  @Prop({ required: true }) pricePerMeter: number;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true }) orderNumber: string;

  @Prop({ required: true }) customerName: string;
  @Prop({ required: true }) customerPhone: string;
  @Prop() customerEmail: string;

  @Prop({ default: false }) wantsInvoice: boolean;
  @Prop() invoiceName: string;
  @Prop() invoiceCFDI: string;
  @Prop() invoicedAt: Date;

  @Prop({ type: PrintTypeSnapshot, required: true }) printType: PrintTypeSnapshot;

  @Prop({ required: true }) lengthCm: number;
  @Prop({ required: true, min: 1 }) repetitions: number;
  @Prop() comments: string;
  @Prop({ required: true }) estimatedPrice: number;

  @Prop({ enum: OrderStatus, default: OrderStatus.RECEIVED }) status: OrderStatus;

  @Prop({ required: true }) acknowledgedFileReady: boolean;
  @Prop({ required: true }) acknowledgedNoEdits: boolean;
  @Prop({ required: true }) acknowledgedQuality: boolean;

  @Prop({ type: OrderFile }) file: OrderFile;
  @Prop({ type: [StatusHistoryEntry], default: [] }) statusHistory: StatusHistoryEntry[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes for tracking lookups and dashboard filtering
OrderSchema.index({ customerPhone: 1 });
OrderSchema.index({ status: 1, createdAt: -1 });
