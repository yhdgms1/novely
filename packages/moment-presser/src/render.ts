import type { Variables } from './css-variables'
import { scheldue } from './render-schelduer'
import { random, clamp, max, sin, cos, PI, TWO_PI, PI_OVER_TWO } from './math'

const st = PI + PI / 6;
const ed = TWO_PI - PI / 6;

const createTarget = (start?: number) => {
  const outerWidth = PI / 4;
  const outerStart = start || random(st, ed - outerWidth);
  const outerEnd = outerStart + outerWidth;

  const innerWidth = PI / 12;
  const innerStart = outerStart + outerWidth / 2 - innerWidth / 2;
  const innerEnd = innerStart + innerWidth;

  return {
    outerStart,
    outerWidth,
    outerEnd,

    innerStart,
    innerWidth,
    innerEnd
  }
}

const createRem = (fontSize: number) => {
  const rem = (value: number) => {
    // Floor for performance reasons
    return Math.floor(fontSize * value);
  }

  return rem;
}

const getAngle = (at: number) => {
  return st + ((ed - st) * at);
}

const arc = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, radius: number, start: number, end: number, width: number, color: string) => {
  const cx = canvas.width / 2;
  const cy = canvas.height;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, start, end);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

type RenderStaticCicleObjects = {
  variables: Variables;
  fontSize: number;

  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  get: () => number | undefined;
}

const renderStaticObjects = ({ canvas, ctx, fontSize, variables, get }: RenderStaticCicleObjects) => {
  const { innerStart, innerEnd, outerStart, outerEnd } = createTarget(get());
  const rem = createRem(fontSize);

  const strokeWidth = rem(6.125);

  const d = max(canvas.width, canvas.height)
  const r = d / 2 - strokeWidth;

  const cx = canvas.width / 2;
  const cy = canvas.height;

  // Main Arc
  arc(canvas, ctx, r, PI, TWO_PI, strokeWidth, variables.mainArcBackground)
  // Inner Arc
  arc(canvas, ctx, r - strokeWidth / 2 - rem(0.313), PI, TWO_PI, rem(0.313), variables.innerArcBackground)
  // Outer Arc
  arc(canvas, ctx, r + strokeWidth / 2 + rem(0.313), PI, TWO_PI, rem(0.313), variables.outerArcBackground)

  const pillarWidth = rem(0.25);
  const pillarHeight = strokeWidth - rem(0.625);

  ctx.fillStyle = variables.pillarBackground

  for (let i = 0; i < 7; i++) {
    ctx.save();

    const angle = getAngle(i / 6);

    ctx.translate(
      cx + r * Math.cos(angle),
      cy + r * Math.sin(angle)
    );

    ctx.rotate(angle - PI_OVER_TWO);

    ctx.beginPath();
    ctx.roundRect(-pillarWidth / 2, -pillarHeight / 2, pillarWidth, pillarHeight, rem(0.313));
    ctx.fill()

    ctx.restore();
  }

  // Outer Golden
  arc(canvas, ctx, r, outerStart, outerEnd, strokeWidth, variables.wideMatchZoneBackground)
  // Inner Golden
  arc(canvas, ctx, r, innerStart, innerEnd, strokeWidth, variables.narrowMatchZoneBackground)
}

type StartRenderOptions = {
  variables: Variables;
  fontSize: number;

  preview: boolean;

  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  staticCanvas: HTMLCanvasElement;
  staticCtx: CanvasRenderingContext2D;

  set: (start: number) => void;
  get: () => number | undefined;
}

const startRender = ({ preview, canvas, ctx, staticCanvas, staticCtx, fontSize, variables, set, get }: StartRenderOptions) => {
  let position = 0
  let direction: 'right' | 'left' = 'right'

  const rem = createRem(fontSize);

  const { innerStart, innerEnd, outerStart, outerEnd } = createTarget(get());

  set(outerStart);

  renderStaticObjects({
    variables,
    fontSize,

    canvas: staticCanvas,
    ctx: staticCtx,

    get
  })

  /**
   * 1. Pillar is not rendered
   * 2. Get state is always miss
   * 2.1 Should never be called
   * 2.2 Start position is zero, target zone is never zero
   */
  if (preview) {
    return {
      stop: () => {},
      getState: () => 'MISS' as const
    }
  }

  const strokeWidth = rem(6.125);

  const stop = scheldue((_, dtm) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const d = max(canvas.width, canvas.height)
    const r = d / 2 - strokeWidth;

    const cx = canvas.width / 2;
    const cy = canvas.height;

    const pillarWidth = rem(0.25);
    const pillarHeight = strokeWidth - rem(0.625);

    /**
     * Aim
     */
    ctx.fillStyle = variables.aimBackground;

    ctx.save();

    direction = position >= 1 ? 'left' : position <= 0 ? 'right' : direction;

    const angle = getAngle(position);

    ctx.translate(
      cx + r * cos(angle),
      cy + r * sin(angle)
    );

    ctx.rotate(angle - PI_OVER_TWO);

    ctx.beginPath();
    ctx.roundRect(-pillarWidth / 2, -pillarHeight / 2, pillarWidth * 3, pillarHeight, rem(0.313));
    ctx.fill()

    ctx.restore();

    const change = dtm * (direction === 'right' ? 0.01 : -0.01);

    position = clamp(0, position + change, 1);
  })

  const getState = () => {
    const angle = getAngle(position)

    if (angle >= innerStart && angle <= innerEnd) {
      return 'PERFECT'
    }

    if (angle >= outerStart && angle <= outerEnd) {
      return 'PASS'
    }

    return 'MISS'
  }

  return {
    stop,
    getState
  }
}

export { startRender, renderStaticObjects }
