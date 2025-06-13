import type { showParticles } from '@novely/particles';

type ParticleOptions = Parameters<typeof showParticles>[0];

const particles = {
  particles: {
    number: {
      value: 100,
      density: {
        enable: true,
      },
    },
    color: {
      value: '#e9db8e',
    },
    opacity: {
      value: 0.930,
      animation: {
        enable: true,
        speed: 1,
        startValue: 'min',
        sync: false,
      },
    },
    size: {
      value: 3,
      animation: {
        enable: false,
        speed: 4,
        startValue: 'min',
        sync: false,
      },
    },
    move: {
      enable: true,
      speed: 3.017,
      direction: 'none',
      random: true,
      straight: false,
      outModes: 'out',
      attract: {
        enable: false,
        rotate: {
          x: 1042.218,
          y: 600
        },
      },
    },
  },
	retina_detect: true,
} satisfies ParticleOptions;

export { particles }
export type { ParticleOptions }
