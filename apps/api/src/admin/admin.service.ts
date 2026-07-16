import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from '../orders/order.schema';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class AdminService {
  private s3: S3Client;

  constructor(@InjectModel(Order.name) private orderModel: Model<OrderDocument>) {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async listOrders(filters: { status?: string; printType?: string; search?: string; page?: number; limit?: number }) {
    const { status, printType, search, page = 1, limit = 20 } = filters;
    const query: any = {};

    if (status) query.status = status.includes(',') ? { $in: status.split(',') } : status;
    if (printType) query['printType.slug'] = printType;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.orderModel.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      this.orderModel.countDocuments(query),
    ]);

    return { data, total, page, limit };
  }

  async getOrder(id: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, status: OrderStatus, changedBy: string, note?: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    const previousStatus = order.status;
    order.status = status;
    order.statusHistory.push({ from: previousStatus, to: status, changedBy, note, changedAt: new Date() });
    return order.save();
  }

  async markWhatsappSent(id: string): Promise<OrderDocument> {
    const doc = await this.orderModel.findById(id);
    if (!doc) throw new NotFoundException('Order not found');
    const idx = [...doc.statusHistory].reverse().findIndex(h => h.to === doc.status);
    if (idx === -1) throw new NotFoundException('No status history entry found');
    const realIdx = doc.statusHistory.length - 1 - idx;
    doc.statusHistory[realIdx].whatsappSentAt = new Date();
    return doc.save();
  }

  async markInvoiced(id: string): Promise<OrderDocument> {
    const doc = await this.orderModel.findByIdAndUpdate(id, { invoicedAt: new Date() }, { new: true });
    if (!doc) throw new NotFoundException('Order not found');
    return doc;
  }

  async getWhatsAppMessage(id: string): Promise<string> {
    const order = await this.getOrder(id);
    const statusLabels: Record<string, string> = {
      received: 'Recibido',
      in_production: 'En Producción',
      finished: 'Terminado',
      delivered: 'Entregado',
    };

    if (order.status === 'finished') {
      return `🎉 ¡Tu pedido está listo!\n\nHola ${order.customerName}, te informamos que tu pedido ya fue terminado.\n\n📋 *Detalles del pedido:*\n🧾 Folio: *${order.orderNumber}*\n🖨️ Tipo: ${order.printType?.name || 'N/A'}\n📐 Medidas: ${order.lengthCm}cm × ${order.repetitions} rep.\n💰 Precio estimado: *$${order.estimatedPrice?.toFixed(2)} MXN*\n\nPuedes pasar a recogerlo cuando gustes dentro de nuestro horario de atención.\n\nGracias por crear con nosotros 💙\n\nGRAFICA SLP`;
    }

    return `Hola ${order.customerName}, tu pedido ${order.orderNumber} está ahora en estado: *${statusLabels[order.status]}*.\n\nGracias,\nGRAFICA SLP`;
  }

  async getStorageStats() {
    const result = await this.orderModel.aggregate([
      { $match: { 'file.fileSizeBytes': { $exists: true, $gt: 0 } } },
      {
        $group: {
          _id: '$status',
          totalBytes: { $sum: '$file.fileSizeBytes' },
          count: { $sum: 1 },
        },
      },
    ]);

    const byStatus: Record<string, { bytes: number; count: number }> = {};
    let totalBytes = 0;
    for (const row of result) {
      byStatus[row._id] = { bytes: row.totalBytes, count: row.count };
      totalBytes += row.totalBytes;
    }

    const limitBytes = 10 * 1024 * 1024 * 1024; // 10 GB
    return {
      totalBytes,
      totalGB: +(totalBytes / 1024 / 1024 / 1024).toFixed(3),
      limitGB: 10,
      usedPercent: +((totalBytes / limitBytes) * 100).toFixed(2),
      byStatus,
    };
  }

  async bulkDeleteByStatus(status?: string): Promise<{ deleted: number; filesDeleted: number; errors: string[] }> {
    const statusMap: Record<string, OrderStatus[]> = {
      delivered: [OrderStatus.DELIVERED],
      cancelled: [OrderStatus.CANCELLED],
    };
    const statuses = statusMap[status] || [OrderStatus.DELIVERED, OrderStatus.CANCELLED];
    const orders = await this.orderModel.find({ status: { $in: statuses } });
    let filesDeleted = 0;
    const errors: string[] = [];

    await Promise.all(
      orders.map(async (order) => {
        if (order.file?.storageKey) {
          try {
            await this.s3.send(new DeleteObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME || 'graficaslp-files',
              Key: order.file.storageKey,
            }));
            filesDeleted++;
          } catch (e: any) {
            errors.push(`R2 delete failed for ${order.orderNumber}: ${e.message}`);
          }
        }
      }),
    );

    const deleted = orders.length;
    await this.orderModel.deleteMany({ status: { $in: statuses } });

    return { deleted, filesDeleted, errors };
  }
}
