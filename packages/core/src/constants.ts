import type { Save } from './types'
import { createI18N, self } from '@novely/i18n';

const USER_ACTION_REQUIRED_ACTIONS = new Set([
  'dialog',
  'input'
]);

const DEFAULT_SAVE: Save = [[[null, 'start'], [null, 0]], {}, [Date.now(), 'auto', 'ru']];

const DEFAULT_TRANSLATION = createI18N(
  {
    ru: {}
  },
  {
    ru: {
      'Новая игра': self,
      Load: 'Загрузить',
      Saves: 'Сохранения',
      Back: 'Назад',
      // Auto: 'Авто',
      Automatic: 'Автоматическое',
      Manual: 'Ручное',
      Remove: 'Удалить'
    }
  }
);

export { USER_ACTION_REQUIRED_ACTIONS, DEFAULT_SAVE, DEFAULT_TRANSLATION }