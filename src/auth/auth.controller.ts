/**
 * Auth Controller
 */
import {
  Body,
  ConflictException,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-dto';
import { SignUpDto } from './dto/signup-dto';
import { User } from './schema/user.schema';
import { CheckEmailDto } from './dto/check-email.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Signup Route
   * @param signupDto
   * @returns {Object}
   */
  @Post('/signup')
  signup(
    @Body() signupDto: SignUpDto,
  ): Promise<{ access_token: string; expires_in: string }> {
    return this.authService.signup(signupDto);
  }

  /**
   * Login Route
   * @param loginDto
   * @returns {Object}
   */
  @Post('/login')
  login(
    @Body() loginDto: LoginDto,
  ): Promise<{ access_token: string; expires_in: string }> {
    return this.authService.login(loginDto);
  }

  /**
   * Find User by ID Route
   * @param id
   * @returns {User}
   */

  @Get('/user/:id')
  async findUserById(@Param('id') id: string): Promise<User> {
    console.log('here controller', id);

    try {
      const user = await this.authService.findUserById(id);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve user');
    }
  }

  @Post('/check-email')
  async checkDuplicateEmail(
    @Body() checkEmailDto: CheckEmailDto,
  ): Promise<{ isDuplicate: boolean }> {
    const isDuplicate = await this.authService.checkDuplicateEmail(
      checkEmailDto.email,
    );

    if (isDuplicate) {
      throw new ConflictException('Email is already in use');
    }

    return { isDuplicate: false };
  }
}
