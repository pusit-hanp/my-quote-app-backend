import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote } from './entities/quote.entity';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { UserVote } from '../votes/entities/user-vote.entity';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Quote)
    private quotesRepository: Repository<Quote>,
    @InjectRepository(UserVote)
    private userVotesRepository: Repository<UserVote>,
  ) {}

  // Create a new quote
  async create(createQuoteDto: CreateQuoteDto): Promise<Quote> {
    const newQuote = this.quotesRepository.create(createQuoteDto);
    return this.quotesRepository.save(newQuote);
  }

  // Get all quotes
  async findAll(search?: string, userId?: string): Promise<Quote[]> {
    // <-- Added userId parameter
    const queryBuilder = this.quotesRepository.createQueryBuilder('quote');

    if (search) {
      queryBuilder.where(
        'quote.content LIKE :search OR quote.author LIKE :search',
        { search: `%${search}%` },
      );
    }

    const quotes = await queryBuilder.getMany();

    // If a userId is provided, check if the user has voted for each quote
    if (userId) {
      // Get all votes by this user in one query for efficiency
      const userVotes = await this.userVotesRepository.find({
        where: { userId: userId },
        select: ['quoteId'], // Only need the quoteId
      });
      const votedQuoteIds = new Set(userVotes.map((vote) => vote.quoteId));

      // Map over quotes and add hasVoted flag
      return quotes.map((quote) => ({
        ...quote,
        hasVoted: votedQuoteIds.has(quote.id), // Add hasVoted property
      }));
    }

    // If no userId (e.g., for public API if you had one), return quotes as is
    return quotes.map((quote) => ({
      ...quote,
      hasVoted: false, // Default to false if no user context
    }));
  }

  // Get a single quote by ID
  async findOne(id: string): Promise<Quote> {
    const quote = await this.quotesRepository.findOneBy({ id });
    if (!quote) {
      throw new NotFoundException(`Quote with ID "${id}" not found`);
    }
    return quote;
  }

  // Update a quote (only if votes are 0)
  async update(id: string, updateQuoteDto: UpdateQuoteDto): Promise<Quote> {
    const quote = await this.findOne(id); // Use findOne to get the existing quote

    if (quote.votes > 0) {
      throw new BadRequestException('Cannot update a quote that has votes.');
    }

    // Apply updates
    this.quotesRepository.merge(quote, updateQuoteDto);
    return this.quotesRepository.save(quote);
  }

  // Delete a quote (only if votes are 0)
  async remove(id: string): Promise<void> {
    const quote = await this.findOne(id); // Use findOne to get the existing quote

    if (quote.votes > 0) {
      throw new BadRequestException('Cannot delete a quote that has votes.');
    }

    await this.quotesRepository.delete(id);
  }

  async vote(quoteId: string, userId: string): Promise<Quote> {
    const quote = await this.findOne(quoteId); // Ensure quote exists

    // Check if user has already voted for this quote
    const existingVote = await this.userVotesRepository.findOneBy({
      userId: userId,
      quoteId: quoteId,
    });

    if (existingVote) {
      throw new ConflictException('User has already voted for this quote.');
    }

    // Record the vote
    const userVote = this.userVotesRepository.create({ userId, quoteId });
    await this.userVotesRepository.save(userVote);

    // Increment the quote's vote count
    quote.votes += 1;
    return this.quotesRepository.save(quote);
  }
}
