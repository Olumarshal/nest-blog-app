import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @ApiProperty({
    example: 'John',
    description: 'provide the firstName of the user',
  })
  @Prop({ required: true })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'provide the lastName of the user',
  })
  @Prop({ required: true })
  lastName: string;

  @ApiProperty({
    example: 'John23@test.com',
    description: 'provide the email of the user',
  })
  @Prop({ required: true, unique: true })
  email: string;

  @ApiProperty({
    description: 'provide the password of the user',
  })
  @Prop({ required: true })
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

export type SanitizedUser = Omit<User, 'password'>;
