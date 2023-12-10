/**
 * These modules export default string because in `build.js` loader for `.css` is `text`
 */

declare module '@novely/solid-renderer/dist/styles/index.css' {
	const DEFAULT: string;
	export default DEFAULT;
}

declare module 'modern-normalize' {
	const DEFAULT: string;
	export default DEFAULT;
}
