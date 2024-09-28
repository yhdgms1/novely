import { Icon } from '$components';
import type { FlowComponent, JSX } from 'solid-js';
import { createUniqueId, splitProps } from 'solid-js';

type NativeSelectProps = Omit<JSX.SelectHTMLAttributes<HTMLSelectElement>, 'class' | 'id'>;

type SelectProps = NativeSelectProps & {
	/**
	 * Icon HTML string
	 */
	icon: string;
	/**
	 * Label
	 */
	label: string;
};

const Select: FlowComponent<SelectProps> = (props) => {
	const [local, rest] = splitProps(props, ['icon', 'label']);
	const id = createUniqueId();

	return (
		<div class="select">
			<label class="select__label" for={id}>
				<span class="select__label__icon" aria-hidden={true} innerHTML={local.icon} /> {local.label}
			</label>

			<div class="select__select-container">
				<select {...rest} class="select__select" id={id}>
					{props.children}
				</select>

				<Icon class="select__icon" aria-hidden={true}>
					<Icon.ChevronDown />
				</Icon>
			</div>
		</div>
	);
};

export { Select };
