import type { ActionInputOnInputMeta } from './action'
import type { TypeEssentials } from './types';

type ConditionParams<T> = T extends TypeEssentials<any, infer $State, any, any> ? $State : never;

type InputHandler<T> = T extends TypeEssentials<infer $Lang, infer $State, any, any> ? ActionInputOnInputMeta<$Lang, $State> : never;

export type { ConditionParams, InputHandler }
