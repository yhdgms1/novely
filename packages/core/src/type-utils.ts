import type { ActionInputOnInputMeta, FunctionActionProps, ChoiceCheckFunctionProps } from './action'
import type { TypeEssentials } from './types';

type ConditionParams<T> = T extends TypeEssentials<any, infer $State, any, any> ? $State : never;

type ChoiceParams<T> = T extends TypeEssentials<infer $Lang, infer $State, any, any> ? ChoiceCheckFunctionProps<$Lang, $State> : never;

type FunctionParams<T> = T extends TypeEssentials<infer $Lang, infer $State, any, any> ? FunctionActionProps<$Lang, $State> : never;

type InputHandler<T> = T extends TypeEssentials<infer $Lang, infer $State, any, any> ? ActionInputOnInputMeta<$Lang, $State> : never;

export type { ConditionParams, InputHandler, FunctionParams, ChoiceParams }
