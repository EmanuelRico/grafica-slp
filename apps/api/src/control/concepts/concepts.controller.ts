import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../auth/user.schema';
import { ConceptsService } from './concepts.service';
import { IsString, IsOptional } from 'class-validator';

class CreateConceptDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
}

class UpdateConceptDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
}

@Controller('control/concepts')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.CONTROL_ADMIN, UserRole.CONTROL_OPERATOR, UserRole.CONTROL_READ)
export class ConceptsController {
  constructor(private readonly conceptsService: ConceptsService) {}

  @Get()
  async findAll(@Query('includeInactive') includeInactive?: string) {
    return this.conceptsService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.conceptsService.findById(id);
  }

  @Post()
  @Roles(UserRole.CONTROL_ADMIN, UserRole.CONTROL_OPERATOR)
  async create(@Body() dto: CreateConceptDto) {
    return this.conceptsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.CONTROL_ADMIN, UserRole.CONTROL_OPERATOR)
  async update(@Param('id') id: string, @Body() dto: UpdateConceptDto) {
    return this.conceptsService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.CONTROL_ADMIN)
  async deactivate(@Param('id') id: string) {
    return this.conceptsService.deactivate(id);
  }

  @Patch(':id/activate')
  @Roles(UserRole.CONTROL_ADMIN)
  async activate(@Param('id') id: string) {
    return this.conceptsService.activate(id);
  }
}
