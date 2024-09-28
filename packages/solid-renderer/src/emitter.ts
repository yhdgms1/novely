type EventMap = Record<string, unknown>;

type EventKey<T extends EventMap> = string & keyof T;
type EventReceiver<T> = (params: T) => void;

interface Emitter<T extends EventMap> {
	on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
	once<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
	off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;

	emit<K extends EventKey<T>>(eventName: K, params: T[K]): void;
}

const createEmitter = <T extends EventMap>(): Emitter<T> => {
	const listeners = new Map<keyof EventMap & string, Set<(param: any) => void>>();

	return {
		on(name, fn) {
			const set = listeners.get(name);

			if (!set) {
				listeners.set(name, new Set());

				return this.on(name, fn);
			}

			set.add(fn);
		},
		once(name, fn) {
			const listener = (params: any) => {
				fn(params);

				this.off(name, listener);
			};

			this.on(name, listener);
		},
		off(name, fn) {
			const set = listeners.get(name);

			if (set) {
				set.delete(fn);
			}
		},
		emit(name, params) {
			const set = listeners.get(name);

			if (set) {
				set.forEach((fn) => fn(params));
			}
		},
	};
};

export { createEmitter };
export type { Emitter, EventKey, EventReceiver, EventMap };
