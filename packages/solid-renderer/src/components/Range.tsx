import type { JSX, VoidComponent } from 'solid-js';
import { createUniqueId, splitProps } from 'solid-js';

type NativeInputProps = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'class' | 'id' | 'type'>;

type RangeProps = NativeInputProps & {
	/**
	 * Icon HTML string
	 */
	icon: string;
	/**
	 * Label
	 */
	label: string;
};

const Range: VoidComponent<RangeProps> = (props) => {
	const [local, rest] = splitProps(props, ['icon', 'label']);
	const id = createUniqueId();

	return (
		<div class="range">
			<label class="range__label" for={id}>
				<span class="range__label__icon" aria-hidden={true} innerHTML={local.icon} /> {local.label}
			</label>

			<input {...rest} class="range__range" type="range" id={id} />
		</div>
	);
};

export { Range };
