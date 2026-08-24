import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { Loan, LoanSchema } from '../loans/schemas/loan.schema';
import { UploadsModule } from '../uploads/uploads.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Loan.name, schema: LoanSchema },
    ]),
    UploadsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
