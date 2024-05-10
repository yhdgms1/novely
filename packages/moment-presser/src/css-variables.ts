type Variables = {
  mainArcBackground: string;
  innerArcBackground: string;
  outerArcBackground: string;
  pillarBackground: string;
  wideMatchZoneBackground: string;
  narrowMatchZoneBackground: string;
  aimBackground: string;
}

const parseVariables = (element: HTMLElement) => {
  const style = getComputedStyle(element);

  const get = (property: string, fallback: string) => {
    return style.getPropertyValue(property) || fallback;
  }

  return {
    mainArcBackground: get('--moment-presser-main-arc-background', '#6c868950'),
    innerArcBackground: get('--moment-presser-inner-arc-background', '#c4c3b5'),
    outerArcBackground: get('--moment-presser-outer-arc-background', '#c4c3b5'),
    pillarBackground: get('--moment-presser-pillar-background', '#c4c3b5aa'),
    wideMatchZoneBackground: get('--moment-presser-wide-match-zone-background', '#eaecb7'),
    narrowMatchZoneBackground: get('--moment-presser-narrow-match-zone-background', '#ffc040'),
    aimBackground: get('--moment-presser-narrow-match-zone-background', '#ffffff'),
  }
}

export { parseVariables }
export type { Variables }
