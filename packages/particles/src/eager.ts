import { hideParticles, showParticles } from './particles';
import { loadSlim, tsParticles } from './tsparticles';

const getParticles = () => Promise.resolve({
  loadSlim,
  tsParticles
});

const showParticlesEager = showParticles.bind({
  getParticles
});

export {
  showParticlesEager as showParticles,
  hideParticles
}
