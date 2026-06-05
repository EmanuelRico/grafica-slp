import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, TrackOrderDto } from './orders.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    const order = await this.ordersService.create(dto);
    return {
      orderNumber: order.orderNumber,
      estimatedPrice: order.estimatedPrice,
      status: order.status,
    };
  }

  @Get('track')
  async track(@Query() query: TrackOrderDto) {
    return this.ordersService.track(query.q);
  }
}
