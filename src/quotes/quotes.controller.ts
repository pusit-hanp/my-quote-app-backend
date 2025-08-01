import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard) // Apply the guard to ALL routes in this controller
@Controller('quotes') // Base path for all routes in this controller
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  create(@Body() createQuoteDto: CreateQuoteDto) {
    return this.quotesService.create(createQuoteDto);
  }

  @Get()
  findAll(@Query('q') q?: string, @Request() req?) {
    // req.user contains the payload from your JWT (userId, email)
    const userId = req.user ? req.user.userId : undefined; // Get userId from req.user
    return this.quotesService.findAll(q, userId); // <-- Pass userId to service
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotesService.findOne(id);
  }

  @Patch(':id') // Use Patch for partial updates
  update(@Param('id') id: string, @Body() updateQuoteDto: UpdateQuoteDto) {
    return this.quotesService.update(id, updateQuoteDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content on successful delete
  remove(@Param('id') id: string) {
    return this.quotesService.remove(id);
  }

  @Post(':id/vote')
  async vote(@Param('id') id: string, @Request() req) {
    // The user ID is available in req.user.userId from JwtStrategy
    return this.quotesService.vote(id, req.user.userId);
  }
}
