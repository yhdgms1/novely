import type { ActionProxyProvider } from './action';
import type { Character } from './character';

type Thenable<T> = T | Promise<T>;

type PathItem =
	| [null, number | string]
	| ['jump', string]
	| ['choice', number]
	| ['choice:exit']
	| ['condition', string]
	| ['condition:exit']
	| ['exit']
	| ['block', string]
	| ['block:exit'];

type Path = PathItem[];

type State = Record<string, any>;
type Data = Record<string, any>;

type SaveDate = number;
type SaveType = 'manual' | 'auto';

type SaveMeta = [date: SaveDate, type: SaveType];

type Save = [path: Path, state: State, meta: SaveMeta];

type Lang = string;
type TypewriterSpeed = 'Slow' | 'Medium' | 'Fast' | 'Auto' | (string & Record<never, never>);
type SoundVolume = number;

type StorageMeta = [lang: Lang, typewriter_speed: TypewriterSpeed, music_volume: SoundVolume, sound_volume: SoundVolume, voice_volume: SoundVolume];

type Migration = (save: unknown) => unknown;

type StorageData = {
	saves: Save[];
	data: Data;
	meta: StorageMeta;
};

type Stack = {
	value: Save;
	back(): void;
	push(value: Save): void;
	clear(): void;
};

type NovelyScreen = 'mainmenu' | 'game' | 'saves' | 'settings';

/**
 * @see https://pendletonjones.com/deep-partial
 */
type DeepPartial<T> = unknown extends T
	? T
	: T extends object
	  ? {
				[P in keyof T]?: T[P] extends Array<infer U>
					? Array<DeepPartial<U>>
					: T[P] extends ReadonlyArray<infer U>
					  ? ReadonlyArray<DeepPartial<U>>
					  : DeepPartial<T[P]>;
	    }
	  : T;

type ActionFN = ActionProxyProvider<Record<string, Character>, string>[keyof ActionProxyProvider<
	Record<string, Character>,
	string
>];

type NonEmptyRecord<T extends Record<PropertyKey, unknown>> = keyof T extends never ? never : T;

type CoreData = {
	dataLoaded: boolean;
};

export type {
	Thenable,
	PathItem,
	Path,
	Save,
	State,
	Stack,
	StorageData,
	StorageMeta,
	TypewriterSpeed,
	Lang,
	DeepPartial,
	NovelyScreen,
	Migration,
	Data,
	ActionFN,
	NonEmptyRecord,
	CoreData,
};
