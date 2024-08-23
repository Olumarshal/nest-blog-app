import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDTO } from './dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let userModel: Model<UserDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findOne: jest.fn(),
            findById: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            exec: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
  });

  describe('create', () => {
    it('should create a user with a hashed password', async () => {
      const createUserDto: CreateUserDTO = {
        email: 'test@test.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
      };
      const user = { _id: 'user-id', ...createUserDto };

      // Explicitly mock bcrypt functions
      jest
        .spyOn(bcrypt, 'genSalt')
        .mockImplementation(() => Promise.resolve('salt'));
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('hashed-password'));

      jest.spyOn(userModel, 'findOne').mockReturnValueOnce(null as any);
      jest.spyOn(userModel, 'create').mockReturnValue(user as any);

      const result = await service.create(createUserDto);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: 'test@test.com',
      });
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('password', 'salt');
      expect(userModel.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashed-password',
      });
      expect(result).toEqual(user);
    });

    it('should throw a ConflictException if user already exists', async () => {
      const createUserDto: CreateUserDTO = {
        email: 'test@test.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
      };
      jest.spyOn(userModel, 'findOne').mockReturnValueOnce({} as any);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      const loginDTO = { email: 'test@test.com', password: 'password' };
      const user = {
        _id: 'user-id',
        email: loginDTO.email,
        password: 'hashed-password',
      };

      jest.spyOn(userModel, 'findOne').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(user),
      } as any);

      const result = await service.findOne(loginDTO);
      expect(result).toEqual(user);
    });

    it('should throw a NotFoundException if user is not found', async () => {
      jest.spyOn(userModel, 'findOne').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.findOne({
          email: 'nonexistent@test.com',
          password: 'password',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const email = 'test@test.com';
      const user = { _id: 'user-id', email };

      jest.spyOn(userModel, 'findOne').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(user),
      } as any);

      const result = await service.findByEmail(email);
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user is not found', async () => {
      jest.spyOn(userModel, 'findOne').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.findByEmail('nonexistent@test.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findById', () => {
    it('should return a user by ID', async () => {
      const id = 'user-id';
      const user = { _id: id, email: 'test@test.com' };

      jest.spyOn(userModel, 'findById').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(user),
      } as any);

      const result = await service.findById(id);
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user is not found', async () => {
      jest.spyOn(userModel, 'findById').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUser', () => {
    it('should update user details and hash password if provided', async () => {
      const id = 'user-id';
      const updateUserDto: UpdateUserDTO = { password: 'new-password' };
      const existingUser = { _id: id, email: 'test@test.com', save: jest.fn() };

      // Mock the findById method to return the existing user
      jest.spyOn(service, 'findById').mockResolvedValue(existingUser as any);

      // Explicitly mock bcrypt.genSalt and bcrypt.hash
      const genSaltMock = jest
        .spyOn(bcrypt, 'genSalt')
        .mockImplementation(() => Promise.resolve('salt'));
      const hashMock = jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('hashed-new-password'));

      // Call the updateUser method
      const result = await service.updateUser(id, updateUserDto);

      // Assertions
      expect(service.findById).toHaveBeenCalledWith(id);
      expect(genSaltMock).toHaveBeenCalled();
      expect(hashMock).toHaveBeenCalledWith('new-password', 'salt');
      expect(existingUser.save).toHaveBeenCalled();
      expect(result.password).toBe('hashed-new-password');
    });
  });
});
