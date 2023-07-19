const defaultSpeed = () => {
  return Math.min(90 * Math.random() + 100, 90);
};

const collectTextNodes = (el: HTMLElement | ChildNode | Node) => {
  const items: ChildNode[] = [];

  el.childNodes.forEach((child) => {
    if (child.nodeName === "#text") items.push(child);
    else items.push(...collectTextNodes(child));
  });

  return items;
};

export { defaultSpeed, collectTextNodes };
