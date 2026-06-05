import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersModule } from './orders/orders.module';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { PrintTypesModule } from './print-types/print-types.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/graficaslp'),
    OrdersModule,
    FilesModule,
    AuthModule,
    AdminModule,
    PrintTypesModule,
  ],
})
export class AppModule {}
