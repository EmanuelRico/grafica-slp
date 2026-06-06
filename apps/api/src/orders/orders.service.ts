import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Order, OrderDocument, OrderStatus } from './order.schema';
import { PrintType, PrintTypeDocument } from '../print-types/print-type.schema';
import { CreateOrderDto } from './orders.dto';

@Injectable()
export class OrdersService {
  private s3: S3Client;

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(PrintType.name) private printTypeModel: Model<PrintTypeDocument>,
  ) {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: 'https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async generateOrderNumber(): Promise<string> {
    const last = await this.orderModel.findOne({}, { orderNumber: 1 }).sort({ orderNumber: -1 });
    const next = last ? parseInt(last.orderNumber.replace('GSLP-', ''), 10) + 1 : 1;
    return `GSLP-${String(next).padStart(6, '0')}`;
  }

  async create(dto: CreateOrderDto): Promise<OrderDocument> {
    const printType = await this.printTypeModel.findOne({ slug: dto.printTypeSlug, isActive: true });
    if (!printType) throw new BadRequestException('Invalid print type');

    if (dto.lengthCm < printType.minLengthCm) {
      throw new BadRequestException(
        `Minimum length for ${printType.name} is ${printType.minLengthCm} cm`,
      );
    }

    if (!dto.acknowledgedFileReady || !dto.acknowledgedNoEdits || !dto.acknowledgedQuality) {
      throw new BadRequestException('All acknowledgements are required');
    }

    const estimatedPrice = ((dto.lengthCm / 100) * dto.repetitions * printType.pricePerMeter);
    const orderNumber = await this.generateOrderNumber();

    const order = new this.orderModel({
      orderNumber,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerEmail: dto.customerEmail,
      wantsInvoice: dto.wantsInvoice || false,
      invoiceName: dto.invoiceName,
      invoiceCFDI: dto.invoiceCFDI,
      printType: {
        slug: printType.slug,
        name: printType.name,
        widthCm: printType.widthCm,
        minLengthCm: printType.minLengthCm,
        pricePerMeter: printType.pricePerMeter,
      },
      lengthCm: dto.lengthCm,
      repetitions: dto.repetitions,
      comments: dto.comments,
      estimatedPrice,
      status: OrderStatus.RECEIVED,
      acknowledgedFileReady: dto.acknowledgedFileReady,
      acknowledgedNoEdits: dto.acknowledgedNoEdits,
      acknowledgedQuality: dto.acknowledgedQuality,
      file: {
        storageKey: dto.fileKey,
        originalName: dto.originalName,
        fileSizeBytes: dto.fileSizeBytes,
        mimeType: dto.mimeType,
      },
      statusHistory: [{ from: null, to: OrderStatus.RECEIVED, changedAt: new Date() }],
    });

    try {
      return await order.save();
    } catch (err) {
      //Cleanup orphaned file from R2
      this.s3.send(new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || 'graficaslp-files',
        Key: dto.fileKey,
      })).catch(() => {});
      throw err;
    }
  }

  async track(q: string): Promise<any> {
    const isOrderNumber = q.toUpperCase().startsWith('GSLP-');

    let orders: OrderDocument[];
    if (isOrderNumber) {
      const order = await this.orderModel.findOne({ orderNumber: q.toUpperCase() });
      orders = order ? [order] : [];
    } else {
      orders = await this.orderModel
        .find({ customerPhone: q })
        .sort({ createdAt: -1 })
        .limit(10);
    }

    if (!orders.length) throw new NotFoundException('No orders found');

    return orders.map((o) => ({
      orderNumber: o.orderNumber,
      status: o.status,
      printType: o.printType.name,
      lengthCm: o.lengthCm,
      repetitions: o.repetitions,
      estimatedPrice: o.estimatedPrice,
      createdAt: (o as any).createdAt,
      statusHistory: o.statusHistory.map((h) => ({ status: h.to, changedAt: h.changedAt })),
    }));
  }
}
