import { extensions } from '@pixi/core';
import { Application } from '@pixi/app';
import { Ticker, TickerPlugin } from '@pixi/ticker';
import { InteractionManager } from '@pixi/interaction';
import { Live2DModel } from 'pixi-live2d-display/cubism4';

Live2DModel.registerTicker(Ticker);

extensions.add(TickerPlugin, InteractionManager);

export const getModel = Live2DModel.from.bind(Live2DModel);
export { Application };
