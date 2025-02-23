import type { ActionInputOnInputMeta, ChoiceCheckFunctionProps, FunctionActionProps } from './action';
import type { EngineTypes } from './types';

type ConditionParams<T> = T extends EngineTypes<any, infer $State, any, any> ? $State : never;

type ChoiceParams<T> = T extends EngineTypes<infer $Lang, infer $State, any, any>
	? ChoiceCheckFunctionProps<$Lang, $State>
	: never;

type FunctionParams<T> = T extends EngineTypes<infer $Lang, infer $State, any, any>
	? FunctionActionProps<$Lang, $State>
	: never;

type InputHandler<T> = T extends EngineTypes<infer $Lang, infer $State, any, any>
	? ActionInputOnInputMeta<$Lang, $State>
	: never;

/**
 * @example
 * ```ts
 * type Types = TypesFromEngine<typeof engine>;
 * ```
 */
type TypesFromEngine<T> = T extends {
	types: EngineTypes<infer $Lang, infer $State, infer $Data, infer $Characters> | null;
}
	? EngineTypes<$Lang, $State, $Data, $Characters>
	: never;

export type { TypesFromEngine, ConditionParams, InputHandler, FunctionParams, ChoiceParams };
