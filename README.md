# machine-learning-blackhole-game
Personal project to learn the basics of BabylonJS and Neural Networks with Genetic Algorithm.

It doesn't require a server. Just open the `index.html` in a modern browser.

Single player included (and working well).

The Machine Learning is not functional yet. The current implementation has the X and Y coordinates of the "targets" as inputs and uses 2 outputs to multiply the width and height of the screen. The result is almost always the same: the bots love the top of the screen (:P).

A better logic for the inputs could be the result of rayscasts and 2 outputs to decide if it should go up/down and right/left, but the performance suffers a lot when the number of raycasts increase.



## Inspired by:

<dl>
  <dt>Missile Game</dt>
  <dd>https://github.com/bwhmather/missile-game</dd>

  <dt>Machine Learning for Flappy Bird using Neural Network and Genetic Algorithm</dt>
  <dd>https://github.com/ssusnic/Machine-Learning-Flappy-Bird</dd>

  <dt>Jabrils</dt>
  <dd>https://www.youtube.com/channel/UCQALLeQPoZdZC4JNUboVEUg</dd>
</dl>



## Frameworks/Tools:

<dl>
  <dt>BabylonJS</dt>
  <dd>https://www.babylonjs.com/</dd>

  <dt>Synaptic</dt>
  <dd>http://caza.la/synaptic/</dd>

  <dt>Handlebars.js</dt>
  <dd>https://handlebarsjs.com/</dd>
</dl>
