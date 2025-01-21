import type { Component, Setter } from 'solid-js';
import type { DynCharacterThis, EmotionObject } from '../types';
import { createSignal, Show } from 'solid-js';
import { Slider } from './Slider';

type PickerProps = {
	title: string;

	initialExpanded: boolean;
	initialEmotion: EmotionObject;

	slides: string[];
	pricing: number[];

	translationGroup: Record<string, string>;
	translation: DynCharacterThis['options']['translation'][string];

	getInitialSlideIndex: (appearance: EmotionObject) => number;
	onIndexChange: (appearance: EmotionObject, setAppearance: Setter<EmotionObject>, slide: number) => void;
	saveEmotion: (appearance: EmotionObject) => void;

	sumbit: () => void;
};

const Picker: Component<PickerProps> = (props) => {
	const [expanded, setExpanded] = createSignal(props.initialExpanded);
	const [appearance, setAppearance] = createSignal(props.initialEmotion);

	const initialSlideIndex = props.getInitialSlideIndex(appearance());

	return (
		<div
			classList={{
				'ndc-picker-root': true,
				'ndc-picker-root-collapsed': !expanded(),
			}}
		>
			<button
				type="button"
				class="ndc-collapse-button"
				onClick={() => {
					setExpanded((value) => !value);
				}}
			>
				<svg
					data-icon
					fill="#fefefe"
					width="3rem"
					height="3rem"
					viewBox="0 0 256 256"
					classList={{
						'ndc-collapse-button-icon-collapsed': !expanded(),
					}}
				>
					<path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
				</svg>
			</button>

			<div
				classList={{
					'ndc-heading': true,
					'ndc-heading-picker-collapsed': !expanded(),
				}}
			>
				{props.title}
			</div>

			<Slider
				expanded={expanded()}
				initialSlideIndex={initialSlideIndex}
				slides={props.slides}
				translation={props.translation}
				onIndexChange={(index) => props.onIndexChange(appearance(), setAppearance, index)}
			>
				{(variant, i) => (
					<>
						<p class="ndc-variant-name">{props.translationGroup[variant]}</p>

						<div class="ndc-control-buttons">
							<button
								type="button"
								class="button"
								onClick={() => {
									// todo: make function to check if item is already bought
									const free = !props.pricing[i()];

									if (free) {
										props.sumbit();
										props.saveEmotion(appearance());
									} else {
										// todo: props.buy(variant).then((result) => if (result) /** then save and go next */)
										console.log(`Trying to buy ${variant}`);
									}
								}}
							>
								<Show when={props.pricing[i()]} fallback={props.translation.ui.sumbit}>
									{props.translation.ui.buy}
									&nbsp;
									{props.pricing[i()]}
								</Show>
							</button>
						</div>
					</>
				)}
			</Slider>
		</div>
	);
};

export { Picker };
