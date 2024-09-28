import { useData } from '$context';
import type { VoidComponent } from 'solid-js';

interface DialogNameProps {
	character?: string;
	name: string;
}

const DialogName: VoidComponent<DialogNameProps> = (props) => {
	const data = useData();

	const color = () => {
		return props.character ? data.options.getCharacterColor(props.character) : '#000';
	};

	return (
		<span
			class="action-dialog-name"
			style={{
				color: color(),
				opacity: props.character ? 1 : 0,
				visibility: props.character ? 'visible' : 'hidden',
			}}
		>
			{props.name || <>&#8197;</>}
		</span>
	);
};

export { DialogName };
