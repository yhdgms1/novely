import type { Accessor, Setter, VoidComponent } from 'solid-js';

import { useData } from '$context';
import { Show } from 'solid-js';
import { Icon } from './Icon';

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
				<Icon class="control-panel__button__icon" icon="#novely-back-icon" />
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
				<Icon class="control-panel__button__icon" icon="#novely-book-open-icon" />
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
				<Icon class="control-panel__button__icon" icon="#novely-save-icon" />
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
				<Icon
					class="control-panel__button__icon"
					icon={props.auto() ? '#novely-stop-icon' : '#novely-play-icon'}
				/>
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
				<Icon class="control-panel__button__icon" icon="#novely-settings-icon" />
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
				<Icon class="control-panel__button__icon" icon="#novely-x-icon" />
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
					<Icon icon="#novely-x-icon" />
				</button>
			</Show>
		</>
	);
};

export { ControlPanelButtons };
