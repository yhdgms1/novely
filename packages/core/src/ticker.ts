import type { Derived } from './store';

type TickHandler = (ticker: Ticker) => void;

class Ticker {
	public listeners = new Set<TickHandler>();
	public running = false;

	private _factory: TickerFactory;

	constructor(factory: TickerFactory) {
		this._factory = factory;
	}

	get deltaTime() {
		return this._factory.deltaTime;
	}

	get lastTime() {
		return this._factory.lastTime;
	}

	public add(cb: (ticker: Ticker) => void) {
		this.listeners.add(cb);

		if (this.listeners.size === 1) {
			this._factory.check(true);
		}

		return () => {
			this.remove(cb);
		};
	}

	public remove(cb: (ticker: Ticker) => void) {
		this.listeners.delete(cb);

		if (this.listeners.size === 0) {
			this._factory.check(false);
		}
	}

	public start = () => {
		this.running = true;

		if (this.listeners.size > 0) {
			this._factory.check(true);
		}
	};

	public stop = () => {
		this.running = false;
	};

	public detach = () => {
		this.listeners.clear();
		this.stop();
		this._factory.detach(this);
	};
}

class TickerFactory {
	private _children = new Set<Ticker>();
	private _raf = -1;
	private _running = false;
	private _unsubscribe: () => void;

	public deltaTime = 0;
	public lastTime = performance.now();

	constructor(paused: Derived<boolean>) {
		this._unsubscribe = paused.subscribe((paused) => {
			if (paused) {
				this.stop();
			} else if (Array.from(this._children).some((ticker) => ticker.running && ticker.listeners.size > 0)) {
				this.start();
			}
		});
	}

	public start() {
		if (this._running) {
			return;
		}

		cancelAnimationFrame(this._raf);

		this.lastTime = performance.now();
		this._running = true;
		this._raf = requestAnimationFrame(this.update);
	}

	public stop() {
		cancelAnimationFrame(this._raf);
		this._running = false;
		this._raf = -1;
	}

	public fork() {
		const ticker = new Ticker(this);

		this._children.add(ticker);

		return ticker;
	}

	public check(positive: boolean) {
		if (positive) {
			this.start();
		} else if (Array.from(this._children).every((ticker) => !ticker.running || ticker.listeners.size === 0)) {
			this.stop();
		}
	}

	public destroy() {
		this._unsubscribe();
		this._children.forEach((child) => child.detach());
	}

	public detach(ticker: Ticker) {
		this._children.delete(ticker);
		this.check(false);
	}

	private update = (currentTime: DOMHighResTimeStamp) => {
		this.deltaTime = currentTime - this.lastTime;
		this._children.forEach((ticker) => {
			if (ticker.running) {
				ticker.listeners.forEach((tick) => {
					tick(ticker);
				});
			}
		});

		if (!this._running) {
			return;
		}

		this.lastTime = currentTime;
		this._raf = requestAnimationFrame(this.update);
	};
}

export { TickerFactory, Ticker };
