import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateQuoteDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  author?: string;
}
