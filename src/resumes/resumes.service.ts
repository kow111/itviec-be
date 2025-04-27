import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { IUser } from 'src/users/users.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Resume, ResumeDocument } from './schemas/resume.schema';
import { SoftDeleteModel } from 'mongoose-delete';
import aqp from 'api-query-params';
import mongoose from 'mongoose';

@Injectable()
export class ResumesService {
  constructor(
    @InjectModel(Resume.name)
    private resumeModel: SoftDeleteModel<ResumeDocument>,
  ) {}

  async create(createResumeDto: CreateResumeDto, user: IUser) {
    try {
      const { _id, email } = user;
      const createdResume = await this.resumeModel.create({
        ...createResumeDto,
        email,
        userId: _id,
        status: 'PENDING',
        history: [
          {
            status: 'PENDING',
            updateAt: new Date(),
            updatedBy: _id,
          },
        ],
        createdBy: _id,
        updatedBy: _id,
      });
      return createdResume;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch user: ${error.message}`);
    }
  }

  async findAll(page: number, limit: number, qs: string) {
    try {
      const { filter, sort, population, projection } = aqp(qs);
      delete filter.current;
      delete filter.pageSize;
      const skip = (page - 1) * limit;
      const total = await this.resumeModel.countDocuments(filter);
      const totalPage = Math.ceil(total / limit);

      const result = await this.resumeModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort(sort as any)
        .populate(population)
        .select(projection);
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
      const foundResume = await this.resumeModel.findById(id);
      if (!foundResume) {
        throw new BadRequestException(`Resume with id ${id} not found`);
      }
      return foundResume;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`Failed to find resume: ${error.message}`);
    }
  }

  async update(id: string, updateResumeDto: UpdateResumeDto, user: IUser) {
    try {
      const { _id } = user;
      const foundResume = await this.resumeModel.findById(id);
      if (!foundResume) {
        throw new BadRequestException(`Resume with id ${id} not found`);
      }
      const updatedResume = await this.resumeModel.findByIdAndUpdate(
        id,
        {
          $push: {
            history: {
              status: updateResumeDto.status,
              updateAt: new Date(),
              updatedBy: new mongoose.Types.ObjectId(_id),
            },
          },
          ...updateResumeDto,
          updatedBy: new mongoose.Types.ObjectId(_id),
        },
        { new: true },
      );
      return updatedResume;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update resume: ${error.message}`,
      );
    }
  }

  async remove(id: string, user: IUser) {
    try {
      const foundResume = await this.resumeModel.findById(id);
      if (!foundResume) {
        throw new BadRequestException(`Resume with id ${id} not found`);
      }
      await this.resumeModel.findByIdAndUpdate(id, {
        deletedBy: user._id,
      });
      return this.resumeModel.deleteById(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete resume: ${error.message}`,
      );
    }
  }

  async getByUser(user: IUser) {
    try {
      const { _id } = user;
      const foundResume = await this.resumeModel.find({ userId: _id });

      return foundResume;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`Failed to find resume: ${error.message}`);
    }
  }
}
