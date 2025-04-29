import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { IUser } from 'src/users/users.interface';
import { Permission, PermissionDocument } from './schemas/permission.schema';
import { SoftDeleteModel } from 'mongoose-delete';
import { InjectModel } from '@nestjs/mongoose';
import aqp from 'api-query-params';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission.name)
    private permissionModel: SoftDeleteModel<PermissionDocument>,
  ) {}

  async create(createPermissionDto: CreatePermissionDto, user: IUser) {
    try {
      const { _id } = user;
      const checkPermission = await this.permissionModel.findOne({
        apiPath: createPermissionDto.apiPath,
        method: createPermissionDto.method,
      });
      if (checkPermission) {
        throw new BadRequestException(
          `Permission with this apiPath and method already exists`,
        );
      }
      const createdPermission = await this.permissionModel.create({
        ...createPermissionDto,
        createdBy: _id,
        updatedBy: _id,
      });
      return createdPermission;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create permission: ${error.message}`,
      );
    }
  }

  async findAll(page: number, limit: number, qs: string) {
    try {
      const { filter, sort, population } = aqp(qs);
      delete filter.current;
      delete filter.pageSize;
      const skip = (page - 1) * limit;
      const total = await this.permissionModel.countDocuments(filter);
      const totalPage = Math.ceil(total / limit);

      const result = await this.permissionModel
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
      const foundPermission = await this.permissionModel.findById(id);
      if (!foundPermission) {
        throw new BadRequestException(`Permission with id ${id} not found`);
      }
      return foundPermission;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to find permission: ${error.message}`,
      );
    }
  }

  async update(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
    user: IUser,
  ) {
    try {
      const { _id } = user;
      const checkPermission1 = await this.permissionModel.findById(id);
      if (!checkPermission1) {
        throw new BadRequestException(`Permission with id ${id} not found`);
      }

      const checkPermission2 = await this.permissionModel.findOne({
        _id: { $ne: id },
        apiPath: updatePermissionDto.apiPath,
        method: updatePermissionDto.method,
      });

      if (checkPermission2) {
        throw new BadRequestException(
          `Another permission with this apiPath and method already exists`,
        );
      }
      const updatedPermission = await this.permissionModel.findByIdAndUpdate(
        id,
        {
          ...updatePermissionDto,
          updatedBy: _id,
        },
        { new: true },
      );
      return updatedPermission;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update permission: ${error.message}`,
      );
    }
  }

  async remove(id: string, user: IUser) {
    try {
      const foundPermission = await this.permissionModel.findById(id);
      if (!foundPermission) {
        throw new BadRequestException(`Permission with id ${id} not found`);
      }
      await this.permissionModel.findByIdAndUpdate(id, {
        deletedBy: user._id,
      });
      return this.permissionModel.deleteById(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete permission: ${error.message}`,
      );
    }
  }
}
