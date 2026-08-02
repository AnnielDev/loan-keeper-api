import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { I18nContext } from 'nestjs-i18n';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { Customer, CustomerDocument } from './schemas/customer.schema';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  create(dto: CreateCustomerDto, userId: string) {
    return this.customerModel.create({ ...dto, registeredBy: userId });
  }

  findAll() {
    return this.customerModel.find().sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const customer = await this.customerModel.findById(id);
    if (!customer) {
      throw new NotFoundException(
        I18nContext.current()?.t('customers.CUSTOMER_NOT_FOUND'),
      );
    }
    return customer;
  }

  findByUser(userId: string) {
    return this.customerModel
      .find({ registeredBy: userId })
      .sort({ createdAt: -1 });
  }

  count() {
    return this.customerModel.countDocuments();
  }
}
