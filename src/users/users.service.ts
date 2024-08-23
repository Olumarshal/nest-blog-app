import { Model } from 'mongoose';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { LoginDTO } from 'src/auth/dto/login.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // Create a new user with hashed password
  async create(createUserDto: CreateUserDTO): Promise<UserDocument> {
    const { email } = createUserDto;
    const userExists = await this.userModel.findOne({ email });
    if (userExists) {
      throw new ConflictException('User already exists');
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const newUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    // Convert the saved user to a plain object and remove the password
    const userObject = savedUser.toObject();
    delete userObject.password;

    return userObject;
  }

  async findOne(data: LoginDTO): Promise<User> {
    const user = await this.userModel.findOne({ email: data.email });
    if (!user) {
      throw new NotFoundException('Could not find user');
    }
    return user;
  }

  // Find a user by email
  async findByEmail(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  // Find a user by ID
  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  // Update a user's details
  async updateUser(
    id: string,
    updateUserDto: UpdateUserDTO,
  ): Promise<UserDocument> {
    const existingUser = await this.findById(id);

    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt();
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    Object.assign(existingUser, updateUserDto);

    return existingUser.save();
  }
}
