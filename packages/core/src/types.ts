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
type SaveLang = string;

type SaveMeta = [SaveDate, SaveType, SaveLang];

type Save = [Path, State, SaveMeta];

export type { Thenable, Path, Save, State }