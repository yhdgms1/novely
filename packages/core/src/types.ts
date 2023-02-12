type Thenable<T> = T | Promise<T>;

type PathItem = [null, number | string] | ['choice' & Record<never, never>, number] | ['condition' & Record<never, never>, string];
type Path = PathItem[];

/**
 * Значения, которые можно сохранить в `state`.
 * todo: Может, можно позволить Storage решать какие значения может принимать StateValues
 */
type StateValues = null | string | number | boolean | StateValues[] | { [name: string]: StateValues };
type State = Record<string, StateValues>;

type SaveDate = number;
type SaveType = "manual" | "auto";

type SaveMeta = [SaveDate, SaveType];

type Save = [Path, State, SaveMeta]

export type { Thenable, Path, Save, State }