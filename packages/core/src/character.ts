import type { Lang } from "./types";

type Name<$Lang extends Lang> = string | Record<$Lang, string>;
type Emotions<Emotion extends string = string> = Record<
	Emotion,
	string | string[]
>;

type Character<$Lang extends Lang = string> = {
	name: Name<$Lang>;
	color: string;
	emotions: Emotions;
};

export type { Emotions, Character };
