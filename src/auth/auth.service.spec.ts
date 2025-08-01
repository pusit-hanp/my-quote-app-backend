import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthUserDto } from '../auth/dto/auth-user.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

type MockUsersService = Partial<Record<keyof UsersService, jest.Mock>>;
const mockUsersService = () => ({
  findOneByEmail: jest.fn(),
});

type MockJwtService = Partial<Record<keyof JwtService, jest.Mock>>;
const mockJwtService = () => ({
  sign: jest.fn(),
});

describe('AuthService', () => {
  let service: AuthService;
  let usersService: MockUsersService;
  let jwtService: MockJwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useFactory: mockUsersService },
        { provide: JwtService, useFactory: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<MockUsersService>(UsersService);
    jwtService = module.get<MockJwtService>(JwtService);

    // Clear all mocks for a clean slate before each test
    (bcrypt.compare as jest.Mock).mockClear();
    (bcrypt.hash as jest.Mock).mockClear();
    (usersService.findOneByEmail as jest.Mock).mockClear();
    (jwtService.sign as jest.Mock).mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    const email = 'test@example.com';
    const rawPassword = 'password123';
    const hashedPassword = 'hashedPassword';
    const user = { id: 'user1', email, password: hashedPassword } as any;

    it('should return user data if credentials are valid', async () => {
      usersService.findOneByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(email, rawPassword);
      expect(result).toEqual({ id: user.id, email: user.email });
      expect(usersService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(rawPassword, hashedPassword);
    });

    it('should return null if user not found', async () => {
      usersService.findOneByEmail.mockResolvedValue(undefined);
      const result = await service.validateUser(email, rawPassword);
      expect(result).toBeNull();
      expect(usersService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return null if password is invalid', async () => {
      usersService.findOneByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const result = await service.validateUser(email, rawPassword);
      expect(result).toBeNull();
      expect(usersService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(rawPassword, hashedPassword);
    });
  });

  describe('login', () => {
    const user: AuthUserDto = { id: 'user1', email: 'test@example.com' };
    const accessToken = 'mockAccessToken';

    it('should return an access token and user info', async () => {
      jwtService.sign.mockReturnValue(accessToken);

      const result = await service.login(user);
      expect(result).toEqual({
        access_token: accessToken,
        userId: user.id,
        username: user.email,
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        sub: user.id,
      });
    });
  });
});
