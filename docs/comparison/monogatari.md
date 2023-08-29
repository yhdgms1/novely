# Monogatari

Novely was inspired by Monogatari, another Visual Novel Engine. But they have major differences.

## Modularity

Novely was built with modularity in mind. Some things are optional, like particles. We believe that developers themselves should be able to choose the library for their effects, or write the logic themselves.

The developer can change some parts of the engine. For example, our rendering system is based on the fact that logic is managed by `core` and visual design by some `renderer`. If desired, the engine can even be run in the Terminal.

Also, as an afterthought, modularity avoids overweighting the game. Therefore, loading will be faster.

## Proprietary

Monogatari uses its own set of packages called [aegis-framework](https://aegisframework.com/) to render the game. Our main renderer is written in [SolidJS](https://www.solidjs.com/). And SolidJS is developed and supported by the community

## Clean

When going backwards (Happens when pressing the "Back" button), Novely restarts the entire game from the beginning, restarting the necessary actions and functions. That way developers can focus on writing the mechanics of the game, rather than how to make undoing an action when you go backwards, as in this [example](https://developers.monogatari.io/documentation/script-actions/javascript#reversible-functions).

## Translation

Monogatari requires you to [repeat](https://developers.monogatari.io/documentation/configuration-options/game-configuration/internationalization) the same story but for another language. In Novely you can declare translations alongside each other in one single story.

## Reliability

Novely is a relatively new engine, while Monogatari is quite popular in the js community and has shown its reliability.

## Community

Monogatari has community, we dont. :(