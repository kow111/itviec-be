import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role, RoleDocument } from './schemas/role.schema';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'mongoose-delete';
import { User } from 'src/decorator/customize';
import { IUser } from 'src/users/users.interface';
import aqp from 'api-query-params';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name)
    private roleModel: SoftDeleteModel<RoleDocument>,
  ) {}

  async create(createRoleDto: CreateRoleDto, user: IUser) {
    try {
      const { _id } = user;
      const checkRole = await this.roleModel.findOne({
        name: createRoleDto.name,
      });
      if (checkRole) {
        throw new BadRequestException(`Role with this name already exists`);
      }
      const createdRole = await this.roleModel.create({
        ...createRoleDto,
        createdBy: _id,
        updatedBy: _id,
      });
      return createdRole;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create role: ${error.message}`);
    }
  }

  async findAll(page: number, limit: number, qs: string) {
    try {
      const { filter, sort, population } = aqp(qs);
      delete filter.current;
      delete filter.pageSize;
      const skip = (page - 1) * limit;
      const total = await this.roleModel.countDocuments(filter);
      const totalPage = Math.ceil(total / limit);

      const result = await this.roleModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort(sort as any);
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
      const checkRole = await this.roleModel
        .findById(id)
        .populate({ path: 'permissions', select: '_id apiPath name method module' });
      if (!checkRole) {
        throw new BadRequestException(`Role not found`);
      }
      return checkRole;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`Failed to find role: ${error.message}`);
    }
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, user: IUser) {
    try {
      const { _id } = user;
      const checkRole = await this.roleModel.findById(id);
      if (!checkRole) {
        throw new BadRequestException(`Role not found`);
      }
      const checkName = await this.roleModel.findOne({
        _id: { $ne: id },
        name: updateRoleDto.name,
      });
      if (checkName) {
        throw new BadRequestException(`Role with this name already exists`);
      }
      const updatedRole = await this.roleModel.findByIdAndUpdate(
        id,
        {
          ...updateRoleDto,
          updatedBy: _id,
        },
        { new: true },
      );
      return updatedRole;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update role: ${error.message}`);
    }
  }

  async remove(id: string, user: IUser) {
    try {
      const { _id } = user;
      const checkRole = await this.roleModel.findById(id);
      if (!checkRole) {
        throw new BadRequestException(`Role not found`);
      }
      if (checkRole.name === 'ADMIN') {
        throw new BadRequestException(`Cannot delete admin role`);
      }
      await this.roleModel.findByIdAndUpdate(id, {
        deletedBy: _id,
      });
      return await this.roleModel.deleteById(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete role: ${error.message}`);
    }
  }
}
