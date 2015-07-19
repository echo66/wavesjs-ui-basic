'use strict'

/**
* As a temporal representation, a track establishes a relation between *time* in seconds and *space* in pixels.
*
* A `Track` instance can have multiple `Layer` instances.
* A comon use case is to have all the tracks from a `Timeline` instance sharing the same `pixelsPerSecond` and `offset` attributes.
*
* Tracks inside a timeline
*
* A temporal representation can be rendered upon multiple DOM elements, the tracks (eg multiple <li> for a DAW like representation) that belong to the same timeline using the `add` method. These tracks are like windows on the overall and basically unending timeline. They have a defined width and they show content from the specified offset (converted to pixel).
*
* A timeline with 3 tracks:
*
* +-----------------+-------------------------------+-- - -  -  -   -
* |track 1          |xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx|
* +-----------------+-------------------------------+-- - -  -  -   -
* |track 2          |xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx|
* +-----------------+-------------------------------+-- - -  -  -   -
* |track 3          |xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx|
* +-------------------------------------------------+-- - -  -  -   -
*
* +----------------->
* timeline.timeContext.xScale(timeline.timeContext.offset)
*
*                   <------------------------------->
*                   timeline's tracks defaults to 1000px
*                   with a default pixelsPerSecond of 100px/s.
*                   and a default `stretchRatio = 1`
*                   track1 shows 10 seconds of the timeline
*
* Layers inside a track
*
* Within a track, a `Layer` keeps up-to-date and renders the data. The track's `add` method adds a `Layer` instance to a track. A Layer
*
* The track renderingContext
*
* When one modify the timeline renderingContext:
* - timeline.renderingContext.offset (in seconds) modify the containers track x position
* - timeline.renderingContext.stretchRatio modify timeline's zoom
* Each time you set new value of offset or stretchRatio, you need to do `timeline.update()` to update the values.
* Track SVG structure
* <svg>
*  <defs> Unused for the moment, could be used to define custom shapes for use with layers
*  </defs>
*  <g class="offset">
*   <g class="layout"> The layers are inserted here
*   </g>
*  </g>
*  <g class="interactions"> Placeholder to visualize interactions (eg. brush)
*  </g>
* </svg>
*/

function Track($el, height) {

  if (height == undefined) 
    height = 120;

  this.$el = $el;
  this.layers = [];
  this._height = height;

  // are set when added to the timeline
  this.renderingContext = null;

  this._createContainer();


  Object.defineProperties(this, {
    'ns' : {
      get : function() {
        return 'http://www.w3.org/2000/svg';
      }
    }, 
    'height' : {
      get : function() {
        return this._height;
      }, 
      set : function(value) {
        this._height = value;
        // @NOTE: propagate to layers, keeping ratio ?
      }
    }
  });

  // TODO: TRANSLATE THIS INTO "NORMAL" JAVASCRIPT
  // *[Symbol.iterator]() {
  //   yield* this.layers[Symbol.iterator]()
  // }
}

/**
 *  This method is called when the track is added to the timeline
 *  The track cannot be updated without being added to a timeline
 */
Track.prototype.configure = function(renderingContext) {
  this.renderingContext = renderingContext;
}

/**
 *  Destroy a track
 *  The layers from this track can still be reused elsewhere
 */
Track.prototype.destroy = function() {
  // detatch everything from the DOM
  this.$el.removeChild(this.$svg);
  this.layers.forEach(function(layer) { 
    this.$layout.removeChild(layer.$el) 
  });
  // clean references
  this.$el = null;
  this.renderingContext = null;
  this.layers.length = 0;
}

/**
 *  Creates the container for the track
 */
Track.prototype._createContainer = function() {
  const $svg = document.createElementNS(this.ns, 'svg');
  $svg.setAttributeNS(null, 'shape-rendering', 'optimizeSpeed');
  $svg.setAttribute('xmlns:xhtml', 'http://www.w3.org/1999/xhtml');

  const $defs = document.createElementNS(this.ns, 'defs');

  const $offsetGroup = document.createElementNS(this.ns, 'g');
  $offsetGroup.classList.add('offset');

  const $layoutGroup = document.createElementNS(this.ns, 'g');
  $layoutGroup.classList.add('layout');

  const $interactionsGroup = document.createElementNS(this.ns, 'g');
  $interactionsGroup.classList.add('interactions');

  $svg.appendChild($defs);
  $offsetGroup.appendChild($layoutGroup);
  $svg.appendChild($offsetGroup);
  $svg.appendChild($interactionsGroup);

  this.$el.appendChild($svg);
  // removes additionnal height added who knows why...
  this.$el.style.fontSize = 0;
  // fixes one of the (many ?) weird canvas rendering bugs in Chrome
  this.$el.style.transform = 'translateZ(0)';

  this.$layout = $layoutGroup;
  this.$offset = $offsetGroup;
  this.$interactions = $interactionsGroup;
  this.$svg = $svg;
}

/**
 * Adds a layer to the track
 */
Track.prototype.add = function(layer) {
  this.layers.push(layer);
  // Create a default renderingContext for the layer if missing
  this.$layout.appendChild(layer.$el);
}

/**
 * Removes a layer
 */
Track.prototype.remove = function(layer) {
  this.layers.splice(this.layers.indexOf(layer), 1);
  // Removes layer from its container
  this.$layout.removeChild(layer.$el);
}

/**
 * Draw tracks, and the layers in cascade
 */
Track.prototype.render = function() {
  for (let layer of this) { 
    layer.render(); 
  }
}

/**
 * Update the layers
 */
Track.prototype.update = function(layers) {
  if (layers == undefined)
    layers = null;
  this.updateContainer();
  this.updateLayers(layers);
}

Track.prototype.updateContainer = function() {
  const $svg = this.$svg;
  const $offset = this.$offset;
  // should be in some update layout
  const renderingContext = this.renderingContext;
  const height  = this.height;
  const width   = renderingContext.visibleWidth;
  const offsetX = renderingContext.xScale(renderingContext.offset);
  const translate = "translate(" + offsetX + ", 0)";

  $svg.setAttributeNS(null, 'height', height);
  $svg.setAttributeNS(null, 'width', width);
  $svg.setAttributeNS(null, 'viewbox', "0 0 " + width + " " + height + "");

  $offset.setAttributeNS(null, 'transform', translate);
}

Track.prototype.updateLayers = function(layers) {

  if (layers == undefined) 
    layers = null;

  layers = (layers === null) ? this.layers : layers;

  layers.forEach(function(layer) {
    if (this.layers.indexOf(layer) === -1) { 
      return; 
    }
    layer.update();
  });
}