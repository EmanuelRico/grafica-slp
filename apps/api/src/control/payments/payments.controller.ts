import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../auth/user.schema';
import { PaymentsService } from './payments.service';
import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { Recurrence } from './payment.schema';

class CreatePaymentDto {
  @IsString() company: string;
  @IsString() concept: string;
  @IsString() category: string;
  @IsOptional() @IsString() provider?: string;
  @Type(() => Number) @IsNumber() @Min(1) @Max(12) periodMonth: number;
  @Type(() => Number) @IsNumber() periodYear: number;
  @Type(() => Number) @IsNumber() @Min(0) amount: number;
  @IsString() dueDate: string;
  @IsOptional() @IsEnum(Recurrence) recurrence?: string;
  @IsOptional() @IsString() paymentNotes?: string;
  @IsOptional() @IsBoolean() fixedAmount?: boolean;
}

class UpdatePaymentDto {
  @IsOptional() @IsString() company?: string;
  @IsOptional() @IsString() concept?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() provider?: string;
  @IsOptional() @Type(() => Number) @IsNumber() periodMonth?: number;
  @IsOptional() @Type(() => Number) @IsNumber() periodYear?: number;
  @IsOptional() @Type(() => Number) @IsNumber() amount?: number;
  @IsOptional() @IsString() dueDate?: string;
  @IsOptional() @IsEnum(Recurrence) recurrence?: string;
  @IsOptional() @IsString() paymentNotes?: string;
  @IsOptional() @IsBoolean() fixedAmount?: boolean;
}

class MarkPaidDto {
  @IsString() paidAt: string;
  @IsOptional() @IsString() bankAccount?: string;
  @IsOptional() @IsString() paymentNotes?: string;
}

@Controller('control/payments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.CONTROL_ADMIN, UserRole.CONTROL_OPERATOR, UserRole.CONTROL_READ)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Dashboard endpoints
  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.paymentsService.getDashboardStats();
  }

  @Get('dashboard/companies')
  async getCompanyStats() {
    return this.paymentsService.getCompanyStats();
  }

  @Get('dashboard/attention')
  async getAttentionPayments(@Query('tab') tab?: string, @Query('limit') limit?: string, @Query('company') company?: string) {
    const validTabs = ['overdue', 'today', 'week', 'upcoming', 'paid'] as const;
    const selectedTab = validTabs.includes(tab as any) ? (tab as any) : 'overdue';
    return this.paymentsService.getAttentionPayments(selectedTab, limit ? +limit : 10, company);
  }

  // Calendar
  @Get('calendar/:year/:month')
  async getCalendarMonth(@Param('year') year: string, @Param('month') month: string) {
    return this.paymentsService.getCalendarMonth(+year, +month);
  }

  // Storage / receipts management
  @Get('storage/stats')
  @Roles(UserRole.CONTROL_ADMIN)
  async getStorageStats() {
    return this.paymentsService.getStorageStats();
  }

  @Delete('receipts/bulk')
  @Roles(UserRole.CONTROL_ADMIN)
  async bulkDeleteReceipts(@Query('olderThanDays') olderThanDays?: string) {
    return this.paymentsService.bulkDeleteReceipts(olderThanDays ? +olderThanDays : 90);
  }

  // CRUD
  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('company') company?: string,
    @Query('category') category?: string,
    @Query('periodMonth') periodMonth?: string,
    @Query('periodYear') periodYear?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.findAll({
      status,
      company,
      category,
      periodMonth: periodMonth ? +periodMonth : undefined,
      periodYear: periodYear ? +periodYear : undefined,
      search,
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
    });
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }

  @Post()
  @Roles(UserRole.CONTROL_ADMIN, UserRole.CONTROL_OPERATOR)
  async create(@Body() dto: CreatePaymentDto, @Req() req: any) {
    return this.paymentsService.create(dto, req.user.userId);
  }

  @Patch(':id')
  @Roles(UserRole.CONTROL_ADMIN, UserRole.CONTROL_OPERATOR)
  async update(@Param('id') id: string, @Body() dto: UpdatePaymentDto, @Req() req: any) {
    return this.paymentsService.update(id, dto, req.user.userId);
  }

  @Patch(':id/pay')
  @Roles(UserRole.CONTROL_ADMIN, UserRole.CONTROL_OPERATOR)
  async markAsPaid(@Param('id') id: string, @Body() dto: MarkPaidDto, @Req() req: any) {
    return this.paymentsService.markAsPaid(id, dto, req.user.userId);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.CONTROL_ADMIN)
  async cancel(@Param('id') id: string, @Req() req: any) {
    return this.paymentsService.cancel(id, req.user.userId);
  }

  @Delete(':id')
  @Roles(UserRole.CONTROL_ADMIN)
  async delete(@Param('id') id: string) {
    return this.paymentsService.delete(id);
  }
}
