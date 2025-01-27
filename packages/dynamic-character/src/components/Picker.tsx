import type { Component, Setter } from 'solid-js';
import type { DynCharacterThis, EmotionObject } from '../types';
import { createSignal, Show } from 'solid-js';
import { Slider } from './Slider';
import { once } from '../utils';
import pLimit from 'p-limit';

const limitClick = pLimit(1);

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

	buy: (variant: string) => Promise<boolean>;
	isBought: (variant: string) => boolean;
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
				{(variant, i) => {
					const price = props.pricing[i()];

					const apply = once(() => {
						props.sumbit();
						props.saveEmotion(appearance());
					});

					const onClick = () => {
						limitClick(async () => {
							if (!price || props.isBought(variant)) {
								return apply();
							}

							if (await props.buy(variant)) {
								apply();
							}
						});
					};

					return (
						<>
							<p class="ndc-variant-name">{props.translationGroup[variant]}</p>

							<div class="ndc-control-buttons">
								<button type="button" class="button" onClick={onClick}>
									<Show
										when={price && !props.isBought(variant)}
										children={
											<>
												{props.translation.ui.buy}
												&nbsp;
												{price}
											</>
										}
										fallback={props.translation.ui.sumbit}
									/>
								</button>
							</div>
						</>
					);
				}}
			</Slider>
		</div>
	);
};

export { Picker };
