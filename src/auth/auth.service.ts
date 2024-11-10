import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
  } from '@nestjs/common';
  import { SignupDto } from './dtos/signup.dto';
  import { InjectModel } from '@nestjs/mongoose';
  import { User } from './schemas/user.schema';
  import mongoose, { Model } from 'mongoose';
  import * as bcrypt from 'bcrypt';
  import { LoginDto } from './dtos/login.dto';
  import { JwtService } from '@nestjs/jwt';
  import { RefreshToken } from './schemas/refresh-token.schema';
  import { v4 as uuidv4 } from 'uuid';
  import { nanoid } from 'nanoid';
  import { ResetToken } from './schemas/reset-token.schema';
  
  @Injectable()
  export class AuthService {
    constructor(
      @InjectModel(User.name) private UserModel: Model<User>,
      @InjectModel(RefreshToken.name)
      private RefreshTokenModel: Model<RefreshToken>,
      @InjectModel(ResetToken.name)
      private ResetTokenModel: Model<ResetToken>,
      private jwtService: JwtService,
    ) {}
  
    async signup(signupData: SignupDto) {
      const { email, password, name } = signupData;
  
      const emailInUse = await this.UserModel.findOne({
        email,
      });
      if (emailInUse) {
        throw new BadRequestException('Email already in use');
      }
      const hashedPassword = await bcrypt.hash(password, 10);
  
      await this.UserModel.create({
        name,
        email,
        password: hashedPassword,
      });
      return { message: 'User Created Successfully' }
    }
  
    async login(credentials: LoginDto) {
      const { email, password } = credentials;
      const user = await this.UserModel.findOne({ email });
      if (!user) {
        throw new UnauthorizedException('Wrong credentials');
      }
  
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        throw new UnauthorizedException('Wrong credentials');
      }
  
      const tokens = await this.generateUserTokens(user._id);
      return {
        ...tokens,
        userId: user._id,
      };
    }
  
    async changePassword(userId, oldPassword: string, newPassword: string) {
      const user = await this.UserModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found...');
      }
  
      const passwordMatch = await bcrypt.compare(oldPassword, user.password);
      if (!passwordMatch) {
        throw new UnauthorizedException('Wrong credentials');
      }
  
      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = newHashedPassword;
      await user.save();
      return { message: 'Password changed'}
    }
  
    async forgotPassword(email: string) {
      const user = await this.UserModel.findOne({ email });
  
      if (user) {
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 1);
  
        const resetToken = nanoid(64);
        await this.ResetTokenModel.create({
          token: resetToken,
          userId: user._id,
          expiryDate,
        });
      }
  
      return { message: 'If this user exists, they will receive an email' };
    }
  
    async resetPassword(newPassword: string, resetToken: string) {
      const token = await this.ResetTokenModel.findOneAndDelete({
        token: resetToken,
        expiryDate: { $gte: new Date() },
      });
  
      if (!token) {
        throw new UnauthorizedException('Invalid link');
      }
  
      const user = await this.UserModel.findById(token.userId);
      if (!user) {
        throw new InternalServerErrorException();
      }
  
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
    }
  
    async refreshTokens(refreshToken: string) {
      const token = await this.RefreshTokenModel.findOne({
        token: refreshToken,
        expiryDate: { $gte: new Date() },
      });
  
      if (!token) {
        throw new UnauthorizedException('Refresh Token is invalid');
      }
      return this.generateUserTokens(token.userId);
    }
  
    async generateUserTokens(userId) {
      const accessToken = this.jwtService.sign({ userId }, { expiresIn: '10h' });
      const refreshToken = uuidv4();
  
      await this.storeRefreshToken(refreshToken, userId);
      return {
        accessToken,
        refreshToken,
      };
    }
  
    async storeRefreshToken(token: string, userId: string) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 3);
  
      await this.RefreshTokenModel.updateOne(
        { userId },
        { $set: { expiryDate, token } },
        {
          upsert: true,
        },
      );
    }
  
    async getUserPermissions(userId: string) {
      const user = await this.UserModel.findById(userId);
      if (!user) throw new BadRequestException();
      return true;
    }
  }