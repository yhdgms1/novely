import type { TypewriterSpeed } from '@novely/core';
import type { SettingsIcons } from './types';

const TEXT_SPEED_MAP: Record<TypewriterSpeed, (() => number) | undefined> = {
	Slow: () => 120,
	Medium: () => 90,
	Fast: () => 60,
	Auto: undefined,
};

const svg = (children: string) => {
	return `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">${children}</svg>`
}

const settingsIcons: SettingsIcons = {
	language: svg('<circle cx="12" cy="12" r="7.25" /><path d="M15.25 12c0 4.5-2.007 7.25-3.25 7.25-1.243 0-3.25-2.75-3.25-7.25S10.757 4.75 12 4.75c1.243 0 3.25 2.75 3.25 7.25ZM5 12h14" />'),
	typewriter_speed: svg('<path d="M4.75 17.25 8 6.75l3.25 10.5M6 14.25h4M19.25 14.5a2.75 2.75 0 1 1-5.5 0 2.75 2.75 0 0 1 5.5 0ZM19.25 11.75v5.5" />'),
	music_volume: svg('<circle cx="7" cy="17" r="2.25" /><path d="M9.25 17V6.75a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2V14"/><circle cx="17" cy="14" r="2.25" />'),
	sound_volume: svg('<path d="M15.75 10.75s.5.484.5 1.25-.5 1.25-.5 1.25M17.75 7.75s1.5 1.25 1.5 4.249c0 2.998-1.5 4.25-1.5 4.25M13.25 4.75l-4.75 4H5.75a1 1 0 0 0-1 1v4.5a1 1 0 0 0 1 1H8.5l4.75 4V4.75Z"/>'),
	voice_volume: svg('<path d="M5.75 19.25v-.509a2 2 0 0 1 1.588-1.957l1.521-.32a1.752 1.752 0 0 0 1.391-1.714m8 4.5v-.509a2 2 0 0 0-1.588-1.957l-1.521-.32a1.751 1.751 0 0 1-1.391-1.714m-3.905-.467c-1.255-1.27-2.23-3.138-2.08-4.947C7.977 6.808 9.035 4.75 12 4.75c2.963 0 4.022 2.058 4.233 4.586.156 1.865-.706 3.792-2.017 5.062-1.234 1.197-3.161 1.109-4.37-.115Z"/>')
}

export { TEXT_SPEED_MAP, settingsIcons };
