import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Model } from 'mongoose';
import { I18nContext } from 'nestjs-i18n';
import { MailService } from '../mail/mail.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { User, UserDocument } from './schemas/user.schema';

const SALT_ROUNDS = 10;
const RESET_CODE_EXPIRES_MS = 10 * 60 * 1000;
const MAX_RESET_CODE_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      throw new ConflictException(
        I18nContext.current()?.t('auth.EMAIL_ALREADY_REGISTERED'),
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    await this.userModel.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      language: dto.language,
      balance: dto.balance ?? 0,
      currency: dto.currency,
    });

    return { message: I18nContext.current()?.t('auth.REGISTER_SUCCESS') };
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

    user.lastLoginAt = new Date();
    await user.save();

    const tokens = await this.issueTokens(user.id, user.email);
    return {
      message: I18nContext.current()?.t('auth.LOGIN_SUCCESS'),
      data: { user, ...tokens },
    };
  }

  async refresh(dto: RefreshTokenDto) {
    let payload: { sub: string };
    try {
      payload = await this.jwtService.verifyAsync<{ sub: string }>(
        dto.refreshToken,
        { secret: this.configService.get<string>('JWT_REFRESH_SECRET') },
      );
    } catch {
      throw new UnauthorizedException(
        I18nContext.current()?.t('auth.INVALID_REFRESH_TOKEN'),
      );
    }

    const user = await this.userModel
      .findById(payload.sub)
      .select('+refreshToken');

    const providedTokenHash = this.hashToken(dto.refreshToken);
    if (!user?.refreshToken || user.refreshToken !== providedTokenHash) {
      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }
      throw new UnauthorizedException(
        I18nContext.current()?.t('auth.INVALID_REFRESH_TOKEN'),
      );
    }

    const tokens = await this.issueTokens(user.id, user.email);
    return {
      message: I18nContext.current()?.t('auth.TOKEN_REFRESHED'),
      data: tokens,
    };
  }

  async logout(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      $unset: { refreshToken: 1 },
    });
    return { message: I18nContext.current()?.t('auth.LOGOUT_SUCCESS') };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (user) {
      const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
      user.passwordResetCode = this.hashToken(code);
      user.passwordResetExpires = new Date(Date.now() + RESET_CODE_EXPIRES_MS);
      user.passwordResetAttempts = 0;
      user.passwordResetVerified = false;
      await user.save();
      await this.mailService.sendPasswordResetCodeEmail(
        user.email,
        user.name,
        code,
        user.language,
      );
    }

    return {
      message: I18nContext.current()?.t('auth.PASSWORD_RESET_EMAIL_SENT'),
    };
  }

  async verifyResetCode(dto: VerifyResetCodeDto) {
    const user = await this.userModel
      .findOne({ email: dto.email })
      .select(
        '+passwordResetCode +passwordResetExpires +passwordResetAttempts',
      );

    if (
      !user ||
      !user.passwordResetCode ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      throw new BadRequestException(
        I18nContext.current()?.t('auth.INVALID_OR_EXPIRED_CODE'),
      );
    }

    if ((user.passwordResetAttempts ?? 0) >= MAX_RESET_CODE_ATTEMPTS) {
      throw new BadRequestException(
        I18nContext.current()?.t('auth.TOO_MANY_ATTEMPTS'),
      );
    }

    if (this.hashToken(dto.code) !== user.passwordResetCode) {
      user.passwordResetAttempts = (user.passwordResetAttempts ?? 0) + 1;
      await user.save();
      throw new BadRequestException(
        I18nContext.current()?.t('auth.INVALID_CODE'),
      );
    }

    user.passwordResetVerified = true;
    await user.save();

    return { message: I18nContext.current()?.t('auth.CODE_VERIFIED') };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userModel.findOne({
      email: dto.email,
      passwordResetVerified: true,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException(
        I18nContext.current()?.t('auth.INVALID_OR_EXPIRED_CODE'),
      );
    }

    user.password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetAttempts = 0;
    user.passwordResetVerified = false;
    user.refreshToken = undefined;
    await user.save();

    return { message: I18nContext.current()?.t('auth.PASSWORD_RESET_SUCCESS') };
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async issueTokens(userId: string, email: string) {
    const accessToken = this.jwtService.sign({ sub: userId, email });
    const refreshToken = this.jwtService.sign(
      { sub: userId, jti: crypto.randomUUID() },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      } as JwtSignOptions,
    );

    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken: this.hashToken(refreshToken),
    });

    return { accessToken, refreshToken };
  }
}
