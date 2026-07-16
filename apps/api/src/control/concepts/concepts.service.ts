import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Concept, ConceptDocument } from './concept.schema';

@Injectable()
export class ConceptsService {
  constructor(@InjectModel(Concept.name) private conceptModel: Model<ConceptDocument>) {}

  async findAll(includeInactive = false) {
    const query = includeInactive ? {} : { isActive: true };
    return this.conceptModel.find(query).sort({ name: 1 });
  }

  async findById(id: string) {
    const concept = await this.conceptModel.findById(id);
    if (!concept) throw new NotFoundException('Concepto no encontrado');
    return concept;
  }

  async create(data: { name: string; description?: string }) {
    return this.conceptModel.create(data);
  }

  async update(id: string, data: { name?: string; description?: string }) {
    const concept = await this.conceptModel.findByIdAndUpdate(id, data, { new: true });
    if (!concept) throw new NotFoundException('Concepto no encontrado');
    return concept;
  }

  async deactivate(id: string) {
    const concept = await this.conceptModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!concept) throw new NotFoundException('Concepto no encontrado');
    return concept;
  }

  async activate(id: string) {
    const concept = await this.conceptModel.findByIdAndUpdate(id, { isActive: true }, { new: true });
    if (!concept) throw new NotFoundException('Concepto no encontrado');
    return concept;
  }
}
