
import novely from '@novely/solid-renderer/dist/styles/index.css';
import normalize from 'modern-normalize';

const style = () => {
  for (const [element, style] of [[document.createElement('style'), normalize], [document.createElement('style'), novely]] as const) {
    document.head.append(element);
    element.innerHTML = style;
  }
}

export { style }
