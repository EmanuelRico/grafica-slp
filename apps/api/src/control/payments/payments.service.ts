import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument, PaymentStatus, Recurrence, DisplayStatus } from './payment.schema';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class PaymentsService {
  private s3: S3Client;

  constructor(@InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>) {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });
  }

  private populateFields() {
    return [
      { path: 'company', select: 'name shortName color' },
      { path: 'concept', select: 'name' },
      { path: 'category', select: 'name color' },
      { path: 'provider', select: 'name' },
      { path: 'bankAccount', select: 'name bankName lastFourDigits' },
    ];
  }

  async findAll(filters: {
    status?: string;
    company?: string;
    category?: string;
    periodMonth?: number;
    periodYear?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, company, category, periodMonth, periodYear, search, page = 1, limit = 20 } = filters;
    const query: any = { isActive: true };

    if (status) {
      if (status === 'pending_all') {
        query.status = PaymentStatus.PENDING;
      } else if (status === 'overdue') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query.status = PaymentStatus.PENDING;
        query.dueDate = { $lt: today };
      } else {
        query.status = status;
      }
    }
    if (company) query.company = company;
    if (category) query.category = category;
    if (periodMonth) query.periodMonth = periodMonth;
    if (periodYear) query.periodYear = periodYear;
    if (search) {
      // Search will be done after populate via concept name
      // For now, we'll use a broader approach
    }

    const [data, total] = await Promise.all([
      this.paymentModel
        .find(query)
        .populate(this.populateFields())
        .sort({ dueDate: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.paymentModel.countDocuments(query),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    const payment = await this.paymentModel.findById(id).populate(this.populateFields());
    if (!payment) throw new NotFoundException('Pago no encontrado');
    return payment;
  }

  async create(data: {
    company: string;
    concept: string;
    category: string;
    provider?: string;
    periodMonth: number;
    periodYear: number;
    amount: number;
    dueDate: string;
    recurrence?: string;
    paymentNotes?: string;
  }, changedBy: string) {
    if (data.amount <= 0) throw new BadRequestException('El monto debe ser mayor a 0');

    // Check for duplicate: same concept + company + period
    const existing = await this.paymentModel.findOne({
      company: data.company,
      concept: data.concept,
      periodMonth: data.periodMonth,
      periodYear: data.periodYear,
      status: { $ne: PaymentStatus.CANCELLED },
      isActive: true,
    });
    if (existing) throw new BadRequestException('Ya existe un pago para este concepto, empresa y periodo');

    const payment = await this.paymentModel.create({
      ...data,
      history: [{ action: 'created', changedBy, changedAt: new Date() }],
    });

    return payment.populate(this.populateFields());
  }

  async update(id: string, data: Record<string, any>, changedBy: string) {
    const payment = await this.paymentModel.findById(id);
    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (payment.status === PaymentStatus.PAID) throw new BadRequestException('No se puede editar un pago ya pagado');

    // Track changes in history
    const trackFields = ['amount', 'dueDate', 'company', 'concept', 'category', 'provider', 'periodMonth', 'periodYear'];
    for (const field of trackFields) {
      if (data[field] !== undefined && String(data[field]) !== String(payment[field])) {
        payment.history.push({
          action: 'edited',
          field,
          oldValue: String(payment[field]),
          newValue: String(data[field]),
          changedBy,
          changedAt: new Date(),
        });
      }
    }

    Object.assign(payment, data);
    await payment.save();
    return payment.populate(this.populateFields());
  }

  async markAsPaid(id: string, data: {
    paidAt: string;
    bankAccount?: string;
    paymentNotes?: string;
  }, changedBy: string) {
    const payment = await this.paymentModel.findById(id);
    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (payment.status === PaymentStatus.PAID) throw new BadRequestException('Este pago ya fue marcado como pagado');
    if (payment.status === PaymentStatus.CANCELLED) throw new BadRequestException('No se puede pagar un pago cancelado');

    payment.status = PaymentStatus.PAID;
    payment.paidAt = new Date(data.paidAt);
    if (data.bankAccount) payment.bankAccount = data.bankAccount as any;
    if (data.paymentNotes) payment.paymentNotes = data.paymentNotes;
    payment.history.push({ action: 'paid', changedBy, changedAt: new Date() });

    await payment.save();

    // If recurring, generate next payment
    if (payment.recurrence !== Recurrence.NONE) {
      await this.generateNextRecurring(payment, changedBy);
    }

    return payment.populate(this.populateFields());
  }

  async cancel(id: string, changedBy: string) {
    const payment = await this.paymentModel.findById(id);
    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (payment.status === PaymentStatus.PAID) throw new BadRequestException('No se puede cancelar un pago ya pagado');

    payment.status = PaymentStatus.CANCELLED;
    payment.history.push({ action: 'cancelled', changedBy, changedAt: new Date() });
    await payment.save();
    return payment.populate(this.populateFields());
  }

  private async generateNextRecurring(payment: PaymentDocument, changedBy: string) {
    const monthsToAdd: Record<string, number> = {
      [Recurrence.MONTHLY]: 1,
      [Recurrence.BIMONTHLY]: 2,
      [Recurrence.QUARTERLY]: 3,
      [Recurrence.SEMIANNUAL]: 6,
      [Recurrence.ANNUAL]: 12,
    };

    const months = monthsToAdd[payment.recurrence] || 0;
    if (months === 0) return;

    let nextMonth = payment.periodMonth + months;
    let nextYear = payment.periodYear;
    while (nextMonth > 12) {
      nextMonth -= 12;
      nextYear++;
    }

    // Check if next already exists
    const existing = await this.paymentModel.findOne({
      company: payment.company,
      concept: payment.concept,
      periodMonth: nextMonth,
      periodYear: nextYear,
      status: { $ne: PaymentStatus.CANCELLED },
      isActive: true,
    });
    if (existing) return; // Already generated

    // Calculate next due date (same day of month, shifted)
    const nextDueDate = new Date(payment.dueDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + months);

    await this.paymentModel.create({
      company: payment.company,
      concept: payment.concept,
      category: payment.category,
      provider: payment.provider,
      periodMonth: nextMonth,
      periodYear: nextYear,
      amount: payment.amount,
      dueDate: nextDueDate,
      recurrence: payment.recurrence,
      history: [{ action: 'created', changedBy, changedAt: new Date() }],
    });
  }

  // Dashboard aggregation
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [overdue, dueToday, dueThisWeek, totalPendingMonth] = await Promise.all([
      // Overdue: past due, still pending
      this.paymentModel.aggregate([
        { $match: { status: PaymentStatus.PENDING, isActive: true, dueDate: { $lt: today } } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } },
      ]),
      // Due today
      this.paymentModel.aggregate([
        { $match: { status: PaymentStatus.PENDING, isActive: true, dueDate: { $gte: today, $lt: new Date(today.getTime() + 86400000) } } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } },
      ]),
      // Due this week (next 7 days, excluding today)
      this.paymentModel.aggregate([
        { $match: { status: PaymentStatus.PENDING, isActive: true, dueDate: { $gt: new Date(today.getTime() + 86400000), $lte: endOfWeek } } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } },
      ]),
      // Total pending this month
      this.paymentModel.aggregate([
        { $match: { status: PaymentStatus.PENDING, isActive: true, dueDate: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } },
      ]),
    ]);

    return {
      overdue: { count: overdue[0]?.count || 0, total: overdue[0]?.total || 0 },
      dueToday: { count: dueToday[0]?.count || 0, total: dueToday[0]?.total || 0 },
      dueThisWeek: { count: dueThisWeek[0]?.count || 0, total: dueThisWeek[0]?.total || 0 },
      totalPendingMonth: { count: totalPendingMonth[0]?.count || 0, total: totalPendingMonth[0]?.total || 0 },
    };
  }

  async getCompanyStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await this.paymentModel.aggregate([
      { $match: { status: PaymentStatus.PENDING, isActive: true } },
      {
        $group: {
          _id: '$company',
          pendingCount: { $sum: 1 },
          pendingTotal: { $sum: '$amount' },
          overdueCount: {
            $sum: { $cond: [{ $lt: ['$dueDate', today] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: '_id',
          as: 'companyInfo',
        },
      },
      { $unwind: '$companyInfo' },
      {
        $project: {
          _id: 1,
          name: '$companyInfo.name',
          shortName: '$companyInfo.shortName',
          color: '$companyInfo.color',
          pendingCount: 1,
          pendingTotal: 1,
          overdueCount: 1,
        },
      },
      { $sort: { overdueCount: -1, pendingTotal: -1 } },
    ]);

    return stats;
  }

  async getAttentionPayments(tab: 'overdue' | 'today' | 'week' | 'upcoming' | 'paid' = 'overdue', limit = 10) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400000);
    const endOfWeek = new Date(today.getTime() + 7 * 86400000);

    // Paid tab — show recently paid
    if (tab === 'paid') {
      return this.paymentModel
        .find({ status: PaymentStatus.PAID, isActive: true })
        .populate(this.populateFields())
        .sort({ paidAt: -1 })
        .limit(limit);
    }

    let dateFilter: any;
    switch (tab) {
      case 'overdue':
        dateFilter = { $lt: today };
        break;
      case 'today':
        dateFilter = { $gte: today, $lt: tomorrow };
        break;
      case 'week':
        dateFilter = { $gte: tomorrow, $lte: endOfWeek };
        break;
      case 'upcoming':
        dateFilter = { $gt: endOfWeek };
        break;
    }

    return this.paymentModel
      .find({ status: PaymentStatus.PENDING, isActive: true, dueDate: dateFilter })
      .populate(this.populateFields())
      .sort({ dueDate: 1 })
      .limit(limit);
  }

  // Receipts bulk delete (same R2 cleanup pattern as print orders)
  async bulkDeleteReceipts(olderThanDays = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    const payments = await this.paymentModel.find({
      'receipts.0': { $exists: true },
      status: PaymentStatus.PAID,
      paidAt: { $lt: cutoff },
    });

    let filesDeleted = 0;
    const errors: string[] = [];

    for (const payment of payments) {
      for (const receipt of payment.receipts) {
        try {
          await this.s3.send(new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME || 'graficaslp-files',
            Key: receipt.storageKey,
          }));
          filesDeleted++;
        } catch (e: any) {
          errors.push(`${receipt.storageKey}: ${e.message}`);
        }
      }
      payment.receipts = [];
      await payment.save();
    }

    return { paymentsAffected: payments.length, filesDeleted, errors };
  }

  // Storage stats for receipts
  async getStorageStats() {
    const result = await this.paymentModel.aggregate([
      { $unwind: '$receipts' },
      {
        $group: {
          _id: null,
          totalBytes: { $sum: '$receipts.fileSizeBytes' },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalBytes = result[0]?.totalBytes || 0;
    const limitBytes = 10 * 1024 * 1024 * 1024;
    return {
      totalBytes,
      totalGB: +(totalBytes / 1024 / 1024 / 1024).toFixed(3),
      limitGB: 10,
      usedPercent: +((totalBytes / limitBytes) * 100).toFixed(2),
      fileCount: result[0]?.count || 0,
    };
  }

  // Calendar: get payments for a given month
  async getCalendarMonth(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    return this.paymentModel
      .find({ dueDate: { $gte: start, $lte: end }, isActive: true, status: { $ne: PaymentStatus.CANCELLED } })
      .populate([
        { path: 'company', select: 'name shortName color' },
        { path: 'concept', select: 'name' },
        { path: 'category', select: 'name color' },
      ])
      .sort({ dueDate: 1 });
  }
}
