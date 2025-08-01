import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(), // If compare is used here, mock it
}));

// Mock implementation for User Repository
type MockRepository<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;
const mockUserRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOneBy: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: MockRepository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User), // <--- Add this
          useFactory: mockUserRepository, // <--- Add this
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User)); // <--- Add this
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const email = 'test@example.com';
    const password = 'password123';
    const hashedPassword = 'hashedPassword123';
    const newUser = {
      id: 'uuid',
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    beforeEach(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword as never);
    });

    it('should create and save a new user', async () => {
      userRepository.findOneBy.mockResolvedValue(undefined); // User doesn't exist
      userRepository.create.mockReturnValue(newUser);
      userRepository.save.mockResolvedValue(newUser);

      await expect(service.create(email, password)).resolves.toEqual(newUser);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ email });
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        email,
        password: hashedPassword,
      });
      expect(userRepository.save).toHaveBeenCalledWith(newUser);
    });

    it('should throw ConflictException if user already exists', async () => {
      userRepository.findOneBy.mockResolvedValue(newUser); // User already exists

      await expect(service.create(email, password)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ email });
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findOneByEmail', () => {
    const user = {
      id: 'uuid',
      email: 'test@example.com',
      password: 'hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    it('should return a user if found by email', async () => {
      userRepository.findOneBy.mockResolvedValue(user);
      await expect(service.findOneByEmail('test@example.com')).resolves.toEqual(
        user,
      );
      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    it('should return undefined if user not found by email', async () => {
      userRepository.findOneBy.mockResolvedValue(undefined);
      await expect(
        service.findOneByEmail('nonexistent@example.com'),
      ).resolves.toBeUndefined();
    });
  });

  describe('findOneById', () => {
    const user = {
      id: 'uuid',
      email: 'test@example.com',
      password: 'hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    it('should return a user if found by id', async () => {
      userRepository.findOneBy.mockResolvedValue(user);
      await expect(service.findOneById('uuid')).resolves.toEqual(user);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: 'uuid' });
    });

    it('should return undefined if user not found by id', async () => {
      userRepository.findOneBy.mockResolvedValue(undefined);
      await expect(service.findOneById('nonexistent')).resolves.toBeUndefined();
    });
  });
});
