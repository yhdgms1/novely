import type { TypewriterSpeed } from '@novely/core';

const TEXT_SPEED_MAP = {
	Slow: () => 450,
	Medium: () => 300,
	Fast: () => 150,
	Auto: () => Math.random() * (450 - 150) + 150,
} satisfies Record<TypewriterSpeed, () => number>;

export { TEXT_SPEED_MAP };
