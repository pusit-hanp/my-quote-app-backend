import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class AuthUserDto {
  @IsString()
  @IsNotEmpty()
  id: string; // The user's ID

  @IsEmail()
  @IsNotEmpty()
  email: string; // The user's email
}
