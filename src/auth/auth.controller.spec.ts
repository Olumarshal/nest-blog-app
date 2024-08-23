import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { CreateUserDTO } from 'src/users/dto/create-user.dto';
// import { User } from 'src/users/schemas/user.schema';
import { LoginDTO } from './dto/login.dto';

import { mock } from 'mongoose-mock';
import { ObjectId } from 'mongodb';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let userService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    userService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a new user', async () => {
    const userDTO: CreateUserDTO = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@test.com',
      password: 'testpassword',
    };

    const user = mock('User', {
      _id: new ObjectId(),
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@test.com',
      password: 'hashedpassword',
    });

    jest.spyOn(userService, 'create').mockResolvedValue(user);

    const result = await controller.signup(userDTO);

    expect(userService.create).toHaveBeenCalledWith(userDTO);
    expect(result).toEqual(user);
  });

  describe('login', () => {
    it('should login a user and return an access token', async () => {
      const loginDTO: LoginDTO = {
        email: 'test@test.com',
        password: 'testpassword',
      };
      const accessToken = 'jwt-access-token';

      jest.spyOn(authService, 'login').mockResolvedValue({ accessToken });

      const result = await controller.login(loginDTO);

      expect(authService.login).toHaveBeenCalledWith(loginDTO);
      expect(result).toEqual({ accessToken });
    });
  });
});
