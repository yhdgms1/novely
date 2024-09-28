const escaped: Record<string, string> = {
	'"': '&quot;',
	"'": '&#39;',
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
};

const escapeHTML = (str: string) => {
	return String(str).replace(/["'&<>]/g, (match) => escaped[match]);
};

export { escapeHTML };
