import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongoose from 'mongoose';
import { BlogState } from './blog-state.enum'; // Import the BlogState enum
import { User } from 'src/users/schemas/user.schema';
import { ApiProperty } from '@nestjs/swagger';

export type BlogDocument = HydratedDocument<Blog>;

@Schema()
export class Blog {
  @ApiProperty({
    example: 'My First Blog Post',
    description: 'The title of the blog post',
  })
  @Prop({ required: true })
  title: string;

  @ApiProperty({
    example: 'This is a blog post about NestJS and MongoDB...',
    description: 'A brief description or summary of the blog post',
  })
  @Prop({ required: true })
  description: string;

  @ApiProperty({
    example: '60d3b41abdacab0026a733c6',
    description: 'The ID of the user who authored the blog post',
  })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }) // Reference to User model
  author: User;

  @ApiProperty({
    example: BlogState.Published,
    description: 'The state of the blog post, e.g., Draft, Published',
    enum: BlogState,
  })
  @Prop({ enum: BlogState, default: BlogState.Draft })
  state: BlogState;

  @ApiProperty({
    example: 10,
    description: 'The number of times the blog post has been read',
  })
  @Prop({ default: 0 })
  read_count: number;

  @ApiProperty({
    description: 'Estimated reading time for the blog post in minutes',
  })
  @Prop()
  reading_time: number;

  @ApiProperty({
    example: ['nestjs', 'mongodb', 'tutorial'],
    description: 'A list of tags associated with the blog post',
  })
  @Prop({ required: true })
  tags: string[];

  @ApiProperty({
    example: 'This is the full content of the blog post...',
    description: 'The main body of the blog post',
  })
  @Prop({ required: true })
  body: string;
}

export const BlogSchema = SchemaFactory.createForClass(Blog);
