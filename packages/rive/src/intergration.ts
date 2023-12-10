type IsColorMatchingFn = (rgba: [r: number, g: number, b: number, a: number]) => boolean;

const isColorRed: IsColorMatchingFn = ([r, g, b, a]) => a === 255 && r === 255 && g === 0 && b === 0;

type BottomBarIntergrationOptions = {
	canvas: HTMLCanvasElement;

	isColorMatching?: IsColorMatchingFn;
};

const bottomBarIntergration = ({ canvas, isColorMatching = isColorRed }: BottomBarIntergrationOptions) => {
	const ctx = canvas.getContext('2d');

	const react = () => {
		if (!ctx) return;

		const { width, height, data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

		const centerX = Math.floor(width / 2);
		const bottomY = height - 1;

		const getColorAt = (index: number) => {
			return [data[index], data[index + 1], data[index + 2], data[index + 3]] as [number, number, number, number];
		};

		const isColorMatches = (index: number) => isColorMatching(getColorAt(index));

		const bottomCenterPixelIndex = (bottomY * width + centerX) * 4;

		/**
		 * Return early
		 */
		if (!isColorMatches(bottomCenterPixelIndex)) return;

		let bottomOffset = 0;

		while (isColorMatches(((bottomY - bottomOffset) * width + centerX) * 4)) {
			bottomOffset++;
		}

		/**
		 * Dumb fix bar still appearing
		 */
		bottomOffset += 2;

		const zonePercent = (bottomOffset / height) * 100;
		const cutoffPercent = 100 - zonePercent;

		canvas.style.clipPath = `polygon(0 0, 100% 0, 100% ${cutoffPercent}%, 0 ${cutoffPercent}%)`;
		canvas.style.transform = `translateY(${zonePercent}%)`;
	};

	canvas.style.cssText += `position: absolute; width: 100%; height: 100%;`;

	return {
		onResize() {
			requestAnimationFrame(react);
		},
		onLoad() {
			requestAnimationFrame(react);
		},
	};
};

export { bottomBarIntergration };
