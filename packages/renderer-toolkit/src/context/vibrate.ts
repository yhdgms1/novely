const vibrationPossible = /* @__PURE__ */ (() => {
	let can = false;

	const onPointerDown = () => {
		can = true;
		document.removeEventListener('pointerdown', onPointerDown);
	};

	document.addEventListener('pointerdown', onPointerDown);

	return () => can;
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
