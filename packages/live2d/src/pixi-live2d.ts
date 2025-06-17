import { extensions } from '@pixi/core';
import { Application } from '@pixi/app';
import { Ticker, TickerPlugin } from '@pixi/ticker';
import { InteractionManager } from '@pixi/interaction';
import { Live2DModel, Cubism4ModelSettings } from 'pixi-live2d-display/cubism4';

Live2DModel.registerTicker(Ticker);

extensions.add(TickerPlugin, InteractionManager);

export { Application, Live2DModel, Cubism4ModelSettings };
