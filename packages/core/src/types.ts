type Thenable<T> = T | Promise<T>;

type PathItem = [null, number | string] | ['choice' & Record<never, never>, number] | ['condition' & Record<never, never>, string];
type Path = PathItem[];

/**
 * Значения, которые можно сохранить в `state`.
 */
type StateValues = null | string | number | boolean | StateValues[] | { [name: string]: StateValues };
type State = Record<string, StateValues>;

type SaveDate = number;
type SaveType = "manual" | "auto";

type SaveMeta = [SaveDate, SaveType];

type Save = [Path, State, SaveMeta];

type Lang = string;
type StorageMeta = [Lang]

type StorageData = {
  saves: Save[];
  meta: StorageMeta;
}

type Stack = {
  value: Save;
  back(): void;
  push(value: Save): void;
  clear(): void;
}

export type { Thenable, Path, Save, State, Stack, StorageData }