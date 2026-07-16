import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Provider, ProviderDocument } from './provider.schema';

@Injectable()
export class ProvidersService {
  constructor(@InjectModel(Provider.name) private providerModel: Model<ProviderDocument>) {}

  async findAll(includeInactive = false, companyId?: string) {
    const query: any = includeInactive ? {} : { isActive: true };
    if (companyId) query.companies = companyId;
    return this.providerModel.find(query).populate('companies', 'name shortName').sort({ name: 1 });
  }

  async findById(id: string) {
    const provider = await this.providerModel.findById(id).populate('companies', 'name shortName');
    if (!provider) throw new NotFoundException('Proveedor no encontrado');
    return provider;
  }

  async create(data: { name: string; companies?: string[] }) {
    return this.providerModel.create(data);
  }

  async update(id: string, data: { name?: string; companies?: string[] }) {
    const provider = await this.providerModel.findByIdAndUpdate(id, data, { new: true }).populate('companies', 'name shortName');
    if (!provider) throw new NotFoundException('Proveedor no encontrado');
    return provider;
  }

  async deactivate(id: string) {
    const provider = await this.providerModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!provider) throw new NotFoundException('Proveedor no encontrado');
    return provider;
  }

  async activate(id: string) {
    const provider = await this.providerModel.findByIdAndUpdate(id, { isActive: true }, { new: true });
    if (!provider) throw new NotFoundException('Proveedor no encontrado');
    return provider;
  }
}
