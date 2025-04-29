import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { AuthService } from './auth.service';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { Request, Response } from 'express';
import { RolesService } from 'src/roles/roles.service';
import { IUser } from 'src/users/users.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private roleService: RolesService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ResponseMessage('Login successful')
  async login(@Req() req, @Res({ passthrough: true }) response: Response) {
    return this.authService.login(req.user, response);
  }

  @Public()
  @Post('register')
  @ResponseMessage('Register successful')
  create(@Body() createUserDto: RegisterUserDto) {
    return this.authService.register(createUserDto);
  }

  @Get('account')
  @ResponseMessage('Account retrieved successfully')
  async getProfile(@User() user: IUser) {
    const tmp = (await this.roleService.findOne(user.role._id)) as any;
    user.permissions = tmp.permissions;
    return {
      user: user,
    };
  }

  @Public()
  @Get('refresh')
  @ResponseMessage('Refresh token successful')
  handleRefreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];
    return this.authService.handleRefreshToken(refreshToken, response);
  }

  @Post('logout')
  @ResponseMessage('Logout successful')
  handleLogout(@Req() req, @Res({ passthrough: true }) response: Response) {
    return this.authService.handleLogout(req.user, response);
  }
}
