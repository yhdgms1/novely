import type { Character, Data, Lang, NovelyAsset, State, TypeEssentials } from '@novely/core';

type Attributes<BaseKeys extends string = string> = Record<
	string,
	Record<string, Record<BaseKeys, NovelyAsset | NovelyAsset[]>>
>;

type EmotionsDefinition<BaseKeys extends string, Attribs extends Attributes<BaseKeys>> = {
	base: Record<BaseKeys, NovelyAsset | NovelyAsset[]>;
	attributes: Attribs;
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

	// Without this the `attributes` property is `Attributes` and not a narrow `Attribs`
	__attributes?: Attribs;
};

type EmotionsResult<BaseKeys extends string, Attribs extends Attributes<BaseKeys>> = {
	emotions: GeneratedEmotions<BaseKeys, Attribs>;
	clothingData: Prettify<ClothingData<BaseKeys, Attribs>>;
};

type Entries<T> = T extends Record<infer T, infer K> ? [T, K][] : never;

type DefaultTypeEssentials = TypeEssentials<Lang, State, Data, Record<string, Character>>;

type DynCharacterOptions<
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
	 * Attributes to exclude from picker
	 */
	excludeAttributes?: (keyof Attribs & string)[];
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
			 * Tabs translations
			 */
			tabs: {
				/**
				 * Base tab translation
				 */
				base: string;
				/**
				 * Attribute translations
				 */
				attributes: {
					[Attribute in keyof Attribs]: string;
				};
			};
			/**
			 * Translation of UI components
			 */
			ui: {
				tablist: string;
				variants: string;
				slidesControl: string;
				prevSlide: string;
				nextSlide: string;
				apply: string;
				sumbit: string;
			};
		};
	};
};

type DynCharacterThis = {
	clothingData: ClothingData<string, Attributes>;
	options: DynCharacterOptions<DefaultTypeEssentials, string, Attributes>;
};

type EmotionObject = {
	base: string;
	attributes: Record<string, string>;
};

export type {
	Entries,
	EmotionsDefinition,
	EmotionsResult,
	Attributes,
	ClothingData,
	EmotionObject,
	DynCharacterOptions,
	DynCharacterThis,
	DefaultTypeEssentials,
};
