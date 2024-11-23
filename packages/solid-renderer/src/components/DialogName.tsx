import { useData } from '$context';
import { Show } from 'solid-js';
import type { VoidComponent } from 'solid-js';

type DialogNameProps = {
	character?: string;
	name: string;
	mood: string;
};

const DialogName: VoidComponent<DialogNameProps> = (props) => {
	const data = useData();

	const color = () => {
		return props.character ? data.options.getCharacterColor(props.character) : '#000';
	};

	return (
		<div
			class="action-dialog-name"
			style={{
				color: color(),
				opacity: props.character ? 1 : 0,
				visibility: props.character ? 'visible' : 'hidden',
			}}
		>
			<span>{props.name || <>&#8197;</>}</span>

			<Show when={props.mood}>
				{(mood) => (
					<>
						&nbsp;
						<span class="action-dialog-mood-separator">&#10022;</span>
						&nbsp;
						{mood()}
					</>
				)}
			</Show>
		</div>
	);
};

export { DialogName };
