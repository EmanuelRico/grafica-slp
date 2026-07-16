import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from './company.schema';

@Injectable()
export class CompaniesService {
  constructor(@InjectModel(Company.name) private companyModel: Model<CompanyDocument>) {}

  async findAll(includeInactive = false) {
    const query = includeInactive ? {} : { isActive: true };
    return this.companyModel.find(query).sort({ name: 1 });
  }

  async findById(id: string) {
    const company = await this.companyModel.findById(id);
    if (!company) throw new NotFoundException('Empresa no encontrada');
    return company;
  }

  async create(data: { name: string; shortName?: string; rfc?: string }) {
    return this.companyModel.create(data);
  }

  async update(id: string, data: { name?: string; shortName?: string; rfc?: string }) {
    const company = await this.companyModel.findByIdAndUpdate(id, data, { new: true });
    if (!company) throw new NotFoundException('Empresa no encontrada');
    return company;
  }

  async deactivate(id: string) {
    const company = await this.companyModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!company) throw new NotFoundException('Empresa no encontrada');
    return company;
  }

  async activate(id: string) {
    const company = await this.companyModel.findByIdAndUpdate(id, { isActive: true }, { new: true });
    if (!company) throw new NotFoundException('Empresa no encontrada');
    return company;
  }
}
