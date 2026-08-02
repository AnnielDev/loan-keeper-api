import { Currency } from '../auth/schemas/user.schema';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: Currency.USD, symbol: '$' },
  { code: Currency.EUR, symbol: '€' },
  { code: Currency.DOP, symbol: 'RD$' },
  { code: Currency.MXN, symbol: '$' },
  { code: Currency.COP, symbol: '$' },
  { code: Currency.ARS, symbol: '$' },
  { code: Currency.PEN, symbol: 'S/' },
  { code: Currency.CLP, symbol: '$' },
  { code: Currency.GTQ, symbol: 'Q' },
  { code: Currency.HNL, symbol: 'L' },
  { code: Currency.GBP, symbol: '£' },
  { code: Currency.JPY, symbol: '¥' },
  { code: Currency.CAD, symbol: 'CA$' },
  { code: Currency.AUD, symbol: 'AU$' },
  { code: Currency.BRL, symbol: 'R$' },
  { code: Currency.CNY, symbol: '¥' },
  { code: Currency.CHF, symbol: 'CHF' },
];
