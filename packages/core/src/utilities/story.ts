import type { Story, ValidAction } from '../action';

const flatActions = (item: (ValidAction | ValidAction[])[]): ValidAction[] => {
	return item.flatMap((data) => {
		const type = data[0];

		/**
		 * This is not just an action like `['name', ...arguments]`, but an array of actions
		 */
		if (Array.isArray(type)) return flatActions(data as ValidAction[]);

		return [data as ValidAction];
	});
};

/**
 * Transforms `(ValidAction | ValidAction[])[]` to `ValidAction[]`
 */
const flatStory = (story: Story) => {
	const entries = Object.entries(story).map(([name, items]) => {
		return [name, flatActions(items)];
	});

	return Object.fromEntries(entries);
};

export { flatActions, flatStory };
