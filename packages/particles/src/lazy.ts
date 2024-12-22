import { hideParticles, showParticles } from './particles';

const getParticles = () => import('./tsparticles');

const showParticlesLazy = showParticles.bind({
  getParticles
});

export {
  showParticlesLazy as showParticles,
  hideParticles
}
