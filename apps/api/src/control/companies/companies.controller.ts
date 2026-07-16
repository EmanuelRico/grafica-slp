import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../auth/user.schema';
import { CompaniesService } from './companies.service';
import { IsString, IsOptional } from 'class-validator';

class CreateCompanyDto {
  @IsString() name: string;
  @IsOptional() @IsString() shortName?: string;
  @IsOptional() @IsString() rfc?: string;
  @IsOptional() @IsString() color?: string;
}

class UpdateCompanyDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() shortName?: string;
  @IsOptional() @IsString() rfc?: string;
  @IsOptional() @IsString() color?: string;
}

@Controller('control/companies')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.CONTROL_ADMIN, UserRole.CONTROL_OPERATOR, UserRole.CONTROL_READ)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  async findAll(@Query('includeInactive') includeInactive?: string) {
    return this.companiesService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.companiesService.findById(id);
  }

  @Post()
  @Roles(UserRole.CONTROL_ADMIN, UserRole.CONTROL_OPERATOR)
  async create(@Body() dto: CreateCompanyDto) {
    return this.companiesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.CONTROL_ADMIN, UserRole.CONTROL_OPERATOR)
  async update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.CONTROL_ADMIN)
  async deactivate(@Param('id') id: string) {
    return this.companiesService.deactivate(id);
  }

  @Patch(':id/activate')
  @Roles(UserRole.CONTROL_ADMIN)
  async activate(@Param('id') id: string) {
    return this.companiesService.activate(id);
  }
}
