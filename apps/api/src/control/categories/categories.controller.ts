import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../auth/user.schema';
import { CategoriesService } from './categories.service';
import { IsString, IsOptional } from 'class-validator';

class CreateCategoryDto {
  @IsString() name: string;
  @IsOptional() @IsString() color?: string;
}

class UpdateCategoryDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() color?: string;
}

@Controller('control/categories')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.CONTROL_ADMIN, UserRole.CONTROL_OPERATOR, UserRole.CONTROL_READ)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(@Query('includeInactive') includeInactive?: string) {
    return this.categoriesService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Post()
  @Roles(UserRole.CONTROL_ADMIN, UserRole.CONTROL_OPERATOR)
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.CONTROL_ADMIN, UserRole.CONTROL_OPERATOR)
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.CONTROL_ADMIN)
  async deactivate(@Param('id') id: string) {
    return this.categoriesService.deactivate(id);
  }

  @Patch(':id/activate')
  @Roles(UserRole.CONTROL_ADMIN)
  async activate(@Param('id') id: string) {
    return this.categoriesService.activate(id);
  }
}
