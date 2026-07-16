import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Provider, ProviderSchema } from './provider.schema';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Provider.name, schema: ProviderSchema }])],
  controllers: [ProvidersController],
  providers: [ProvidersService],
  exports: [ProvidersService, MongooseModule],
})
export class ProvidersModule {}
