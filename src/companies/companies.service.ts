import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { SoftDeleteModel } from 'mongoose-delete';
import { Company, CompanyDocument } from './schemas/company.schema';
import { InjectModel } from '@nestjs/mongoose';
import { IUser } from 'src/users/users.interface';
import { UsersService } from 'src/users/users.service';
import aqp from 'api-query-params';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name)
    private companyModel: SoftDeleteModel<CompanyDocument>,
    private readonly userService: UsersService,
  ) {}

  async create(createCompanyDto: CreateCompanyDto, user: IUser) {
    try {
      const { email } = user;
      const foundUser = await this.userService.findOneByUsername(email);
      if (!foundUser) {
        throw new Error('User not found');
      }
      const company = await this.companyModel.create({
        ...createCompanyDto,
        createdBy: foundUser._id,
        updatedBy: foundUser._id,
      });
      return company;
    } catch (error) {
      console.error('Error creating company:', error);
      throw new Error(`Failed to create company ${error.message}`);
    }
  }

  async findAll(page: number, limit: number, qs: string) {
    try {
      const { filter, sort, population } = aqp(qs);
      delete filter.page;
      delete filter.limit;
      const skip = (page - 1) * limit;
      const total = await this.companyModel.countDocuments(filter);
      const totalPage = Math.ceil(total / limit);

      const result = await this.companyModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort(sort as any)
        .populate(population);
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
      throw new Error(`Failed to fetch companies ${error.message}`);
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} company`;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto, user: IUser) {
    try {
      const { email } = user;
      const foundUser = await this.userService.findOneByUsername(email);
      if (!foundUser) {
        throw new Error('User not found');
      }
      const company = await this.companyModel.findByIdAndUpdate(
        id,
        {
          ...updateCompanyDto,
          updatedBy: foundUser._id,
        },
        { new: true },
      );
      return company;
    } catch (error) {
      console.error('Error updating company:', error);
      throw new Error(`Failed to update company ${error.message}`);
    }
  }

  async remove(id: string, user: IUser) {
    try {
      const foundUser = await this.userService.findOneByUsername(user.email);
      if (!foundUser) {
        throw new NotFoundException('User not found');
      }

      const company = await this.companyModel.findOneWithDeleted({ _id: id });
      if (!company) {
        throw new NotFoundException('Company not found');
      }

      if (company.deleted) {
        throw new BadRequestException('Company already deleted');
      }

      await this.companyModel.findByIdAndUpdate(id, {
        deletedBy: foundUser._id,
      });

      return this.companyModel.delete({ _id: id });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete company: ${error.message}`,
      );
    }
  }
}
