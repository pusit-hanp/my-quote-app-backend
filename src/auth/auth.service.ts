import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthUserDto } from './dto/auth-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // Change return type from Promise<any> to Promise<AuthUserDto | null>
  async validateUser(
    email: string,
    password_raw: string,
  ): Promise<AuthUserDto | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await bcrypt.compare(password_raw, user.password))) {
      // If password matches, return user data excluding password
      const { password, ...result } = user;
      // Ensure 'result' conforms to AuthUserDto
      return result as AuthUserDto; // Type assertion here, as 'result' now matches AuthUserDto structure
    }
    return null;
  }

  async login(user: AuthUserDto) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      userId: user.id,
      username: user.email,
    };
  }
}
