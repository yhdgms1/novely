type Options = {
	adapter: Adapter;
};

type Adapter = {
	get: () => Promise<null | string>;
	set: (data: string) => Promise<void>;
};

type AdapterLocalStorageOptions = {
	key?: string;
};

export type { Options, Adapter, AdapterLocalStorageOptions };
