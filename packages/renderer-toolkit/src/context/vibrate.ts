const vibrationPossible = /* @__PURE__ */ (() => {
	let possible = false;

	const onPointerDown = () => {
		possible = true;
	};

	const isPossible = () => {
		return possible;
	};

	document.addEventListener('pointerdown', onPointerDown, { once: true });

	return isPossible;
})();

/**
 * Vibrate for browser environment
 */
const vibrate = (pattern: VibratePattern) => {
	if (vibrationPossible() && 'vibrate' in navigator) {
		try {
			navigator.vibrate(pattern);
		} catch {}
	}
}

export { vibrate }
