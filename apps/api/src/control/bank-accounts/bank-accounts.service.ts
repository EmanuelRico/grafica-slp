import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BankAccount, BankAccountDocument } from './bank-account.schema';

@Injectable()
export class BankAccountsService {
  constructor(@InjectModel(BankAccount.name) private bankAccountModel: Model<BankAccountDocument>) {}

  async findAll(includeInactive = false, companyId?: string) {
    const query: any = includeInactive ? {} : { isActive: true };
    if (companyId) query.company = companyId;
    return this.bankAccountModel.find(query).populate('company', 'name shortName').sort({ bankName: 1 });
  }

  async findById(id: string) {
    const account = await this.bankAccountModel.findById(id).populate('company', 'name shortName');
    if (!account) throw new NotFoundException('Cuenta bancaria no encontrada');
    return account;
  }

  async create(data: { name: string; bankName: string; lastFourDigits?: string; company: string }) {
    return this.bankAccountModel.create(data);
  }

  async update(id: string, data: { name?: string; bankName?: string; lastFourDigits?: string; company?: string }) {
    const account = await this.bankAccountModel.findByIdAndUpdate(id, data, { new: true }).populate('company', 'name shortName');
    if (!account) throw new NotFoundException('Cuenta bancaria no encontrada');
    return account;
  }

  async deactivate(id: string) {
    const account = await this.bankAccountModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!account) throw new NotFoundException('Cuenta bancaria no encontrada');
    return account;
  }

  async activate(id: string) {
    const account = await this.bankAccountModel.findByIdAndUpdate(id, { isActive: true }, { new: true });
    if (!account) throw new NotFoundException('Cuenta bancaria no encontrada');
    return account;
  }
}
