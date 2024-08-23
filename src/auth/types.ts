import { ObjectId } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';

export interface PayloadType {
  email: string;
  userId: ObjectId;
}

export interface UserWithId extends User {
  _id: ObjectId;
}
