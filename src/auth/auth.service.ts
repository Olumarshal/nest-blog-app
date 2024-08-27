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

    if (!passwordMatched) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: PayloadType = { email: user.email, userId: user._id };
    const expiresIn = this.configService.get<string>('jwt_ttl');

    const accessToken = this.jwtService.sign(payload, { expiresIn });
    return { accessToken };
  }
}
