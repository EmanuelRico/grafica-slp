import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './category.schema';

@Injectable()
export class CategoriesService {
  constructor(@InjectModel(Category.name) private categoryModel: Model<CategoryDocument>) {}

  async findAll(includeInactive = false) {
    const query = includeInactive ? {} : { isActive: true };
    return this.categoryModel.find(query).sort({ name: 1 });
  }

  async findById(id: string) {
    const category = await this.categoryModel.findById(id);
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  async create(data: { name: string; color?: string }) {
    return this.categoryModel.create(data);
  }

  async update(id: string, data: { name?: string; color?: string }) {
    const category = await this.categoryModel.findByIdAndUpdate(id, data, { new: true });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  async deactivate(id: string) {
    const category = await this.categoryModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  async activate(id: string) {
    const category = await this.categoryModel.findByIdAndUpdate(id, { isActive: true }, { new: true });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }
}
