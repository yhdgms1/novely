import type { TypeEssentials } from './types';

type ConditionParams<T> = T extends TypeEssentials<any, infer $State, any, any> ? $State : never;

export type { ConditionParams }
