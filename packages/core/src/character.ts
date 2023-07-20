type Name<Keys extends string = string> = string | Record<Keys, string>;
type Emotions<Keys extends string = string> = Record<
	Keys,
	string | { body: Record<'left' | 'right', string>; head: string }
>;

type Character<LanguageKeys extends string = string> = {
	name: Name<LanguageKeys>;
	color: string;
	emotions: Emotions;
};

export type { Emotions, Character };
