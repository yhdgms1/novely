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
 * Transforms `(ValidAction | ValidAction[])[]` to `ValidAction[]`. Mutates provided `Story`
 */
const flatStory = (story: Story) => {
	for (const key in story) {
		story[key] = flatActions(story[key]);
	}

	return story;
};

export { flatActions, flatStory };
