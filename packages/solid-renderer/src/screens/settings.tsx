import type { VoidComponent, JSX } from 'solid-js';

import { For, createUniqueId } from 'solid-js';
import { capitalize } from '$utils';
import { useData } from '$context';

interface SettingsProps {
	useNativeLanguageNames: boolean;
}

const Settings: VoidComponent<SettingsProps> = (props) => {
	const data = useData();

	const language = () => data.storeData().meta[0];
	const textSpeed = () => data.storeData().meta[1];

	const volume = (kind: 2 | 3 | 4) => data.storeData().meta[kind];

	const getLanguageName = (lang: string): string => {
		/**
		 * `useNativeLanguageNames`:
		 *
		 * True  — "English, Русский, Polskie"
		 * False — "Angielski, Rosyjski, Polski"
		 */
		const intl = new Intl.DisplayNames([props.useNativeLanguageNames ? lang : language()], {
			type: 'language',
		});

		return intl.of(lang) || lang;
	};

	const onLanguageSelect: JSX.EventHandlerUnion<HTMLSelectElement, Event> = ({ currentTarget: { value } }) => {
		data.storeDataUpdate((prev) => {
			prev.meta[0] = value;

			return prev;
		});
	};

	const onSpeedSelect: JSX.EventHandlerUnion<HTMLSelectElement, Event> = ({ currentTarget: { value } }) => {
		data.storeDataUpdate((prev) => {
			return (prev.meta[1] = value), prev;
		});
	};

	const volumeChange = (kind: 2 | 3 | 4) => {
		const fn: JSX.EventHandlerUnion<HTMLInputElement, Event> = ({ currentTarget: { valueAsNumber } }) => {
			data.storeDataUpdate((prev) => {
				prev.meta[kind] = valueAsNumber;

				return prev;
			});
		}

		return fn;
	}

	const languageSelectID = createUniqueId();
	const speedSelectID = createUniqueId();
	const musicVolumeSelectID = createUniqueId();
	const soundVolumeSelectID = createUniqueId();
	const voiceVolumeSelectID = createUniqueId();

	return (
		<div class="root settings">
			<div class="settings__column">
				<button type="button" class="button settings__button" onClick={() => data.setGlobalState('screen', 'mainmenu')}>
					{data.t('HomeScreen')}
				</button>
				<button type="button" class="button settings__button" onClick={() => data.options.restore()}>
					{data.t('ToTheGame')}
				</button>
			</div>
			<div class="settings__column-grid">
				<div>
					<div class="select">
						<label class="select__label" for={languageSelectID}>
							<span aria-hidden={true}>🌎</span> {data.t('Language')}
						</label>
						<select class="select__select" id={languageSelectID} onChange={onLanguageSelect}>
							<For each={data.options.languages}>
								{(lang) => (
									<option value={lang} selected={lang === language()}>
										{capitalize(getLanguageName(lang))}
									</option>
								)}
							</For>
						</select>
					</div>
					<div class="select">
						<label class="select__label" for={speedSelectID}>
							<span aria-hidden={true}>⚡</span> {data.t('TextSpeed')}
						</label>
						<select class="select__select" id={speedSelectID} onChange={onSpeedSelect}>
							<For each={['Slow', 'Medium', 'Fast', 'Auto']}>
								{(speed) => (
									<option value={speed} selected={speed === textSpeed()}>
										{data.t('TextSpeed' + speed)}
									</option>
								)}
							</For>
						</select>
					</div>
				</div>

				<div>
					<div class="range">
						<label class="range__label" for={musicVolumeSelectID}>
							<span aria-hidden={true}>🎵</span> {data.t('MusicVolume')}
						</label>
						<input
							class="range__range"
							type="range"
							id={musicVolumeSelectID}
							min={0}
							max={1}
							step={0.01}
							value={volume(2)}
							onChange={volumeChange(2)}
						/>
					</div>
					<div class="range">
						<label class="range__label" for={soundVolumeSelectID}>
							<span aria-hidden={true}>🔊</span> {data.t('SoundVolume')}
						</label>
						<input
							class="range__range"
							type="range"
							id={soundVolumeSelectID}
							min={0}
							max={1}
							step={0.01}
							value={volume(3)}
							onChange={volumeChange(3)}
						/>
					</div>
					<div class="range">
						<label class="range__label" for={voiceVolumeSelectID}>
							<span aria-hidden={true}>🗣️</span> {data.t('VoiceVolume')}
						</label>
						<input
							class="range__range"
							type="range"
							id={voiceVolumeSelectID}
							min={0}
							max={1}
							step={0.01}
							value={volume(4)}
							onChange={volumeChange(4)}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export { Settings };
