import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.authService.createUser(createUserDto);
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
