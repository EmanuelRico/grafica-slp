import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Concept, ConceptSchema } from './concept.schema';
import { ConceptsService } from './concepts.service';
import { ConceptsController } from './concepts.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Concept.name, schema: ConceptSchema }])],
  controllers: [ConceptsController],
  providers: [ConceptsService],
  exports: [ConceptsService, MongooseModule],
})
export class ConceptsModule {}
