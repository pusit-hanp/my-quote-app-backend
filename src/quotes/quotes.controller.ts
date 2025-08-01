import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Query,
  ParseIntPipe,
  ParseEnumPipe,
} from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuoteResponseDto } from './dto/quote-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Define enums for clarity and validation for sort parameters
enum SortByOptions {
  Votes = 'votes',
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
}

enum OrderOptions {
  ASC = 'ASC',
  DESC = 'DESC',
}

@UseGuards(JwtAuthGuard)
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  create(@Body() createQuoteDto: CreateQuoteDto) {
    return this.quotesService.create(createQuoteDto);
  }

  @Get()
  findAll(
    @Query('q') q?: string,
    @Request() req?,
    @Query('minVotes', new ParseIntPipe({ optional: true })) minVotes?: number,
    @Query('maxVotes', new ParseIntPipe({ optional: true })) maxVotes?: number,
    @Query('sortBy', new ParseEnumPipe(SortByOptions, { optional: true }))
    sortBy?: SortByOptions,
    @Query('order', new ParseEnumPipe(OrderOptions, { optional: true }))
    order?: OrderOptions,
  ): Promise<QuoteResponseDto[]> {
    // Return type is QuoteResponseDto[]
    const userId = req.user ? req.user.userId : undefined;
    return this.quotesService.findAll(
      q,
      userId,
      minVotes,
      maxVotes,
      sortBy,
      order,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQuoteDto: UpdateQuoteDto) {
    return this.quotesService.update(id, updateQuoteDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.quotesService.remove(id);
  }

  @Post(':id/vote')
  vote(@Param('id') id: string, @Request() req) {
    return this.quotesService.vote(id, req.user.userId);
  }
}
