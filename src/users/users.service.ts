import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto, RegisterUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { console } from 'inspector';
import { SoftDeleteModel } from 'mongoose-delete';
import { create } from 'domain';
import { IUser } from './users.interface';
import aqp from 'api-query-params';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compareSync(password, hash);
  }

  async create(createUserDto: CreateUserDto, user: IUser) {
    try {
      const foundUser = await this.userModel.findOne({
        email: createUserDto.email,
      });
      if (foundUser) {
        throw new BadRequestException(
          `User with email ${createUserDto.email} already exists`,
        );
      }
      const { password } = createUserDto;
      const hashedPassword = await this.hashPassword(password);
      createUserDto.password = hashedPassword;
      const createdUser = await this.userModel.create({
        ...createUserDto,
        createdBy: user._id,
        updatedBy: user._id,
      });
      return createdUser;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create user: ${error.message}`);
    }
  }

  async registerUser(createUserDto: RegisterUserDto) {
    try {
      const user = await this.userModel.findOne({
        email: createUserDto.email,
      });
      if (user) {
        throw new BadRequestException(
          `User with email ${createUserDto.email} already exists`,
        );
      }
      const { password } = createUserDto;
      const hashedPassword = await this.hashPassword(password);
      createUserDto.password = hashedPassword;
      const createdUser = await this.userModel.create({
        ...createUserDto,
        role: 'USER',
      });
      return {
        _id: createdUser._id,
        createdAt: createdUser.createdAt,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to register user: ${error.message}`,
      );
    }
  }

  async findAll(page: number, limit: number, qs: string) {
    try {
      const { filter, sort, population } = aqp(qs);
      delete filter.page;
      delete filter.limit;
      const skip = (page - 1) * limit;
      const total = await this.userModel.countDocuments(filter);
      const totalPage = Math.ceil(total / limit);

      const result = await this.userModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort(sort as any)
        .populate(population)
        .select('-password');
      return {
        meta: {
          current: page,
          pageSize: limit,
          pages: totalPage,
          total: total,
        },
        result: result,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch user: ${error.message}`);
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.userModel.findById(id).lean();
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      const { password, ...result } = user;
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete company: ${error.message}`,
      );
    }
  }

  async findOneByUsername(username: string) {
    try {
      const user = await this.userModel
        .findOne({
          email: username,
        })
        .lean();
      if (!user) {
        throw new NotFoundException(`User with Email: ${username} not found`);
      }
      return user;
    } catch (error) {
      throw new NotFoundException(`User with Email: ${username} not found`);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto, user: IUser) {
    try {
      const foundUser = await this.userModel.findById(id);
      if (!foundUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      const rs = (await this.userModel.findByIdAndUpdate(
        id,
        {
          ...updateUserDto,
          updatedBy: user._id,
        },
        {
          new: true,
          runValidators: true,
        },
      )) as UserDocument;
      return {
        _id: rs._id,
        updatedAt: rs.updatedAt,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update user: ${error.message}`);
    }
  }

  async remove(id: string, user: IUser) {
    try {
      const foundUser = await this.userModel.findById(id);
      if (!foundUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      if (foundUser.deleted) {
        throw new BadRequestException('User already deleted');
      }
      await this.userModel.findByIdAndUpdate(id, {
        deletedBy: user._id,
      });
      return this.userModel.deleteById(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete user: ${error.message}`);
    }
  }

  async updateUserToken(refreshToken: string, userId: string) {
    try {
      const user = await this.userModel.findByIdAndUpdate(
        userId,
        {
          refreshToken: refreshToken,
        },
        { new: true },
      );
      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update user token: ${error.message}`,
      );
    }
  }
}
