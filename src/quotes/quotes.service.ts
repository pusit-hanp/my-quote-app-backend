import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Quote } from './entities/quote.entity';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuoteResponseDto } from './dto/quote-response.dto';
import { UserVote } from '../votes/entities/user-vote.entity';

type SortOrder = 'ASC' | 'DESC';
type SortBy = 'votes' | 'createdAt' | 'updatedAt';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Quote)
    private quotesRepository: Repository<Quote>,
    @InjectRepository(UserVote)
    private userVotesRepository: Repository<UserVote>,
  ) {}

  async create(createQuoteDto: CreateQuoteDto): Promise<Quote> {
    const newQuote = this.quotesRepository.create(createQuoteDto);
    return this.quotesRepository.save(newQuote);
  }

  async findOne(id: string): Promise<Quote> {
    const quote = await this.quotesRepository.findOneBy({ id });
    if (!quote) {
      throw new NotFoundException(`Quote with ID "${id}" not found`);
    }
    return quote;
  }

  async update(id: string, updateQuoteDto: UpdateQuoteDto): Promise<Quote> {
    const quote = await this.findOne(id);
    if (quote.votes > 0) {
      throw new BadRequestException('Cannot update a quote that has votes.');
    }
    this.quotesRepository.merge(quote, updateQuoteDto);
    return this.quotesRepository.save(quote);
  }

  async remove(id: string): Promise<void> {
    const quote = await this.findOne(id);
    if (quote.votes > 0) {
      throw new BadRequestException('Cannot delete a quote that has votes.');
    }
    await this.quotesRepository.delete(id);
  }

  async vote(quoteId: string, userId: string): Promise<Quote> {
    const quote = await this.findOne(quoteId);
    const existingVote = await this.userVotesRepository.findOneBy({
      userId: userId,
      quoteId: quoteId,
    });
    if (existingVote) {
      throw new ConflictException('User has already voted for this quote.');
    }
    const userVote = this.userVotesRepository.create({ userId, quoteId });
    await this.userVotesRepository.save(userVote);
    quote.votes += 1;
    return this.quotesRepository.save(quote);
  }

  async findAll(
    search?: string,
    userId?: string,
    minVotes?: number,
    maxVotes?: number,
    sortBy: SortBy = 'createdAt',
    order: SortOrder = 'DESC',
  ): Promise<QuoteResponseDto[]> {
    const queryBuilder = this.quotesRepository.createQueryBuilder('quote');

    if (search) {
      queryBuilder.where(
        'quote.content LIKE :search OR quote.author LIKE :search',
        { search: `%${search}%` },
      );
    }

    if (minVotes !== undefined) {
      queryBuilder.andWhere('quote.votes >= :minVotes', { minVotes });
    }
    if (maxVotes !== undefined) {
      queryBuilder.andWhere('quote.votes <= :maxVotes', { maxVotes });
    }

    const allowedSortBy: SortBy[] = ['votes', 'createdAt', 'updatedAt'];
    if (allowedSortBy.includes(sortBy)) {
      queryBuilder.orderBy(`quote.${sortBy}`, order);
    } else {
      queryBuilder.orderBy('quote.createdAt', 'DESC');
    }

    const quotes = await queryBuilder.getMany();

    if (userId) {
      const userVotes = await this.userVotesRepository.find({
        where: { userId: userId },
        select: ['quoteId'],
      });
      const votedQuoteIds = new Set(userVotes.map((vote) => vote.quoteId));

      return quotes.map((quote) => ({
        ...quote,
        createdAt: quote.createdAt.toISOString(),
        updatedAt: quote.updatedAt.toISOString(),
        hasVoted: votedQuoteIds.has(quote.id),
      })) as QuoteResponseDto[];
    }

    return quotes.map((quote) => ({
      ...quote,
      createdAt: quote.createdAt.toISOString(),
      updatedAt: quote.updatedAt.toISOString(),
      hasVoted: false,
    })) as QuoteResponseDto[];
  }
}
