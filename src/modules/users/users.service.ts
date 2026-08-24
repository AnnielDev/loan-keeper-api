import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { I18nContext } from 'nestjs-i18n';
import { User, UserDocument } from '../auth/schemas/user.schema';
import {
  Customer,
  CustomerDocument,
} from '../customers/schemas/customer.schema';
import { Loan, LoanDocument } from '../loans/schemas/loan.schema';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Loan.name) private loanModel: Model<LoanDocument>,
    private readonly uploadsService: UploadsService,
  ) {}

  async deleteAccount(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(
        I18nContext.current()?.t('settings.USER_NOT_FOUND'),
      );
    }

    const loans = await this.loanModel.find({ registeredBy: userId });
    const receiptUrls = loans.flatMap((loan) =>
      loan.installments.map((installment) => installment.receiptUrl),
    );
    await this.uploadsService.removeMany(receiptUrls);
    await this.loanModel.deleteMany({ registeredBy: userId });

    const customers = await this.customerModel.find({ registeredBy: userId });
    const customerFileUrls = customers.flatMap((customer) => [
      customer.avatarUrl,
      ...customer.documentUrls,
    ]);
    await this.uploadsService.removeMany(customerFileUrls);
    await this.customerModel.deleteMany({ registeredBy: userId });

    await this.userModel.deleteOne({ _id: userId });

    return { message: I18nContext.current()?.t('users.ACCOUNT_DELETED') };
  }
}
