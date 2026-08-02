import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { I18nContext } from 'nestjs-i18n';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User, UserDocument } from './schemas/user.schema';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      throw new ConflictException(
        I18nContext.current()?.t('auth.EMAIL_ALREADY_REGISTERED'),
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.userModel.create({
      email: dto.email,
      password: hashedPassword,
      language: dto.language,
    });

    return this.signToken(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.userModel
      .findOne({ email: dto.email })
      .select('+password');
    if (!user) {
      throw new UnauthorizedException(
        I18nContext.current()?.t('auth.INVALID_CREDENTIALS'),
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        I18nContext.current()?.t('auth.INVALID_CREDENTIALS'),
      );
    }

    return this.signToken(user.id, user.email);
  }

  private signToken(userId: string, email: string) {
    const accessToken = this.jwtService.sign({ sub: userId, email });
    return { accessToken };
  }
}
