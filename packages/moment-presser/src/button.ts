const template = (html: string) => {
	const t = document.createElement('template');

	t.innerHTML = html;

	return t.content.firstChild;
};

type CreateButtonOptions = {
	label: string;
};

const createButton = ({ label }: CreateButtonOptions) => {
	/**
	 * Optimized via {@link https://grim.pages.dev/repl Grim JSX}
	 */
	const html = `<div class="moment-presser-button-container"><button type="button" class="moment-presser-button" style="aspect-ratio: 1;" aria-label="${label}"><div class="moment-presser-circle" style="aspect-ratio: 1;"><svg fill="currentColor" viewBox="0 0 256 256"><path d="M200.73,40H55.27A15.29,15.29,0,0,0,40,55.27V200.73A15.29,15.29,0,0,0,55.27,216H200.73A15.29,15.29,0,0,0,216,200.73V55.27A15.29,15.29,0,0,0,200.73,40ZM200,200H56V56H200Z"></path></svg></div></button><span class="moment-presser-caption">${label}</span></div>`;

	return template(html) as HTMLButtonElement;
};

export { createButton };
