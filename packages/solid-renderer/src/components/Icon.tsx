/**
 * These SVG icons are provided by Make Lemonade's Iconicicons (https://iconic.app/)
 * under the "Do WTF You Want With" license.
 */

import type { JSX } from 'solid-js';

type SVGProps = JSX.SvgSVGAttributes<SVGSVGElement>;
type IconProps = SVGProps & {
	children: JSX.Element;
};

const Icon = (props: IconProps) => {
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="1.5"
			{...props}
		>
			{props.children}
		</svg>
	);
};

Icon.Back = () => {
	return <path d="m9.75 12 8.5-6.25v12.5L9.75 12ZM5.75 5.75v12.5" />;
};

Icon.Save = () => {
	return (
		<>
			<path d="M6.75 19.25h10.5a2 2 0 0 0 2-2V9.828a2 2 0 0 0-.586-1.414l-3.078-3.078a2 2 0 0 0-1.414-.586H6.75a2 2 0 0 0-2 2v10.5a2 2 0 0 0 2 2Z" />
			<path d="M8.75 19v-3.25a1 1 0 0 1 1-1h4.5a1 1 0 0 1 1 1V19M8.75 5v3.25" />
		</>
	);
};

Icon.Settings = () => {
	return (
		<>
			<path d="M13.12 5.613a1 1 0 0 0-.991-.863h-.258a1 1 0 0 0-.99.863l-.087.632c-.056.403-.354.724-.732.874a5.225 5.225 0 0 0-.167.07c-.373.163-.81.15-1.136-.095l-.308-.23a1 1 0 0 0-1.307.092l-.188.188a1 1 0 0 0-.092 1.307l.23.308c.244.325.258.763.095 1.136a5.225 5.225 0 0 0-.07.167c-.15.378-.47.676-.874.732l-.632.087a1 1 0 0 0-.863.99v.258a1 1 0 0 0 .863.99l.632.087c.403.056.724.354.874.732l.07.167c.163.373.15.81-.095 1.136l-.23.308a1 1 0 0 0 .092 1.307l.188.188a1 1 0 0 0 1.307.093l.308-.231c.325-.244.763-.258 1.136-.095a5.4 5.4 0 0 0 .167.07c.378.15.676.47.732.874l.087.632a1 1 0 0 0 .99.863h.258a1 1 0 0 0 .99-.863l.087-.632c.056-.403.354-.724.732-.874a5.12 5.12 0 0 0 .167-.07c.373-.163.81-.15 1.136.095l.308.23a1 1 0 0 0 1.307-.092l.188-.188a1 1 0 0 0 .093-1.307l-.231-.308c-.244-.325-.258-.763-.095-1.136l.07-.167c.15-.378.47-.676.874-.732l.632-.087a1 1 0 0 0 .863-.99v-.258a1 1 0 0 0-.863-.99l-.632-.087c-.403-.056-.724-.354-.874-.732a5.168 5.168 0 0 0-.07-.167c-.163-.373-.15-.81.095-1.136l.23-.308a1 1 0 0 0-.092-1.307l-.188-.188a1 1 0 0 0-1.307-.092l-.308.23c-.325.244-.763.258-1.136.095a5.185 5.185 0 0 0-.167-.07c-.378-.15-.676-.47-.732-.874l-.087-.632Z" />
			<path d="M13.25 12a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z" />
		</>
	);
};

Icon.Exit = () => {
	return (
		<path d="m15.75 8.75 3.5 3.25-3.5 3.25M19 12h-8.25M15.25 4.75h-8.5a2 2 0 0 0-2 2v10.5a2 2 0 0 0 2 2h8.5" />
	);
};

Icon.Menu = () => {
	return (
		<path d="M4.75 5.75h14.5M4.75 18.25h14.5M4.75 12h14.5"/>
	)
}

Icon.Close = () => {
	return (
		<path d="m17.25 6.75-10.5 10.5M6.75 6.75l10.5 10.5"/>
	)
}

Icon.Play = () => {
	return (
		<>
			<path d="M4.75 6.75a2 2 0 0 1 2-2h10.5a2 2 0 0 1 2 2v10.5a2 2 0 0 1-2 2H6.75a2 2 0 0 1-2-2V6.75Z"/>
			<path d="m15.25 12-5.5-3.25v6.5l5.5-3.25Z"/>
		</>
	)
}

Icon.Stop = () => {
	return (
		<rect width="12.5" height="12.5" x="5.75" y="5.75" rx="1" />
	)
}

Icon.FilePlus = () => {
	return (
		<>
			<path d="M11.25 19.25h-3.5a2 2 0 0 1-2-2V6.75a2 2 0 0 1 2-2H14L18.25 9v2.25M17 14.75v4.5M19.25 17h-4.5"/>
			<path d="M18 9.25h-4.25V5"/>
		</>
	)
}

Icon.Files = () => {
	return (
		<path d="M9.75 6.75h-3a2 2 0 0 0-2 2v8.5a2 2 0 0 0 2 2h6.5a2 2 0 0 0 2-2v-5m-5.5-5.5 5.5 5.5m-5.5-5.5v3.5a2 2 0 0 0 2 2h3.5m-3.5-7.5h2l5.5 5.5v5a2 2 0 0 1-2 2H15.5"/>
	)
}

export { Icon };
