const RU = {
  'NewGame': 'Новая игра',
  'HomeScreen': 'Главный экран',
  'ToTheGame': 'К игре',
  'Language': 'Язык',
  'AtTheMomentTheSavesAre': 'В данный момент сохранения',
  'NoSaves': 'Сохранений нет',
  'LoadSave': 'Загрузить',
  'Saves': 'Сохранения',
  'Settings': 'Настройки'
} as const;

type BaseTranslationStrings = keyof typeof RU;

export { RU }
export type { BaseTranslationStrings }