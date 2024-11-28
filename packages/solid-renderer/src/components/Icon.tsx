import type { JSX, VoidComponent } from 'solid-js';
import { splitProps } from 'solid-js';

type SVGAttributes = JSX.SvgSVGAttributes<SVGSVGElement>;
type IconProps = {
	icon: string;
};

const Icon: VoidComponent<SVGAttributes & IconProps> = (props) => {
	const [it, rest] = splitProps(props, ['icon']);

	return (
		<svg data-icon fill="currentColor" width="24" height="24" viewBox="0 0 256 256" {...rest}>
			<use href={it.icon} />
		</svg>
	);
};

export { Icon };
