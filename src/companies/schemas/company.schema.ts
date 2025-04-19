import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';

export type CompanyDocument = HydratedDocument<Company>;

@Schema({ timestamps: true })
export class Company {
  @Prop()
  name: string;

  @Prop()
  address: string;

  @Prop()
  description: string;

  @Prop()
  deleted: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  createdBy: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  updatedBy: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  deletedBy: User;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
