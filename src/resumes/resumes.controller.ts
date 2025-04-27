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
import { ResumesService } from './resumes.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { ResponseMessage, User } from 'src/decorator/customize';
import { IUser } from 'src/users/users.interface';

@Controller('resumes')
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Post()
  async create(@Body() createResumeDto: CreateResumeDto, @User() user: IUser) {
    const rs = await this.resumesService.create(createResumeDto, user);
    return {
      _id: rs._id,
      createdAt: rs.createdAt,
    };
  }

  @Post('by-user')
  getCvByUser(@User() user: IUser) {
    return this.resumesService.getByUser(user);
  }

  @Get()
  @ResponseMessage('Get all resumes successfully')
  findAll(
    @Query('current') page: string = '1',
    @Query('pageSize') limit: string = '10',
    @Query() qs: string,
  ) {
    return this.resumesService.findAll(+page, +limit, qs);
  }

  @Get(':id')
  @ResponseMessage('Get resume successfully')
  findOne(@Param('id') id: string) {
    return this.resumesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateResumeDto: UpdateResumeDto,
    @User() user: IUser,
  ) {
    return this.resumesService.update(id, updateResumeDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.resumesService.remove(id, user);
  }
}
