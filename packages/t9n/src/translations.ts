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
  'TextSpeedAuto': 'Автоматическая',
  'CompleteText': 'Завершить текст',
  'GoForward': 'Перейти вперёд'
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
  'TextSpeedAuto': 'Auto',
  'CompleteText': 'Complete text',
  'GoForward': 'Go forward'
};

/**
 * Translated automatically
 */
const KK: Record<BaseTranslationStrings, string> = {
  "NewGame": "Жаңа ойын",
  "HomeScreen": "Негізгі экран",
  "ToTheGame": "Ойынға",
  "Language": "Тіл",
  "NoSaves": "Сақтау жоқ",
  "LoadSave": "Жүктеу",
  "Saves": "Сақтау",
  "Settings": "Параметрлер",
  "Sumbit": "Растау",
  "GoBack": "Артқа",
  "DoSave": "Сақтау",
  "Auto": "Авто",
  "Stop": "Тоқта",
  "Exit": "Шығу",
  "Automatic": "Автоматты",
  "Manual": "Қолмен",
  "Remove": "Жою",
  "LoadASaveFrom": "Сақтауды жүктеу",
  "DeleteASaveFrom": "Сақтауды жою",
  "TextSpeed": "Мәтін Жылдамдығы",
  "TextSpeedSlow": "Баяу",
  "TextSpeedMedium": "Орташа",
  "TextSpeedFast": "Жылдам",
  "TextSpeedAuto": "Автоматты",
  'CompleteText': 'Мәтінді аяқтау',
  'GoForward': 'Алға жылжу'
}

/**
 * Translated automatically
 */
const JP: Record<BaseTranslationStrings, string> = {
  "NewGame": "「新しいゲーム」",
  "HomeScreen": "ホーム画面",
  "ToTheGame": "「ゲームに戻る」",
  "Language": "言語",
  "NoSaves": "ノーセーブ",
  "LoadSave": "ダウンロード",
  "Saves": "保存",
  "Settings": "設定",
  "Sumbit": "確認",
  "GoBack": "「戻る」",
  "DoSave": "保存",
  "Auto": "オート",
  "Stop": "止まれ",
  "Exit": "出口",
  "Automatic": "自動",
  "Manual": "マニュアル",
  "Remove": "削除",
  "LoadASaveFrom": "ロードセーブから",
  "DeleteASaveFrom": "から保存を削除",
  "TextSpeed": "テキストスピード",
  "TextSpeedSlow": "「遅い」",
  "TextSpeedMedium": "ミディアム",
  "TextSpeedFast": "「速い」",
  "TextSpeedAuto": "自動",
  'CompleteText': 'テキストを完成させる',
  'GoForward': '先に行く'
}

export { RU, EN, KK, JP }
export type { BaseTranslationStrings }