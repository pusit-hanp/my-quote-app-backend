import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthUserDto } from '../auth/dto/auth-user.dto';

type MockType<T> = {
  [P in keyof T]?: jest.Mock<any>;
};

const mockAuthService: () => MockType<AuthService> = jest.fn(() => ({
  validateUser: jest.fn(),
  login: jest.fn(),
}));

describe('AuthController', () => {
  let controller: AuthController;
  let authService: MockType<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useFactory: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    const loginDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'password123',
    };
    const validatedUser: AuthUserDto = {
      id: 'user1',
      email: 'test@example.com',
    };
    const loginResponse = {
      access_token: 'jwt_token',
      userId: 'user1',
      username: 'test@example.com',
    };

    it('should return login response if credentials are valid', async () => {
      (authService.validateUser as jest.Mock).mockResolvedValue(validatedUser);
      (authService.login as jest.Mock).mockResolvedValue(loginResponse);

      await expect(controller.login(loginDto)).resolves.toEqual(loginResponse);
      expect(authService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(authService.login).toHaveBeenCalledWith(validatedUser);
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      (authService.validateUser as jest.Mock).mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(authService.login).not.toHaveBeenCalled();
    });
  });
});
