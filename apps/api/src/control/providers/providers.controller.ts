import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../auth/user.schema';
import { ProvidersService } from './providers.service';
import { IsString, IsOptional, IsArray } from 'class-validator';

class CreateProviderDto {
  @IsString() name: string;
  @IsOptional() @IsArray() companies?: string[];
}

class UpdateProviderDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsArray() companies?: string[];
}

@Controller('control/providers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.CONTROL_ADMIN, UserRole.CONTROL_OPERATOR, UserRole.CONTROL_READ)
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  async findAll(@Query('includeInactive') includeInactive?: string, @Query('companyId') companyId?: string) {
    return this.providersService.findAll(includeInactive === 'true', companyId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.providersService.findById(id);
  }

  @Post()
  @Roles(UserRole.CONTROL_ADMIN, UserRole.CONTROL_OPERATOR)
  async create(@Body() dto: CreateProviderDto) {
    return this.providersService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.CONTROL_ADMIN, UserRole.CONTROL_OPERATOR)
  async update(@Param('id') id: string, @Body() dto: UpdateProviderDto) {
    return this.providersService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.CONTROL_ADMIN)
  async deactivate(@Param('id') id: string) {
    return this.providersService.deactivate(id);
  }

  @Patch(':id/activate')
  @Roles(UserRole.CONTROL_ADMIN)
  async activate(@Param('id') id: string) {
    return this.providersService.activate(id);
  }
}
