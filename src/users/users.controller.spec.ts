import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service'; // Controller's dependency
import { CreateUserDto } from './dto/create-user.dto';
import { ConflictException } from '@nestjs/common';

// Define a general MockType for services (assuming it's not global)
type MockType<T> = {
  [P in keyof T]?: jest.Mock<any>;
};

// Mock UsersService
const mockUsersService: () => MockType<UsersService> = jest.fn(() => ({
  create: jest.fn(),
}));

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: MockType<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useFactory: mockUsersService }, // Provide mock UsersService
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService); // Get the mock instance
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'password123',
    };
    const newUser = { id: 'uuid', email: 'test@example.com' } as any;

    it('should register a new user successfully', async () => {
      (usersService.create as jest.Mock).mockResolvedValue(newUser);

      await expect(controller.register(createUserDto)).resolves.toEqual(
        newUser,
      );
      expect(usersService.create).toHaveBeenCalledWith(
        createUserDto.email,
        createUserDto.password,
      );
    });

    it('should throw ConflictException if user already exists', async () => {
      (usersService.create as jest.Mock).mockRejectedValue(
        new ConflictException('User already exists'),
      );

      await expect(controller.register(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.create).toHaveBeenCalledWith(
        createUserDto.email,
        createUserDto.password,
      );
    });
  });
});
