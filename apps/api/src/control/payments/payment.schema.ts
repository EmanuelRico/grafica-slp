import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum Recurrence {
  NONE = 'none',
  MONTHLY = 'monthly',
  BIMONTHLY = 'bimonthly',
  QUARTERLY = 'quarterly',
  SEMIANNUAL = 'semiannual',
  ANNUAL = 'annual',
}

export enum DisplayStatus {
  OVERDUE = 'vencido',
  DUE_TODAY = 'vence_hoy',
  DUE_THIS_WEEK = 'vence_semana',
  UPCOMING = 'proximo',
  PAID = 'pagado',
  CANCELLED = 'cancelado',
}

@Schema({ _id: false })
export class Receipt {
  @Prop({ required: true }) storageKey: string;
  @Prop({ required: true }) originalName: string;
  @Prop({ required: true }) mimeType: string;
  @Prop() fileSizeBytes: number;
  @Prop({ default: () => new Date() }) uploadedAt: Date;
}

export const ReceiptSchema = SchemaFactory.createForClass(Receipt);

@Schema({ _id: false })
export class PaymentHistoryEntry {
  @Prop({ required: true }) action: string; // created, edited, paid, cancelled
  @Prop() field?: string;
  @Prop() oldValue?: string;
  @Prop() newValue?: string;
  @Prop({ required: true }) changedBy: string;
  @Prop({ default: () => new Date() }) changedAt: Date;
}

export const PaymentHistoryEntrySchema = SchemaFactory.createForClass(PaymentHistoryEntry);

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true }) company: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Concept', required: true }) concept: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Category', required: true }) category: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Provider' }) provider: Types.ObjectId;

  // Period (structured, not just text)
  @Prop({ required: true, min: 1, max: 12 }) periodMonth: number;
  @Prop({ required: true }) periodYear: number;

  // Amount
  @Prop({ required: true, min: 0 }) amount: number;
  @Prop({ default: 'MXN' }) currency: string;

  // Dates
  @Prop({ required: true }) dueDate: Date;
  @Prop() paidAt: Date;

  // Payment details (populated when paid)
  @Prop({ type: Types.ObjectId, ref: 'BankAccount' }) bankAccount: Types.ObjectId;
  @Prop() paymentNotes: string;

  // Receipts (comprobantes)
  @Prop({ type: [ReceiptSchema], default: [] }) receipts: Receipt[];

  // Status (only stored values: pending, paid, cancelled)
  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING }) status: PaymentStatus;

  // Recurrence
  @Prop({ enum: Recurrence, default: Recurrence.NONE }) recurrence: Recurrence;

  @Prop({ default: true }) fixedAmount: boolean;

  // Audit history
  @Prop({ type: [PaymentHistoryEntrySchema], default: [] }) history: PaymentHistoryEntry[];

  @Prop({ default: true }) isActive: boolean;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Virtual for display status (computed from dueDate vs today)
PaymentSchema.virtual('displayStatus').get(function (this: PaymentDocument) {
  if (this.status === PaymentStatus.PAID) return DisplayStatus.PAID;
  if (this.status === PaymentStatus.CANCELLED) return DisplayStatus.CANCELLED;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(this.dueDate);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return DisplayStatus.OVERDUE;
  if (diffDays === 0) return DisplayStatus.DUE_TODAY;
  if (diffDays <= 7) return DisplayStatus.DUE_THIS_WEEK;
  return DisplayStatus.UPCOMING;
});

// Helper: compute period label
PaymentSchema.virtual('periodLabel').get(function (this: PaymentDocument) {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${months[this.periodMonth - 1]} ${this.periodYear}`;
});

// Virtual: days remaining
PaymentSchema.virtual('daysRemaining').get(function (this: PaymentDocument) {
  if (this.status === PaymentStatus.PAID || this.status === PaymentStatus.CANCELLED) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(this.dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
});

// Ensure virtuals are included in JSON/object output
PaymentSchema.set('toJSON', { virtuals: true });
PaymentSchema.set('toObject', { virtuals: true });
