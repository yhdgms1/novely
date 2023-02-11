type Thenable<T> = T | Promise<T>;


type PathItem = [null, number | string] | ['choice' & Record<never, never>, number] | ['condition' & Record<never, never>, string];
type Path = PathItem[];

export type { Thenable, Path }