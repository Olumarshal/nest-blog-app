import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDTO } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

import { ConfigService } from '@nestjs/config';
import { PayloadType, UserWithId } from './types';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(
    loginDTO: LoginDTO,
  ): Promise<{ accessToken: string } | { message: string }> {
    const user = (await this.userService.findOne(loginDTO)) as UserWithId;
    const passwordMatched = await bcrypt.compare(
      loginDTO.password,
      user.password,
    );

    if (passwordMatched) {
      delete user.password;
      const payload: PayloadType = { email: user.email, userId: user._id };
      const expiresIn = this.configService.get<string>('jwt_ttl');
      return {
        accessToken: this.jwtService.sign(payload, { expiresIn }),
      };
    } else {
      throw new UnauthorizedException('Password does not match');
    }
  }
}
