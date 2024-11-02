import type { FlowComponent, JSX } from 'solid-js';
import { createUniqueId, splitProps } from 'solid-js';

type NativeSelectProps = Omit<JSX.SelectHTMLAttributes<HTMLSelectElement>, 'class' | 'id'>;

type SelectProps = NativeSelectProps & {
	/**
	 * Icon #path
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
				<span class="select__label__icon" aria-hidden={true}>
					<svg width="24" height="24" viewBox="0 0 256 256">
						<use href={local.icon} />
					</svg>
				</span>{' '}
				{local.label}
			</label>

			<div class="select__select-container">
				<select {...rest} class="select__select" id={id}>
					{props.children}
				</select>

				<svg class="select__icon" aria-hidden={true} width="24" height="24" viewBox="0 0 256 256">
					<use href="#novely-caret-down-icon" />
				</svg>
			</div>
		</div>
	);
};

export { Select };
