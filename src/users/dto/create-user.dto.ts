import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import mongoose from 'mongoose';

export class CreateUserDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  age: number;

  @IsNotEmpty()
  gender: string;

  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  role: string;

  company: mongoose.Schema.Types.ObjectId;
}

export class RegisterUserUserDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  age: number;

  @IsNotEmpty()
  gender: string;

  @IsNotEmpty()
  address: string;
}
