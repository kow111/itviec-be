import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { IUser } from 'src/users/users.interface';
import { UsersService } from 'src/users/users.service';
import { RolesService } from 'src/roles/roles.service';
const ms = require('ms');

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private rolesService: RolesService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByUsername(username);
    if (!user) {
      return null;
    }
    const isPasswordValid = await this.usersService.comparePassword(
      pass,
      user.password,
    );
    if (isPasswordValid) {
      const userRole = user.role as unknown as { _id: string; name: string };
      const tmp = await this.rolesService.findOne(userRole._id);
      const objUser = {
        ...user,
        permissions: tmp?.permissions ?? [],
      };
      const { password, ...result } = objUser;
      return result;
    }
    return null;
  }

  async register(registerUserDto: RegisterUserDto) {
    try {
      const result = await this.usersService.registerUser(registerUserDto);
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to register user: ${error.message}`,
      );
    }
  }

  async login(user: IUser, response: Response) {
    const { _id, name, email, role, permissions } = user;
    const payload = {
      sub: 'token login',
      iss: 'from server',
      _id: _id.toString(),
      name,
      email,
      role,
    };

    const refreshToken = await this.createRefreshToken(payload);
    await this.usersService.updateUserToken(refreshToken, _id);
    const expiration = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
    )!;
    if (!expiration) {
      throw new Error('JWT_REFRESH_EXPIRATION is not defined');
    }
    const maxAge = ms(expiration);
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      maxAge: maxAge,
      secure: true,
      sameSite: 'none',
    });
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        _id,
        name,
        email,
        role,
        permissions,
      },
    };
  }

  async createRefreshToken(payload) {
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION'),
    });

    return refreshToken;
  }

  async handleRefreshToken(refreshToken: string, response: Response) {
    try {
      this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.usersService.findByRefreshToken(refreshToken);
      const userRole = user.role as unknown as { _id: string; name: string };
      const tmp = (await this.rolesService.findOne(userRole._id)) as any;
      const { _id, name, email, role } = user;
      const iUser: IUser = {
        _id: _id.toString(),
        name,
        email,
        role: userRole,
        permissions: tmp?.permissions ?? [],
      };
      return this.login(iUser, response);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to refresh token: ${error.message}`,
      );
    }
  }

  async handleLogout(user: IUser, response: Response) {
    try {
      await this.usersService.updateUserToken('', user._id);
      response.clearCookie('refresh_token');
      return 'ok';
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`Failed to logout: ${error.message}`);
    }
  }
}
