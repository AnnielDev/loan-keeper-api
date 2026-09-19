import { Language } from '../auth/schemas/user.schema';

export interface LanguageInfo {
  code: Language;
  name: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: Language.EN, name: 'English' },
  { code: Language.ES, name: 'Español' },
];
