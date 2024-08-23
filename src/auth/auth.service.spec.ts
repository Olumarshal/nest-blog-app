import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDTO } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(), // Mock the findOne method
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(), // Mock the sign method
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('1h'), // Mock the get method for jwt_ttl
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should validate user and generate JWT', async () => {
    const loginDto: LoginDTO = { email: 'test@test.com', password: 'test' };

    const user = {
      _id: 'user-id',
      email: 'test@test.com',
      password: 'hashed-password',
    };

    jest.spyOn(usersService, 'findOne').mockResolvedValue(user as any);
    jest
      .spyOn(bcrypt, 'compare')
      .mockImplementation((data, encrypted, callback) => {
        callback(null, true); // Simulates successful password comparison
      });
    jest.spyOn(jwtService, 'sign').mockReturnValue('signed-jwt-token');

    const result = await authService.login(loginDto);

    expect(result).toHaveProperty('accessToken', 'signed-jwt-token');
    expect(usersService.findOne).toHaveBeenCalledWith(loginDto);
    expect(bcrypt.compare).toHaveBeenCalledWith(
      'test',
      'hashed-password',
      expect.any(Function),
    );
    expect(jwtService.sign).toHaveBeenCalledWith(
      { email: 'test@test.com', userId: 'user-id' },
      { expiresIn: '1h' },
    );
  });

  it('should throw UnauthorizedException if password does not match', async () => {
    const loginDto: LoginDTO = {
      email: 'test@test.com',
      password: 'wrong-password',
    };

    const user = {
      _id: 'user-id',
      email: 'test@test.com',
      password: 'hashed-password',
    };

    jest.spyOn(usersService, 'findOne').mockResolvedValue(user as any);
    jest
      .spyOn(bcrypt, 'compare')
      .mockImplementation((data, encrypted, callback) => {
        callback(null, false); // Simulates unsuccessful password comparison
      });

    await expect(authService.login(loginDto)).rejects.toThrow(
      'Password does not match',
    );
  });
});
