export const snow = {
	particles: {
		number: {
			value: 202,
			density: {
				enable: true,
				value_area: 800,
			},
		},
		color: {
			value: '#e9db8e',
		},
		opacity: {
			value: 0.9299789953020032,
			random: true,
			anim: {
				enable: true,
				speed: 1,
				opacity_min: 0,
				sync: false,
			},
		},
		size: {
			value: 3,
			random: true,
			anim: {
				enable: false,
				speed: 4,
				size_min: 0.3,
				sync: false,
			},
		},
		move: {
			enable: true,
			speed: 3.017060304327615,
			direction: 'none',
			random: true,
			straight: false,
			out_mode: 'out',
			bounce: false,
			attract: {
				enable: false,
				rotateX: 1042.21783956259,
				rotateY: 600,
			},
		},
	},
	interactivity: {
		detect_on: 'canvas',
		events: {
			onhover: {
				enable: true,
				mode: 'bubble',
			},
			onclick: {
				enable: true,
				mode: 'repulse',
			},
			resize: true,
		},
		modes: {
			bubble: {
				distance: 250,
				size: 0,
				duration: 2,
				opacity: 0,
				speed: 3,
			},
			repulse: {
				distance: 400,
				duration: 0.4,
			},
		},
	},
	retina_detect: true,
} as const;
