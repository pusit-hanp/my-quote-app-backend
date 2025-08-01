import { Test, TestingModule } from '@nestjs/testing';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { Quote } from './entities/quote.entity';
import { QuoteResponseDto } from './dto/quote-response.dto';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

type MockType<T> = {
  [P in keyof T]?: jest.Mock<any>;
};

const mockQuotesService: () => MockType<QuotesService> = jest.fn(() => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  vote: jest.fn(),
}));

describe('QuotesController', () => {
  let controller: QuotesController;
  let quotesService: MockType<QuotesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuotesController],
      providers: [{ provide: QuotesService, useFactory: mockQuotesService }],
    }).compile();

    controller = module.get<QuotesController>(QuotesController);
    quotesService = module.get(QuotesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateQuoteDto = {
      content: 'Test Quote',
      author: 'Test Author',
    };
    const newQuote = { id: '1', ...createDto, votes: 0 } as Quote;

    it('should create a new quote', async () => {
      (quotesService.create as jest.Mock).mockResolvedValue(newQuote);
      await expect(controller.create(createDto)).resolves.toEqual(newQuote);
      expect(quotesService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    const quotes: QuoteResponseDto[] = [
      {
        id: '1',
        content: 'Q1',
        votes: 5,
        hasVoted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    const mockRequest = { user: { userId: 'testUser123' } };

    it('should return all quotes', async () => {
      (quotesService.findAll as jest.Mock).mockResolvedValue(quotes);
      await expect(controller.findAll(undefined, mockRequest)).resolves.toEqual(
        quotes,
      );
      expect(quotesService.findAll).toHaveBeenCalledWith(
        undefined,
        'testUser123',
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should pass search, filter, and sort params to service', async () => {
      const query = {
        q: 'search',
        minVotes: 1,
        maxVotes: 10,
        sortBy: 'votes',
        order: 'DESC',
      };
      (quotesService.findAll as jest.Mock).mockResolvedValue([]);

      await controller.findAll(
        query.q,
        mockRequest,
        query.minVotes,
        query.maxVotes,
        query.sortBy as any,
        query.order as any,
      );

      expect(quotesService.findAll).toHaveBeenCalledWith(
        'search',
        'testUser123',
        1,
        10,
        'votes',
        'DESC',
      );
    });
  });

  describe('findOne', () => {
    const quote = { id: '1', content: 'Test', author: 'Author' } as Quote;

    it('should return a single quote', async () => {
      (quotesService.findOne as jest.Mock).mockResolvedValue(quote);
      await expect(controller.findOne('1')).resolves.toEqual(quote);
      expect(quotesService.findOne).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if quote not found', async () => {
      (quotesService.findOne as jest.Mock).mockRejectedValue(
        new NotFoundException(),
      );
      await expect(controller.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto = { content: 'New Content' };
    const updatedQuote = { id: '1', content: 'New Content', votes: 0 } as Quote;

    it('should update a quote', async () => {
      (quotesService.update as jest.Mock).mockResolvedValue(updatedQuote);
      await expect(controller.update('1', updateDto)).resolves.toEqual(
        updatedQuote,
      );
      expect(quotesService.update).toHaveBeenCalledWith('1', updateDto);
    });

    it('should throw BadRequestException if update fails', async () => {
      (quotesService.update as jest.Mock).mockRejectedValue(
        new BadRequestException(),
      );
      await expect(controller.update('1', updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a quote', async () => {
      (quotesService.remove as jest.Mock).mockResolvedValue(undefined);
      await expect(controller.remove('1')).resolves.toBeUndefined();
      expect(quotesService.remove).toHaveBeenCalledWith('1');
    });

    it('should throw BadRequestException if remove fails', async () => {
      (quotesService.remove as jest.Mock).mockRejectedValue(
        new BadRequestException(),
      );
      await expect(controller.remove('1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('vote', () => {
    const updatedQuote = { id: '1', content: 'Test', votes: 1 } as Quote;
    const mockRequest = { user: { userId: 'testUser123' } };

    it('should increment vote count', async () => {
      (quotesService.vote as jest.Mock).mockResolvedValue(updatedQuote);
      await expect(controller.vote('1', mockRequest)).resolves.toEqual(
        updatedQuote,
      );
      expect(quotesService.vote).toHaveBeenCalledWith('1', 'testUser123');
    });

    it('should throw ConflictException if user already voted', async () => {
      (quotesService.vote as jest.Mock).mockRejectedValue(
        new ConflictException('User already voted'),
      );
      await expect(controller.vote('1', mockRequest)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
