import { Injectable } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { SoftDeleteModel } from 'mongoose-delete';
import { Company, CompanyDocument } from './schemas/company.schema';
import { InjectModel } from '@nestjs/mongoose';
import { IUser } from 'src/users/users.interface';
import { UsersService } from 'src/users/users.service';

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

  findAll() {
    return `This action returns all companies`;
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

  remove(id: number) {
    return `This action removes a #${id} company`;
  }
}
