import { Language } from '../auth/schemas/user.schema';

export interface LanguageInfo {
  code: Language;
  name: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: Language.EN, name: 'English' },
  { code: Language.ES, name: 'Español' },
  { code: Language.ZH, name: '中文' },
  { code: Language.HI, name: 'हिन्दी' },
  { code: Language.FR, name: 'Français' },
];
