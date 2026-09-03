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
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { Model } from 'mongoose';
import { I18nContext } from 'nestjs-i18n';
import { MailService } from '../mail/mail.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleSignInDto } from './dto/google-signin.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import {
  PendingUser,
  PendingUserDocument,
} from './schemas/pending-user.schema';
import { Language, User, UserDocument } from './schemas/user.schema';

const SALT_ROUNDS = 10;
const RESET_CODE_EXPIRES_MS = 10 * 60 * 1000;
const MAX_RESET_CODE_ATTEMPTS = 5;
const VERIFICATION_CODE_EXPIRES_MS = 10 * 60 * 1000;
const MAX_VERIFICATION_ATTEMPTS = 5;
const TRIAL_DURATION_MS = 15 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly googleOAuthClient: OAuth2Client;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PendingUser.name)
    private pendingUserModel: Model<PendingUserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {
    this.googleOAuthClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_SIGNIN_CLIENT_ID'),
    );
  }

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      throw new ConflictException(
        I18nContext.current()?.t('auth.EMAIL_ALREADY_REGISTERED'),
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const language = dto.language ?? Language.EN;
    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.pendingUserModel.findOneAndUpdate(
      { email: dto.email },
      {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        language,
        balance: dto.balance ?? 0,
        currency: dto.currency,
        code: this.hashToken(code),
        codeExpires: new Date(Date.now() + VERIFICATION_CODE_EXPIRES_MS),
        attempts: 0,
        expiresAt: new Date(),
      },
      { upsert: true },
    );
    await this.mailService.sendEmailVerificationCode(
      dto.email,
      dto.name,
      code,
      language,
    );

    return {
      message: I18nContext.current()?.t('auth.EMAIL_VERIFICATION_SENT'),
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const pending = await this.pendingUserModel
      .findOne({ email: dto.email })
      .select('+password +code +codeExpires +attempts');

    if (!pending || !pending.codeExpires || pending.codeExpires < new Date()) {
      throw new BadRequestException(
        I18nContext.current()?.t('auth.INVALID_OR_EXPIRED_CODE'),
      );
    }

    if ((pending.attempts ?? 0) >= MAX_VERIFICATION_ATTEMPTS) {
      throw new BadRequestException(
        I18nContext.current()?.t('auth.TOO_MANY_ATTEMPTS'),
      );
    }

    if (this.hashToken(dto.code) !== pending.code) {
      pending.attempts = (pending.attempts ?? 0) + 1;
      await pending.save();
      throw new BadRequestException(
        I18nContext.current()?.t('auth.INVALID_CODE'),
      );
    }

    let user: UserDocument;
    try {
      user = await this.userModel.create({
        email: pending.email,
        password: pending.password,
        name: pending.name,
        language: pending.language,
        balance: pending.balance,
        currency: pending.currency,
        trialEndsAt: new Date(Date.now() + TRIAL_DURATION_MS),
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException(
          I18nContext.current()?.t('auth.EMAIL_ALREADY_REGISTERED'),
        );
      }
      throw error;
    }
    await this.pendingUserModel.deleteOne({ _id: pending._id });

    user.lastLoginAt = new Date();
    await user.save();

    const tokens = await this.issueTokens(user.id, user.email);
    return {
      message: I18nContext.current()?.t('auth.REGISTER_SUCCESS'),
      data: { user, ...tokens },
    };
  }

  async resendVerificationCode(dto: ResendVerificationDto) {
    const pending = await this.pendingUserModel.findOne({
      email: dto.email,
    });
    if (pending) {
      const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
      pending.code = this.hashToken(code);
      pending.codeExpires = new Date(Date.now() + VERIFICATION_CODE_EXPIRES_MS);
      pending.attempts = 0;
      await pending.save();
      await this.mailService.sendEmailVerificationCode(
        pending.email,
        pending.name,
        code,
        pending.language,
      );
    }

    return {
      message: I18nContext.current()?.t('auth.EMAIL_VERIFICATION_SENT'),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel
      .findOne({ email: dto.email })
      .select('+password');
    const hashedPassword = user?.password;
    if (!user || !hashedPassword) {
      throw new UnauthorizedException(
        I18nContext.current()?.t('auth.INVALID_CREDENTIALS'),
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, hashedPassword);
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

  async signInWithGoogle(dto: GoogleSignInDto) {
    let payload: TokenPayload | undefined;
    try {
      const ticket = await this.googleOAuthClient.verifyIdToken({
        idToken: dto.idToken,
        audience: this.configService.get<string>('GOOGLE_SIGNIN_CLIENT_ID'),
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException(
        I18nContext.current()?.t('auth.INVALID_GOOGLE_TOKEN'),
      );
    }

    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException(
        I18nContext.current()?.t('auth.INVALID_GOOGLE_TOKEN'),
      );
    }

    let user = await this.userModel
      .findOne({ $or: [{ googleId: payload.sub }, { email: payload.email }] })
      .select('+googleId');

    if (!user) {
      user = await this.userModel.create({
        email: payload.email,
        name: payload.name ?? payload.email,
        googleId: payload.sub,
        trialEndsAt: new Date(Date.now() + TRIAL_DURATION_MS),
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      await user.save();
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
