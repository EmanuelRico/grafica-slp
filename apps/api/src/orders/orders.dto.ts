import { IsString, IsNumber, IsBoolean, IsOptional, IsEmail, Min } from 'class-validator';

export class CreateOrderDto {
  @IsString() fileKey: string;
  @IsString() originalName: string;
  @IsNumber() fileSizeBytes: number;
  @IsString() mimeType: string;

  @IsString() customerName: string;
  @IsString() customerPhone: string;
  @IsOptional() @IsEmail() customerEmail?: string;

  @IsOptional() @IsBoolean() wantsInvoice?: boolean;
  @IsOptional() @IsString() invoiceName?: string;
  @IsOptional() @IsString() invoiceCFDI?: string;

  @IsString() printTypeSlug: string;
  @IsNumber() @Min(0) lengthCm: number;
  @IsNumber() @Min(1) repetitions: number;
  @IsOptional() @IsString() comments?: string;

  @IsBoolean() acknowledgedFileReady: boolean;
  @IsBoolean() acknowledgedNoEdits: boolean;
  @IsBoolean() acknowledgedQuality: boolean;
}

export class TrackOrderDto {
  @IsString() q: string;
}
