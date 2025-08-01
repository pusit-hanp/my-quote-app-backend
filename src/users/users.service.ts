import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt'; // Import bcrypt

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(email: string, password_raw: string): Promise<User> {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password_raw, 10); // 10 is the salt rounds

    const existingUser = await this.usersRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const newUser = this.usersRepository.create({
      email,
      password: hashedPassword,
    });
    return this.usersRepository.save(newUser);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  async findOneById(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }
}
