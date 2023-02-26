const RU = {
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
};

const EN = {
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
};

const JP = {
  'NewGame': '新しいゲーム',
  'HomeScreen': 'ホーム画面',
  'ToTheGame': 'ゲームへ',
  'Language': '言語',
  'AtTheMomentTheSavesAre': '現在のセーブは',
  'NoSaves': 'セーブがありません',
  'LoadSave': 'ロード',
  'Saves': 'セーブ',
  'Settings': '設定',
  'Sumbit': '提出する',
  'GoBack': '戻る',
  'DoSave': 'セーブする',
  'Auto': 'オート',
  'Stop': '停止',
  'Exit': '終了する',
  'Automatic': '自動',
  'Manual': '手動',
  'Remove': '削除する',
  'LoadASaveFrom': 'からセーブを読み込む',
  'DeleteASaveFrom': 'からセーブを削除する',
};

type BaseTranslationStrings = keyof typeof RU;

export { RU, EN, JP }
export type { BaseTranslationStrings }