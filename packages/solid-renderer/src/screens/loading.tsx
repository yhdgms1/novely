import type { VoidComponent } from 'solid-js';

interface LoadingProps {
	overlay?: boolean;
}

const Loading: VoidComponent<LoadingProps> = (props) => {
	return (
		<div
			class="loading"
			classList={{
				overlay: props.overlay
			}}
		>
			<div class="loading__animation">
				<div />
				<div />
				<div />
				<div />
			</div>
		</div>
	);
};

export { Loading };
