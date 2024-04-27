import type { Character } from './character';
import type {
  ActionProxy,
  ConditionCheckFunction,
} from './action';
import type { Lang } from './types';

type ConditionParams<T> = T extends ActionProxy<Record<string, Character>, Lang, infer $State> ? Parameters<ConditionCheckFunction<$State, string | boolean>>[0] : never;

export type { ConditionParams }
