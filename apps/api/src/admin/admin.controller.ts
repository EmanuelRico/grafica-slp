import { Controller, Get, Patch, Delete, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { OrderStatus } from '../orders/order.schema';
import { IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

class UpdateStatusDto {
  @IsEnum(OrderStatus) status: OrderStatus;
  @IsOptional() @IsString() note?: string;
}

class UpdateOrderDetailsDto {
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) lengthCm?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) repetitions?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) estimatedPrice?: number;
}

@Controller('admin')
@UseGuards(AuthGuard('jwt'))
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('orders')
  async list(
    @Query('status') status?: string,
    @Query('printType') printType?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listOrders({
      status, printType, search,
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
    });
  }

  @Get('orders/:id')
  async getOrder(@Param('id') id: string) {
    return this.adminService.getOrder(id);
  }

  @Patch('orders/:id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto, @Req() req: any) {
    return this.adminService.updateStatus(id, dto.status, req.user.userId, dto.note);
  }

  @Get('orders/:id/whatsapp-message')
  async getWhatsAppMessage(@Param('id') id: string) {
    return { message: await this.adminService.getWhatsAppMessage(id) };
  }

  @Patch('orders/:id/whatsapp-sent')
  async markWhatsappSent(@Param('id') id: string) {
    return this.adminService.markWhatsappSent(id);
  }

  @Patch('orders/:id/invoiced')
  async markInvoiced(@Param('id') id: string) {
    return this.adminService.markInvoiced(id);
  }

  @Patch('orders/:id/details')
  async updateOrderDetails(@Param('id') id: string, @Body() dto: UpdateOrderDetailsDto, @Req() req: any) {
    return this.adminService.updateOrderDetails(id, dto, req.user.userId);
  }

  @Delete('orders/bulk/delivered')
  async bulkDeleteDelivered(@Query('status') status?: string) {
    return this.adminService.bulkDeleteByStatus(status);
  }

  @Get('storage/stats')
  async storageStats() {
    return this.adminService.getStorageStats();
  }
}
