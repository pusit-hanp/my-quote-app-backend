import { PartialType } from '@nestjs/mapped-types'; // For partial updates
import { CreateQuoteDto } from './create-quote.dto';

export class UpdateQuoteDto extends PartialType(CreateQuoteDto) {}
