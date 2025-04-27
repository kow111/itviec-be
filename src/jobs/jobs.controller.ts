import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { IUser } from 'src/users/users.interface';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ResponseMessage('Create job successfully')
  async create(@Body() createJobDto: CreateJobDto, @User() user: IUser) {
    const rs = await this.jobsService.create(createJobDto, user);
    return {
      _id: rs._id,
      createdAt: rs.createdAt,
    };
  }

  @Public()
  @Get()
  @ResponseMessage('Get all jobs successfully')
  findAll(
    @Query('current') page: string = '1',
    @Query('pageSize') limit: string = '10',
    @Query() qs: string,
  ) {
    return this.jobsService.findAll(+page, +limit, qs);
  }

  @Public()
  @Get(':id')
  @ResponseMessage('Get job successfully')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage('Update job successfully')
  update(
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
    @User() user: IUser,
  ) {
    return this.jobsService.update(id, updateJobDto, user);
  }

  @Delete(':id')
  @ResponseMessage('Delete job successfully')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.jobsService.remove(id, user);
  }
}
