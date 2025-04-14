import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { console } from 'inspector';
import { SoftDeleteModel } from 'mongoose-delete';

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

  async create(createUserDto: CreateUserDto) {
    const { password } = createUserDto;
    const hashedPassword = await this.hashPassword(password);
    createUserDto.password = hashedPassword;
    const createdUser = await this.userModel.create(createUserDto);
    return createdUser;
  }

  findAll() {
    return `This action returns all users`;
  }

  async findOne(id: string) {
    try {
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user;
    } catch (error) {
      throw new NotFoundException(`User with ID ${id} not found`);
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

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return await this.userModel.findByIdAndUpdate(id, updateUserDto, {
        new: true,
        runValidators: true,
      });
    } catch (error) {
      throw new Error(`Error updating user with ID ${id}: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return this.userModel.deleteById(id);
    } catch (error) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}
