import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { Job, JobDocument } from './schemas/job.schema';
import { SoftDeleteModel } from 'mongoose-delete';
import { InjectModel } from '@nestjs/mongoose';
import { IUser } from 'src/users/users.interface';
import aqp from 'api-query-params';

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name) private jobModel: SoftDeleteModel<JobDocument>,
  ) {}

  async create(createJobDto: CreateJobDto, user: IUser) {
    try {
      const createdJob = await this.jobModel.create({
        ...createJobDto,
        createdBy: user._id,
        updatedBy: user._id,
      });
      return createdJob;
    } catch (error) {
      throw new BadRequestException(`Failed to create job: ${error.message}`);
    }
  }

  async findAll(page: number, limit: number, qs: string) {
    try {
      const { filter, sort, population } = aqp(qs);
      delete filter.current;
      delete filter.pageSize;
      const skip = (page - 1) * limit;
      const total = await this.jobModel.countDocuments(filter);
      const totalPage = Math.ceil(total / limit);

      const result = await this.jobModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort(sort as any)
        .populate({ path: 'company', select: '-description' });
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
      const foundJob = await this.jobModel.findById(id).populate('company');
      if (!foundJob) {
        throw new NotFoundException(`Job with id ${id} not found`);
      }
      return foundJob;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`Failed to find job: ${error.message}`);
    }
  }

  async update(id: string, updateJobDto: UpdateJobDto, user: IUser) {
    try {
      const updatedJob = await this.jobModel.findByIdAndUpdate(
        id,
        {
          ...updateJobDto,
          updatedBy: user._id,
        },
        {
          new: true,
        },
      );
      if (!updatedJob) {
        throw new BadRequestException(`Job with id ${id} not found`);
      }
      return updatedJob;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update job: ${error.message}`);
    }
  }

  async remove(id: string, user: IUser) {
    try {
      const foundJob = await this.jobModel.findById(id);
      if (!foundJob) {
        throw new NotFoundException(`Job with id ${id} not found`);
      }
      await this.jobModel.findByIdAndUpdate(id, {
        deletedBy: user._id,
      });
      return this.jobModel.deleteById(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete job: ${error.message}`);
    }
  }
}
