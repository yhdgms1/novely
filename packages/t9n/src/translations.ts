const RU = {
  'NewGame': 'Новая игра',
  'HomeScreen': 'Главный экран',
  'ToTheGame': 'К игре',
  'Language': 'Язык',
  'NoSaves': 'Сохранений нет',
  'LoadSave': 'Загрузить',
  'Saves': 'Сохранения',
  'Settings': 'Настройки',
  'Sumbit': 'Подтвердить',
  'GoBack': 'Назад',
  'DoSave': 'Сохранение',
  'Auto': 'Авто',
  'Stop': 'Стоп',
  'Exit': 'Выход',
  'Automatic': 'Автоматическое',
  'Manual': 'Ручное',
  'Remove': 'Удалить',
  'LoadASaveFrom': 'Загрузить сохранение от',
  'DeleteASaveFrom': 'Удалить сохранение от',
  'TextSpeed': 'Скорость Текста',
  'TextSpeedSlow': 'Медленная',
  'TextSpeedMedium': 'Средняя',
  'TextSpeedFast': 'Быстрая',
  'TextSpeedAuto': 'Автоматическая'
};

type BaseTranslationStrings = keyof typeof RU;

const EN: Record<BaseTranslationStrings, string> = {
  'NewGame': 'New Game',
  'HomeScreen': 'Home Screen',
  'ToTheGame': 'To the Game',
  'Language': 'Language',
  'NoSaves': 'No saves',
  'LoadSave': 'Load',
  'Saves': 'Saves',
  'Settings': 'Settings',
  'Sumbit': 'Submit',
  'GoBack': 'Go back',
  'DoSave': 'Save',
  'Auto': 'Auto',
  'Stop': 'Stop',
  'Exit': 'Exit',
  'Automatic': 'Automatic',
  'Manual': 'Manual',
  'Remove': 'Remove',
  'LoadASaveFrom': 'Load a save from',
  'DeleteASaveFrom': 'Delete a save from',
  'TextSpeed': 'Text Speed',
  'TextSpeedSlow': 'Slow',
  'TextSpeedMedium': 'Medium',
  'TextSpeedFast': 'Fast',
  'TextSpeedAuto': 'Auto'
};

export { RU, EN }
export type { BaseTranslationStrings }