import type { Character, Data, Lang, NovelyAsset, State, TypeEssentials, ValidAction } from '@novely/core';

type Attributes<BaseKeys extends string = string> = Record<
	string,
	Record<string, Record<BaseKeys, NovelyAsset | NovelyAsset[]>>
>;

type EmotionsDefinition<BaseKeys extends string, Attribs extends Attributes<BaseKeys>> = {
	base: Record<BaseKeys, NovelyAsset | NovelyAsset[]>;
	attributes: Attribs;
	pricing?: {
		[Attribute in keyof Attribs]: Record<keyof Attribs[Attribute], number>;
	};
};

/**
 * Utilities
 *
 * https://stackoverflow.com/a/55128956
 * https://blog.beraliv.dev/2021-05-30-permutations-in-typescript
 * https://twitter.com/mattpocockuk/status/1622730173446557697
 */
type Permutation<T, K = T> = [T] extends [never]
	? []
	: K extends unknown
		? [K, ...Permutation<Exclude<T, K>>]
		: never;

type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

/** Types */

type GetAttributeVariants<Attribs extends Attributes, Attribute extends string> = {
	[Variant in keyof Attribs[Attribute] & string]: `${Attribute & string}_${Variant}`;
}[keyof Attribs[Attribute] & string];

type GetAttributesTuple<Attribs extends Attributes> = Permutation<keyof Attribs>;

type GetAttributesVariants<Attribs extends Attributes, T extends unknown[]> = T extends [
	infer First,
	...infer Rest,
]
	? First extends string
		? [Permutation<GetAttributeVariants<Attribs, First>>, ...GetAttributesVariants<Attribs, Rest>]
		: never
	: [];

type CombineAttributes<T extends any[], Prefix extends string = ''> = T extends [infer First, ...infer Rest]
	? First extends string[]
		? Rest extends any[]
			? CombineAttributes<Rest, `${Prefix}${First[number]}__`>
			: never
		: never
	: Prefix extends `${infer Result}__`
		? Result
		: never;

type AddBase<BaseKeys extends string, Attributes extends string> = `${BaseKeys}@${Attributes}`;

type GenerateEmotions<BaseKeys extends string, Attribs extends Attributes<BaseKeys>> = AddBase<
	BaseKeys,
	CombineAttributes<GetAttributesVariants<Attribs, GetAttributesTuple<Attribs>>>
>;

type GeneratedEmotions<BaseKeys extends string, Attribs extends Attributes<BaseKeys>> = Prettify<
	Record<GenerateEmotions<BaseKeys, Attribs>, NovelyAsset[]>
>;

type ClothingData<BaseKeys extends string, Attribs extends Attributes<BaseKeys>> = {
	base: BaseKeys[];
	attributes: {
		[Attribute in keyof Attribs]: (keyof Attribs[Attribute] & string)[];
	};
	pricing?: {
		[Attribute in keyof Attribs]: Record<keyof Attribs[Attribute], number>;
	};
};

type CreateActionsFN<BaseKeys extends string, Attribs extends Attributes<BaseKeys>> = {
	<Engine extends EngineInstance>(
		engine: Engine,
		options: AllOptions<NoInfer<Engine['typeEssentials']>, NoInfer<BaseKeys>, NoInfer<Attribs>>,
	): {
		showBasePicker: (options?: ShowPickerOptionsBase) => ValidAction;
		showAttributePicker: (options: ShowPickerOptionsAttribute<Attribs>) => ValidAction;
		showCharacter: () => ValidAction;
	};
};

type EmotionsResult<BaseKeys extends string, Attribs extends Attributes<BaseKeys>> = {
	emotions: GeneratedEmotions<BaseKeys, Attribs>;
	createActions: CreateActionsFN<BaseKeys, Attribs>;
};

type Entries<T> = T extends Record<infer T, infer K> ? [T, K][] : never;

type DefaultTypeEssentials = TypeEssentials<Lang, State, Data, Record<string, Character>>;

type AllOptions<
	TE extends DefaultTypeEssentials,
	BaseKeys extends string,
	Attribs extends Attributes<BaseKeys>,
> = {
	/**
	 * Character ID
	 */
	character: string;
	/**
	 * Default style base
	 */
	defaultBase: BaseKeys;
	/**
	 * Default style attributes
	 */
	defaultAttributes: {
		[Attribute in keyof Attribs]: keyof Attribs[Attribute] & string;
	};
	/**
	 * Translation
	 */
	translation: {
		[Language in NonNullable<TE['l']>]: {
			/**
			 * Attribute items translations
			 */
			attributes: {
				[Attribute in keyof Attribs]: {
					[Variant in keyof Attribs[Attribute]]: string;
				};
			};
			/**
			 * Base translations
			 */
			base: {
				[Base in BaseKeys]: string;
			};
			/**
			 * Title translations
			 */
			title: {
				base: string;
				attributes: {
					[Attribute in keyof Attribs]: string;
				};
			};
			/**
			 * Translation of UI components
			 */
			ui: {
				variants: string;
				slidesControl: string;
				prevSlide: string;
				nextSlide: string;
				sumbit: string;
				buy: string;
			};
		};
	};
};

type AllThis = {
	clothingData: ClothingData<string, Attributes>;
	options: AllOptions<DefaultTypeEssentials, string, Attributes>;
};

type EmotionObject = {
	base: string;
	attributes: Record<string, string>;
};

type InternalShowPickerBase = {
	type: 'base';
};

type InternalShowPickerAttribute = {
	type: 'attribute';
	name: string;
};

type InternalShowPickerBuyOptions = {
	buy: (variant: string) => Promise<boolean>;
	isBought: (variant: string) => boolean;
};

type InternalShowPickerOptions = (InternalShowPickerBase | InternalShowPickerAttribute) &
	InternalShowPickerBuyOptions;

type ShowPickerBuyFunctions = {
	/**
	 * Function to buy attribute variant
	 * @param variant Attribute variant
	 * @returns Boolean indicating is item bought or not
	 */
	buy?: (variant: string) => Promise<boolean>;
	/**
	 * Function to check is attribute variant is bought
	 * @param variant Attribute variant
	 * @returns Boolean indicating is item bought or not
	 */
	isBought?: (variant: string) => boolean;
};

type ShowPickerOptionsAttribute<Attribs extends Attributes> = ShowPickerBuyFunctions & {
	/**
	 * Name of the attribute
	 */
	name: keyof Attribs & string;
};

type ShowPickerOptionsBase = ShowPickerBuyFunctions;

type EngineInstance = {
	action: Record<string, (...args: any[]) => ValidAction>;
	typeEssentials: DefaultTypeEssentials;
};

export type {
	Entries,
	EmotionsDefinition,
	EmotionsResult,
	Attributes,
	ClothingData,
	EmotionObject,
	AllOptions,
	AllThis,
	DefaultTypeEssentials,
	InternalShowPickerOptions,
	ShowPickerOptionsAttribute,
	ShowPickerOptionsBase,
	EngineInstance,
};
