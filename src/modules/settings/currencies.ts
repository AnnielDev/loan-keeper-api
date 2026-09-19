import { Currency } from '../auth/schemas/user.schema';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
}

// Only currencies whose standard formatting uses comma thousands separators
// and a dot decimal separator with 2 decimals (e.g. 1,000,000.00) are kept.
export const CURRENCIES: CurrencyInfo[] = [
  { code: Currency.USD, symbol: '$' },
  { code: Currency.DOP, symbol: 'RD$' },
  { code: Currency.MXN, symbol: '$' },
  { code: Currency.PEN, symbol: 'S/' },
  { code: Currency.GTQ, symbol: 'Q' },
  { code: Currency.HNL, symbol: 'L' },
  { code: Currency.GBP, symbol: '£' },
  { code: Currency.CAD, symbol: 'CA$' },
  { code: Currency.AUD, symbol: 'AU$' },
  { code: Currency.CNY, symbol: '¥' },
];
