const framesPerSecond = 60;
const frameInterval = 1000 / framesPerSecond;

const scheldue = (render: (dt: number, dtm: number) => void) => {
	let raf: number;

	let deltaTimeMultiplier = 1;
	let deltaTime = 0;

	let previousTime = performance.now();

	const loop = (currentTime: DOMHighResTimeStamp) => {
		deltaTime = currentTime - previousTime;
		deltaTimeMultiplier = deltaTime / frameInterval;

		render(deltaTime, deltaTimeMultiplier);

		previousTime = currentTime;

		raf = requestAnimationFrame(loop);
	};

	raf = requestAnimationFrame(loop);

	return () => {
		cancelAnimationFrame(raf);
	};
};

export { scheldue };
