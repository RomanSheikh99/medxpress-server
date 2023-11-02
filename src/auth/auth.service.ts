/**
 * @module AuthService
 * @description Service for managing authentication.
 */
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { LoginDto } from './dto/login-dto';
import { SignUpDto } from './dto/signup-dto';
import { User } from './schema/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * @description Signup Route
   * @param signupDto - The DTO for user signup.
   * @returns {Object} - An object containing an access token and expiration time.
   */
  async signup(
    signupDto: SignUpDto,
  ): Promise<{ access_token: string; expires_in: string }> {
    const { firstName, lastName, postalCode, email, password, address, role } =
      signupDto;

    // Check if a user with the provided email already exists
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Continue with user creation if email is not in use
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({
      firstName,
      lastName,
      postalCode,
      email,
      password: hashedPassword,
      address,
      role,
    });

    const access_token = this.jwtService.sign({
      id: user._id,
    });

    const expires_in = process.env.JWT_EXPIRES_IN;

    return { access_token, expires_in };
  }

  /**
   * @description Login Route
   * @param loginDto - The DTO for user login.
   * @returns {Object} - An object containing an access token and expiration time.
   */
  async login(
    loginDto: LoginDto,
  ): Promise<{ access_token: string; expires_in: string }> {
    // extract data
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password!');
    }

    const passwordMatched = await bcrypt.compare(password, user.password);

    if (!passwordMatched) {
      throw new UnauthorizedException('Invalid email or password!');
    }

    // assign jwt to user
    const access_token = this.jwtService.sign({
      id: user._id,
    });

    const expires_in = process.env.JWT_EXPIRES_IN;

    // return the token to client
    return { access_token, expires_in };
  }

  /**
   * @description Find User by ID Route
   * @param id - The ID of the user to find.
   * @returns {User|null} - The user with the specified ID or null if not found.
   */
  async findUserById(id: string): Promise<User | null> {
    try {
      const user = await this.userModel.findById(id).exec();
      return user;
    } catch (error) {
      throw new UnauthorizedException('User not found');
    }
  }

  /**
   * @description Check for Duplicate Email
   * @param email - The email to check for duplication.
   * @returns {boolean} - Indicates whether the email is a duplicate.
   */
  async checkDuplicateEmail(email: string): Promise<boolean> {
    try {
      const user = await this.userModel.findOne({ email }).exec();
      return !!user; // Return true if a user with this email already exists
    } catch (error) {
      throw new NotFoundException('Failed to check for duplicate email');
    }
  }
}
