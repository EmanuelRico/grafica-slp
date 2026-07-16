import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './payment.schema';
import { Company, CompanySchema } from '../companies/company.schema';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Payment.name, schema: PaymentSchema },
    { name: Company.name, schema: CompanySchema },
  ])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
