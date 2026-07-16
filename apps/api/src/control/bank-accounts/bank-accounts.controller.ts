import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../auth/user.schema';
import { BankAccountsService } from './bank-accounts.service';
import { IsString, IsOptional } from 'class-validator';

class CreateBankAccountDto {
  @IsString() name: string;
  @IsString() bankName: string;
  @IsOptional() @IsString() lastFourDigits?: string;
  @IsString() company: string;
}

class UpdateBankAccountDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() bankName?: string;
  @IsOptional() @IsString() lastFourDigits?: string;
  @IsOptional() @IsString() company?: string;
}

@Controller('control/bank-accounts')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.CONTROL_ADMIN, UserRole.CONTROL_OPERATOR, UserRole.CONTROL_READ)
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Get()
  async findAll(@Query('includeInactive') includeInactive?: string, @Query('companyId') companyId?: string) {
    return this.bankAccountsService.findAll(includeInactive === 'true', companyId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.bankAccountsService.findById(id);
  }

  @Post()
  @Roles(UserRole.CONTROL_ADMIN, UserRole.CONTROL_OPERATOR)
  async create(@Body() dto: CreateBankAccountDto) {
    return this.bankAccountsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.CONTROL_ADMIN, UserRole.CONTROL_OPERATOR)
  async update(@Param('id') id: string, @Body() dto: UpdateBankAccountDto) {
    return this.bankAccountsService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.CONTROL_ADMIN)
  async deactivate(@Param('id') id: string) {
    return this.bankAccountsService.deactivate(id);
  }

  @Patch(':id/activate')
  @Roles(UserRole.CONTROL_ADMIN)
  async activate(@Param('id') id: string) {
    return this.bankAccountsService.activate(id);
  }
}
