import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersModule } from './orders/orders.module';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { PrintTypesModule } from './print-types/print-types.module';
import { CompaniesModule } from './control/companies/companies.module';
import { CategoriesModule } from './control/categories/categories.module';
import { ProvidersModule } from './control/providers/providers.module';
import { BankAccountsModule } from './control/bank-accounts/bank-accounts.module';
import { ConceptsModule } from './control/concepts/concepts.module';
import { PaymentsModule } from './control/payments/payments.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/graficaslp'),
    // Print shop modules
    OrdersModule,
    FilesModule,
    AuthModule,
    AdminModule,
    PrintTypesModule,
    // Control de Gastos modules
    CompaniesModule,
    CategoriesModule,
    ProvidersModule,
    BankAccountsModule,
    ConceptsModule,
    PaymentsModule,
  ],
})
export class AppModule {}
