import type { TypewriterSpeed } from '@novely/core';
import type { JSX, VoidComponent } from 'solid-js';

import { Range, Select } from '$components';
import { useData } from '$context';
import { For } from 'solid-js';

interface SettingsProps {
	showAudioSettings: boolean;
}

const Settings: VoidComponent<SettingsProps> = (props) => {
	const { t, storageData, storageDataUpdate, options, $rendererState } = useData();

	const language = () => storageData().meta[0];
	const textSpeed = () => storageData().meta[1];

	const volume = (kind: 2 | 3 | 4) => storageData().meta[kind];

	const onLanguageSelect: JSX.EventHandlerUnion<HTMLSelectElement, Event> = ({ currentTarget: { value } }) => {
		storageDataUpdate((prev) => {
			prev.meta[0] = value;

			return prev;
		});
	};

	const onSpeedSelect: JSX.EventHandlerUnion<HTMLSelectElement, Event> = ({ currentTarget: { value } }) => {
		storageDataUpdate((prev) => {
			prev.meta[1] = value as TypewriterSpeed;

			return prev;
		});
	};

	const volumeChange = (kind: 2 | 3 | 4) => {
		const fn: JSX.EventHandlerUnion<HTMLInputElement, Event> = ({ currentTarget: { valueAsNumber } }) => {
			storageDataUpdate((prev) => {
				prev.meta[kind] = valueAsNumber;

				return prev;
			});
		};

		return fn;
	};

	return (
		<div class="root settings">
			<div class="settings__controls">
				<button
					type="button"
					class="button settings__button"
					onClick={() => {
						$rendererState.setKey('screen', 'mainmenu');
					}}
				>
					{t('HomeScreen')}
				</button>

				<button
					type="button"
					class="button settings__button"
					onClick={() => {
						options.restore();
					}}
				>
					{t('ToTheGame')}
				</button>
			</div>

			<div class="settings__options">
				<div>
					<Select icon="#novely-globe-icon" label={t('Language')} onChange={onLanguageSelect}>
						<For each={options.languages}>
							{(lang) => (
								<option value={lang} selected={lang === language()}>
									{options.getLanguageDisplayName(lang)}
								</option>
							)}
						</For>
					</Select>

					<Select icon="#novely-typewriter-speed-icon" label={t('TextSpeed')} onChange={onSpeedSelect}>
						<For each={['Slow', 'Medium', 'Fast', 'Auto']}>
							{(speed) => (
								<option value={speed} selected={speed === textSpeed()}>
									{t('TextSpeed' + speed)}
								</option>
							)}
						</For>
					</Select>
				</div>

				<div
					classList={{
						'settings--hidden': !props.showAudioSettings,
					}}
				>
					<Range
						icon="#novely-music-volume-icon"
						label={t('MusicVolume')}
						min={0}
						max={1}
						step={0.01}
						value={volume(2)}
						onChange={volumeChange(2)}
					/>

					<Range
						icon="#novely-sound-volume-icon"
						label={t('SoundVolume')}
						min={0}
						max={1}
						step={0.01}
						value={volume(3)}
						onChange={volumeChange(3)}
					/>

					<Range
						icon="#novely-voice-volume-icon"
						label={t('VoiceVolume')}
						min={0}
						max={1}
						step={0.01}
						value={volume(4)}
						onChange={volumeChange(4)}
					/>
				</div>
			</div>
		</div>
	);
};

export { Settings };
