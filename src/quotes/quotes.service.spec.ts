// my-quote-app-backend/src/quotes/quotes.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { QuotesService } from './quotes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote } from './entities/quote.entity';
import { UserVote } from '../votes/entities/user-vote.entity';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { QuoteResponseDto } from './dto/quote-response.dto';

// Define a robust MockType for repositories/services
type MockType<T> = {
  [P in keyof T]?: jest.Mock<any>;
};

// Mock implementation for Quote Repository factory
const mockQuoteRepositoryFactory: () => MockType<Repository<Quote>> = jest.fn(
  () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    merge: jest.fn(),
    // Correctly mock createQueryBuilder and its chainable methods
    createQueryBuilder: jest.fn(),
  }),
);

// Mock implementation for UserVote Repository factory
const mockUserVoteRepositoryFactory: () => MockType<Repository<UserVote>> =
  jest.fn(() => ({
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
  }));

describe('QuotesService', () => {
  let service: QuotesService;
  let quoteRepository: MockType<Repository<Quote>>;
  let userVoteRepository: MockType<Repository<UserVote>>;

  // Define a reusable mockQueryBuilder here
  let mockQueryBuilderMethods: {
    where: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    getMany: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotesService,
        {
          provide: getRepositoryToken(Quote),
          useFactory: mockQuoteRepositoryFactory,
        },
        {
          provide: getRepositoryToken(UserVote),
          useFactory: mockUserVoteRepositoryFactory,
        },
      ],
    }).compile();

    service = module.get<QuotesService>(QuotesService);
    quoteRepository = module.get(getRepositoryToken(Quote));
    userVoteRepository = module.get(getRepositoryToken(UserVote));

    // Initialize mockQueryBuilderMethods and ensure createQueryBuilder returns it
    mockQueryBuilderMethods = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };
    (quoteRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      mockQueryBuilderMethods,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a quote', async () => {
      const createQuoteDto = { content: 'Test Quote', author: 'Test Author' };
      const newQuote = {
        id: '1',
        ...createQuoteDto,
        votes: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Quote;
      (quoteRepository.create as jest.Mock).mockReturnValue(newQuote);
      (quoteRepository.save as jest.Mock).mockResolvedValue(newQuote);

      await expect(service.create(createQuoteDto)).resolves.toEqual(newQuote);
      expect(quoteRepository.create).toHaveBeenCalledWith(createQuoteDto);
      expect(quoteRepository.save).toHaveBeenCalledWith(newQuote);
    });
  });

  describe('findOne', () => {
    const quote = {
      id: '1',
      content: 'Test',
      author: 'Author',
      votes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Quote;
    it('should return a quote if found', async () => {
      (quoteRepository.findOneBy as jest.Mock).mockResolvedValue(quote);
      await expect(service.findOne('1')).resolves.toEqual(quote);
      expect(quoteRepository.findOneBy).toHaveBeenCalledWith({ id: '1' });
    });

    it('should throw NotFoundException if quote not found', async () => {
      (quoteRepository.findOneBy as jest.Mock).mockResolvedValue(undefined);
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    const quotesFromRepo = [
      {
        id: '1',
        content: 'Q1',
        votes: 5,
        createdAt: new Date('2025-01-01T10:00:00Z'),
        updatedAt: new Date('2025-01-01T10:00:00Z'),
      },
      {
        id: '2',
        content: 'Q2',
        votes: 10,
        createdAt: new Date('2025-01-02T10:00:00Z'),
        updatedAt: new Date('2025-01-02T10:00:00Z'),
      },
    ] as Quote[];

    const getExpectedQuoteResponse = (
      quote: Quote,
      hasVoted: boolean,
    ): QuoteResponseDto => ({
      ...quote,
      createdAt: quote.createdAt.toISOString(),
      updatedAt: quote.updatedAt.toISOString(),
      hasVoted: hasVoted,
    });

    const userVotes = [{ quoteId: '1' }] as UserVote[];

    beforeEach(() => {
      mockQueryBuilderMethods.getMany.mockResolvedValue(quotesFromRepo);
      (userVoteRepository.find as jest.Mock).mockResolvedValue(userVotes);
      mockQueryBuilderMethods.where.mockClear();
      mockQueryBuilderMethods.andWhere.mockClear();
      mockQueryBuilderMethods.orderBy.mockClear();
    });

    it('should return all quotes', async () => {
      const expected = quotesFromRepo.map((q) =>
        getExpectedQuoteResponse(q, false),
      );
      await expect(service.findAll()).resolves.toEqual(expected);
      expect(mockQueryBuilderMethods.getMany).toHaveBeenCalled();
      expect(quoteRepository.createQueryBuilder).toHaveBeenCalledWith('quote');
    });

    it('should return quotes with hasVoted true for voted items when userId is provided', async () => {
      const expectedQuotesWithVote = [
        getExpectedQuoteResponse(quotesFromRepo[0], true),
        getExpectedQuoteResponse(quotesFromRepo[1], false),
      ];
      await expect(service.findAll(undefined, 'userId1')).resolves.toEqual(
        expectedQuotesWithVote,
      );
      expect(userVoteRepository.find).toHaveBeenCalledWith({
        where: { userId: 'userId1' },
        select: ['quoteId'],
      });
    });

    it('should filter by search term', async () => {
      await service.findAll('test search');
      expect(mockQueryBuilderMethods.where).toHaveBeenCalledWith(
        'quote.content LIKE :search OR quote.author LIKE :search',
        { search: '%test search%' },
      );
    });

    it('should filter by minVotes', async () => {
      await service.findAll(undefined, undefined, 5);
      expect(mockQueryBuilderMethods.andWhere).toHaveBeenCalledWith(
        'quote.votes >= :minVotes',
        { minVotes: 5 },
      );
    });

    it('should filter by maxVotes', async () => {
      await service.findAll(undefined, undefined, undefined, 10);
      expect(mockQueryBuilderMethods.andWhere).toHaveBeenCalledWith(
        'quote.votes <= :maxVotes',
        { maxVotes: 10 },
      );
    });

    it('should sort by votes descending', async () => {
      await service.findAll(
        undefined,
        undefined,
        undefined,
        undefined,
        'votes',
        'DESC',
      );
      expect(mockQueryBuilderMethods.orderBy).toHaveBeenCalledWith(
        'quote.votes',
        'DESC',
      );
    });

    it('should sort by createdAt ascending', async () => {
      await service.findAll(
        undefined,
        undefined,
        undefined,
        undefined,
        'createdAt',
        'ASC',
      );
      expect(mockQueryBuilderMethods.orderBy).toHaveBeenCalledWith(
        'quote.createdAt',
        'ASC',
      );
    });
  });

  describe('update', () => {
    const quoteWithNoVotes = {
      id: '1',
      content: 'Old',
      author: 'A',
      votes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Quote;
    const quoteWithVotes = {
      id: '2',
      content: 'Old',
      author: 'B',
      votes: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Quote;
    const updateDto = { content: 'New Content' };

    beforeEach(() => {
      jest.spyOn(service, 'findOne').mockRestore();
    });

    it('should update a quote if it has 0 votes', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(quoteWithNoVotes);
      const modifiedQuoteInstance = quoteWithNoVotes;
      (quoteRepository.merge as jest.Mock).mockImplementation(
        (entity, partialEntity) => {
          Object.assign(entity, partialEntity);
          return entity;
        },
      );
      (quoteRepository.save as jest.Mock).mockResolvedValue({
        ...modifiedQuoteInstance,
        ...updateDto,
      });

      await expect(service.update('1', updateDto)).resolves.toEqual({
        ...quoteWithNoVotes,
        ...updateDto,
      });
      expect(quoteRepository.merge).toHaveBeenCalledWith(
        quoteWithNoVotes,
        updateDto,
      );
      expect(quoteRepository.save).toHaveBeenCalledWith(quoteWithNoVotes);
    });

    it('should throw BadRequestException if quote has votes', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(quoteWithVotes);
      await expect(service.update('2', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(quoteRepository.merge).not.toHaveBeenCalled();
      expect(quoteRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const quoteWithNoVotes = {
      id: '1',
      content: 'Old',
      author: 'A',
      votes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Quote;
    const quoteWithVotes = {
      id: '2',
      content: 'Old',
      author: 'B',
      votes: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Quote;

    beforeEach(() => {
      jest.spyOn(service, 'findOne').mockRestore();
    });

    it('should remove a quote if it has 0 votes', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(quoteWithNoVotes);
      (quoteRepository.delete as jest.Mock).mockResolvedValue({ affected: 1 });

      await expect(service.remove('1')).resolves.toBeUndefined();
      expect(quoteRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw BadRequestException if quote has votes', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(quoteWithVotes);
      await expect(service.remove('2')).rejects.toThrow(BadRequestException);
    });
  });

  describe('vote', () => {
    const quote = {
      id: '1',
      content: 'Test',
      author: 'Author',
      votes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Quote;
    const user = { userId: 'user1' };

    beforeEach(() => {
      jest.spyOn(service, 'findOne').mockRestore();
    });

    it('should increment votes and record vote if user has not voted', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(quote);
      (userVoteRepository.findOneBy as jest.Mock).mockResolvedValue(undefined);
      (userVoteRepository.create as jest.Mock).mockReturnValue({
        userId: user.userId,
        quoteId: quote.id,
      });
      (userVoteRepository.save as jest.Mock).mockResolvedValue({
        id: 'vote1',
        userId: user.userId,
        quoteId: quote.id,
      });
      (quoteRepository.save as jest.Mock).mockResolvedValue({
        ...quote,
        votes: 1,
      });

      await expect(service.vote(quote.id, user.userId)).resolves.toEqual({
        ...quote,
        votes: 1,
      });
      expect(userVoteRepository.findOneBy).toHaveBeenCalledWith({
        userId: user.userId,
        quoteId: quote.id,
      });
      expect(userVoteRepository.create).toHaveBeenCalledWith({
        userId: user.userId,
        quoteId: quote.id,
      });
      expect(userVoteRepository.save).toHaveBeenCalled();
      expect(quoteRepository.save).toHaveBeenCalledWith({ ...quote, votes: 1 });
    });

    it('should throw ConflictException if user has already voted', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(quote);
      (userVoteRepository.findOneBy as jest.Mock).mockResolvedValue({
        id: 'vote1',
        userId: user.userId,
        quoteId: quote.id,
      });

      await expect(service.vote(quote.id, user.userId)).rejects.toThrow(
        ConflictException,
      );
      expect(userVoteRepository.findOneBy).toHaveBeenCalledWith({
        userId: user.userId,
        quoteId: quote.id,
      });
      expect(userVoteRepository.save).not.toHaveBeenCalled();
      expect(quoteRepository.save).not.toHaveBeenCalled();
    });
  });
});
