import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { Order, OrderSchema } from '../orders/order.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }])],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule implements OnModuleInit {
  constructor(private readonly filesService: FilesService) {}

  onModuleInit() {
    // Run cleanup on startup (after 1min) and every 12h
    setTimeout(() => this.filesService.cleanupOrphanedFiles().catch(() => {}), 60_000);
    setInterval(() => this.filesService.cleanupOrphanedFiles().catch(() => {}), 12 * 60 * 60_000);
  }
}
