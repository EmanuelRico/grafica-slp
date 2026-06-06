import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import * as crypto from 'crypto';
import { Order, OrderDocument } from '../orders/order.schema';

@Injectable()
export class FilesService {
  private s3: S3Client;
  private bucket: string;

  constructor(@InjectModel(Order.name) private orderModel: Model<OrderDocument>) {
    this.bucket = process.env.R2_BUCKET_NAME || 'graficaslp-files';
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async getUploadUrl(filename: string, mimeType: string) {
    const ext = filename.split('.').pop();
    const key = `uploads/${crypto.randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 900 });
    return { uploadUrl, fileKey: key };
  }

  async getFileStream(key: string): Promise<{ stream: Readable; contentType: string }> {
    const res = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    if (!res.Body) throw new NotFoundException('File not found');
    return { stream: res.Body as Readable, contentType: res.ContentType || 'application/octet-stream' };
  }

  async cleanupOrphanedFiles(): Promise<{ deleted: number; errors: string[] }> {
    const maxAge = Date.now() - 24 * 60 * 60 * 1000; // 24h
    const linkedKeys = new Set(
      (await this.orderModel.find({}, { 'file.storageKey': 1 })).map(o => o.file?.storageKey).filter(Boolean),
    );

    let deleted = 0;
    const errors: string[] = [];
    let continuationToken: string | undefined;

    do {
      const list = await this.s3.send(new ListObjectsV2Command({
        Bucket: this.bucket, Prefix: 'uploads/', ContinuationToken: continuationToken,
      }));

      for (const obj of list.Contents || []) {
        if (!obj.Key || !obj.LastModified) continue;
        if (obj.LastModified.getTime() > maxAge) continue; // too recent
        if (linkedKeys.has(obj.Key)) continue; // linked to an order

        try {
          await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: obj.Key }));
          deleted++;
        } catch (e: any) {
          errors.push(`${obj.Key}: ${e.message}`);
        }
      }

      continuationToken = list.NextContinuationToken;
    } while (continuationToken);

    return { deleted, errors };
  }
}
