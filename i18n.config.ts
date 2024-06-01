import vi from './locales/vi.json';
import en from './locales/en.json';

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  messages: {
    vi,
    en,
  }
}));
