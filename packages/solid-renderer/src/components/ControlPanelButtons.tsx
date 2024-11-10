import type { Accessor, Setter, VoidComponent } from 'solid-js';

import { useData } from '$context';
import { Show } from 'solid-js';

type ControlPanelButtonsProps = {
	openSettings: () => void;
	closeDropdown: () => void;

	openDialogOverview: () => void;

	auto: Accessor<boolean>;
	setAuto: Setter<boolean>;
};

const ControlPanelButtons: VoidComponent<ControlPanelButtonsProps> = (props) => {
	const data = useData();

	return (
		<>
			<button
				role="menuitem"
				type="button"
				class="button control-panel__button"
				title={data.t('GoBack')}
				onClick={data.options.back}
			>
				<span class="control-panel__button__content">{data.t('GoBack')}</span>

				<svg class="control-panel__button__icon" width="24" height="24" viewBox="0 0 256 256">
					<use href="#novely-back-icon" />
				</svg>
			</button>
			<button
				role="menuitem"
				type="button"
				class="button control-panel__button"
				title={data.t('DialogOverview')}
				onClick={props.openDialogOverview}
				data-dialog-overview-button
			>
				<span class="control-panel__button__content">{data.t('DialogOverview')}</span>

				<svg class="control-panel__button__icon" width="24" height="24" viewBox="0 0 256 256">
					<use href="#novely-book-open-icon" />
				</svg>
			</button>
			<button
				role="menuitem"
				type="button"
				class="button control-panel__button"
				title={data.t('DoSave')}
				onClick={() => {
					data.options.save('manual');
				}}
			>
				<span class="control-panel__button__content">{data.t('DoSave')}</span>

				<svg class="control-panel__button__icon" width="24" height="24" viewBox="0 0 256 256">
					<use href="#novely-save-icon" />
				</svg>
			</button>
			<button
				role="menuitem"
				type="button"
				class="button control-panel__button control-panel__button--auto-mode"
				title={data.t(props.auto() ? 'Stop' : 'Auto')}
				onClick={() => {
					props.setAuto((prev) => !prev);
				}}
			>
				<span class="control-panel__button__content">{data.t(props.auto() ? 'Stop' : 'Auto')}</span>

				<svg class="control-panel__button__icon" width="24" height="24" viewBox="0 0 256 256">
					<use href={props.auto() ? '#novely-stop-icon' : '#novely-play-icon'} />
				</svg>
			</button>
			<button
				role="menuitem"
				type="button"
				class="button control-panel__button"
				title={data.t('Settings')}
				onClick={() => {
					data.options.save('auto');
					data.options.exit(true);
					props.openSettings();
				}}
			>
				<span class="control-panel__button__content">{data.t('Settings')}</span>

				<svg class="control-panel__button__icon" width="24" height="24" viewBox="0 0 256 256">
					<use href="#novely-files-icon" />
				</svg>
			</button>
			<button
				role="menuitem"
				type="button"
				class="button control-panel__button"
				title={data.t('Exit')}
				onClick={() => {
					data.options.exit();
				}}
			>
				<span class="control-panel__button__content">{data.t('Exit')}</span>

				<svg class="control-panel__button__icon" width="24" height="24" viewBox="0 0 256 256">
					<use href="#novely-x-icon" />
				</svg>
			</button>

			<Show when={data.media.hyperWide()}>
				<button
					role="menuitem"
					type="button"
					class="button control-panel__button"
					title={data.t('CloseMenu')}
					onClick={() => {
						props.closeDropdown();
					}}
				>
					<svg width="24" height="24" viewBox="0 0 256 256">
						<use href="#novely-x-icon" />
					</svg>
				</button>
			</Show>
		</>
	);
};

export { ControlPanelButtons };
