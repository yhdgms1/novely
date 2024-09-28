const { max, sin, cos, PI } = Math;

const random = (min: number, max: number) => {
	return Math.random() * (max - min) + min;
};

const clamp = (min: number, num: number, max: number) => {
	return Math.max(min, Math.min(num, max));
};

const TWO_PI = PI * 2;
const PI_OVER_TWO = PI / 2;

export { random, clamp };
export { max, sin, cos, PI, TWO_PI, PI_OVER_TWO };
