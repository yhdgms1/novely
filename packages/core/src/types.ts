type Thenable<T> = T | Promise<T>;

type PathItem =
  | [null, number | string]
  | ["choice" & Record<never, never>, number]
  | ["condition" & Record<never, never>, string]
  | ["exit" & Record<never, never>];
type Path = PathItem[];

type State = Record<string, any>;
type Data = Record<string, any>;

type SaveDate = number;
type SaveType = "manual" | "auto";

type SaveMeta = [SaveDate, SaveType];

type Save = [Path, State, SaveMeta];

type Lang = string;
type TypewriterSpeed = "Slow" | "Medium" | "Fast" | "Auto" | (string & {});
type StorageMeta = [Lang, TypewriterSpeed];

type Migration = (save: unknown) => unknown;

type StorageData = {
  saves: Save[];
  data: Data;
  meta: StorageMeta;
};

type Stack = {
  value: Save;
  back(): void;
  push(value: Save): void;
  clear(): void;
};

type NovelyScreen = "mainmenu" | "game" | "saves" | "settings";

/**
 * @see https://pendletonjones.com/deep-partial
 */
type DeepPartial<T> = unknown extends T
  ? T
  : T extends object
  ? {
      [P in keyof T]?: T[P] extends Array<infer U>
        ? Array<DeepPartial<U>>
        : T[P] extends ReadonlyArray<infer U>
        ? ReadonlyArray<DeepPartial<U>>
        : DeepPartial<T[P]>;
    }
  : T;

export type {
  Thenable,
  Path,
  Save,
  State,
  Stack,
  StorageData,
  StorageMeta,
  TypewriterSpeed,
  Lang,
  DeepPartial,
  NovelyScreen,
  Migration,
  Data,
};
