import type { Component, JSX } from 'solid-js';
import type { DynCharacterThis } from '../types';
import { createSignal, createEffect, untrack, createSelector, For } from 'solid-js';

type Props = {
	initialSlideIndex: number;
	slides: string[];
	expanded: boolean;
	translation: DynCharacterThis['options']['translation'][string];

	children: (slide: string) => JSX.Element;
	onIndexChange: (currentIndex: number) => void;
};

const Slider: Component<Props> = (props) => {
	const [currentSlide, setCurrentSlide] = createSignal(props.initialSlideIndex);
	const isSelected = createSelector(currentSlide);

	createEffect(() => {
		const currentIndex = currentSlide();

		untrack(() => props.onIndexChange(currentIndex));
	});

	return (
		<div
			role="region"
			aria-label={props.translation.ui.variants}
			classList={{
				'ndc-slider': true,
				'ndc-slider-picker-collapsed': !props.expanded,
			}}
			onKeyDown={(event) => {
				if (event.key === 'ArrowLeft') {
					setCurrentSlide((value) => (value > 0 ? value - 1 : props.slides.length - 1));
				} else if (event.key === 'ArrowRight') {
					setCurrentSlide((value) => (value < props.slides.length - 1 ? value + 1 : 0));
				}
			}}
		>
			<div role="group" class="ndc-controls" aria-label={props.translation.ui.slidesControl}>
				<button
					type="button"
					class="ndc-button-nav ndc-button-nav-prev"
					aria-label={props.translation.ui.prevSlide}
					onClick={() => {
						setCurrentSlide((slide) => {
							if (slide > 0) {
								return slide - 1;
							}

							return props.slides.length - 1;
						});
					}}
				>
					<svg data-icon fill="currentColor" viewBox="0 0 256 256">
						<path d="M165.66 202.34a8 8 0 0 1-11.32 11.32l-80-80a8 8 0 0 1 0-11.32l80-80a8 8 0 0 1 11.32 11.32L91.31 128Z" />
					</svg>
				</button>

				<button
					type="button"
					class="ndc-button-nav ndc-button-nav-next"
					aria-label={props.translation.ui.nextSlide}
					onClick={() => {
						setCurrentSlide((slide) => {
							if (slide < props.slides.length - 1) {
								return slide + 1;
							}

							return 0;
						});
					}}
				>
					<svg data-icon fill="currentColor" viewBox="0 0 256 256">
						<path d="m181.66 133.66-80 80a8 8 0 0 1-11.32-11.32L164.69 128 90.34 53.66a8 8 0 0 1 11.32-11.32l80 80a8 8 0 0 1 0 11.32Z" />
					</svg>
				</button>
			</div>

			<div class="ndc-slides" aria-live="polite">
				<For each={props.slides}>
					{(variant, i) => {
						return (
							<div
								role="group"
								classList={{
									'ndc-slide': true,
									'ndc-slide-active': isSelected(i()),
								}}
							>
								{props.children(variant)}
							</div>
						);
					}}
				</For>
			</div>
		</div>
	);
};

export { Slider };
