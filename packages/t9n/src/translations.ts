type Mark<T extends Record<string, string>> = {
  [Key in keyof T as `internal:${string & Key}`]: T[Key];
}

type Unmark<T extends Record<string, string>> = {
  [Key in keyof T as Key extends `internal:${infer Name}` ? Name & string : never]: T[Key];
}

const { entries, fromEntries } = Object;

/**
 * Marks keys with `internal:` prefix
 */
const mark = <T extends Record<string, string>>(values: T): Mark<T> => {
  return fromEntries(entries(values).map(([key, value]) => [`internal:${key}`, value])) as Mark<T>;
}

const RU = mark({
  'NewGame': 'Новая игра',
  'HomeScreen': 'Главный экран',
  'ToTheGame': 'К игре',
  'Language': 'Язык',
  'AtTheMomentTheSavesAre': 'В данный момент сохранения',
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
});

const EN = mark({
  'NewGame': 'New Game',
  'HomeScreen': 'Home Screen',
  'ToTheGame': 'To the Game',
  'Language': 'Language',
  'AtTheMomentTheSavesAre': 'At the moment, the saves are',
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
});

type BaseTranslationStrings = keyof typeof RU;

export { RU, EN }
export type { BaseTranslationStrings, Mark, Unmark }