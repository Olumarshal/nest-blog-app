import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongoose from 'mongoose';
import { BlogState } from './blog-state.enum'; // Import the BlogState enum
import { User } from 'src/users/schemas/user.schema';

export type BlogDocument = HydratedDocument<Blog>;

@Schema()
export class Blog {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }) // Reference to User model
  author: User;

  @Prop({ enum: BlogState, default: BlogState.Draft })
  state: BlogState;

  @Prop({ default: 0 })
  read_count: number;

  @Prop()
  reading_time: number;

  @Prop({ required: true })
  tags: string[];

  @Prop({ required: true })
  body: string;
}

export const BlogSchema = SchemaFactory.createForClass(Blog);
