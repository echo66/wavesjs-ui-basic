'use strict';


function Layer(dataType, data, options) {
	/**
	 * Structure of the DOM view of a Layer
	 *
	 * <g class="layer"> Flip y axis, timeContext.start and top position from params are applied on this elmt
	 *   <svg class="bounding-box"> timeContext.duration is applied on this elmt
	 *    <g class="layer-interactions"> Contains the timeContext edition elements (a segment)
	 *    </g>
	 *    <g class="offset items"> The shapes are inserted here, and we apply timeContext.offset on this elmt
	 *    </g>
	 *   </svg>
	 * </g>
	 */

	EventEmitter.call(this);

	if (options == undefined)
		options = {};

	this.dataType = dataType; // 'entity' || 'collection';
    this._data = data;
    

    const defaults = {
      height: 100,
      top: 0,
      id: '',
      yDomain: [0, 1],
      opacity: 1,
      debugContext: false, // pass the context in debug mode
      contextHandlerWidth: 2
    };

    this.params = Object.assign({}, defaults, options);
    this.timeContext = null;

    // container elements
    this.$el = null; // offset group of the parent context
    this.$boundingBox = null;
    this.$offset = null;
    this.$interactions = null;

    this.d3items = null; // d3 collection of the layer items

    this._shapeConfiguration = null; // { ctor, accessors, options }
    this._commonShapeConfiguration = null; // { ctor, accessors, options }

    this._$itemShapeMap = new Map(); // item group <DOMElement> => shape
    this._$itemD3SelectionMap = new Map(); // item group <DOMElement> => shape
    this._$itemCommonShapeMap = new Map(); // one entry max in this map

    this._isContextEditable = false;
    this._behavior = null;

    this._yScale = d3.scale.linear()
						  .domain(this.params.yDomain)
						  .range([0, this.params.height]);

    this.contextBehavior = '';

    // initialize timeContext layout
    this._renderContainer();

    // creates the timeContextBehavior for all layer, lazy instanciation

    this.timeContextBehavior = null;
	this.timeContextBehaviorCtor = TimeContextBehavior;

	if (this.timeContextBehavior === null) {
		this.timeContextBehavior = new this.timeContextBehaviorCtor();
    }


	Object.defineProperties(this, {

		'ns' : {
			get : function() {
				return "http://www.w3.org/2000/svg";
			}
		},

		'start' : {
			get : function() {
				return this.timeContext.start;
			}, 

			set : function(value) {
				this.timeContext.start = value;
			}
		}, 

		'offset' : {
			get : function() {
				return this.timeContext.offset;
			},

			set : function(value) {
				this.timeContext.offset = value;
			}
		}, 
		
		'duration' : {
			get : function() {
				return this.timeContext.duration;
			},

			set : function(value) {
				this.timeContext.duration = value;
			}
		}, 

		'stretchRatio' : {
			get : function() {
				return this.timeContext.stretchRatio;
			},

			set : function(value) {
				this.timeContext.stretchRatio = value;
			}
		}, 

		'yDomain' : {
			set : function(domain) {
				this.params.yDomain = domain;
				this._yScale.domain(domain);
			},

			get : function() {
				return this.params.yDomain;
			}
		},

		'opacity' : {
			set: function(value) {
				this.params.opacity = value;
			},

			get : function() {
				return this.params.opacity;
			}
		}, 

		'data' : {
			get : function() { 
				return this._data; 
			},

			set : function(data) {
				switch (this.dataType) {
					case 'entity':
						if (this._data) {  
						// if data already exists, reuse the reference
							this._data[0] = data;
						} else {
							this._data = [data];
						}
						break;
					case 'collection':
						this._data = data;
						break;
				}
			}
		}, 

		'selectedItems' : {
			get : function() {
				return (this._behavior) ? this._behavior.selectedItems : [];
			}
		}
		
	});
	
}

Layer.prototype = Object.create(EventEmitter.prototype);

Layer.prototype.constructor = Layer;

// private item -> id map to force d3 tp keep in sync with the DOM
Layer.prototype._counter = 0;
Layer.prototype._datumIdMap = new Map();


/**
 *  render the DOM in memory on layer creation to be able to use it before
 *  the layer is actually inserted in the DOM
 */
Layer.prototype._renderContainer = function() {
	// wrapper group for `start, top and context flip matrix
	this.$el = document.createElementNS("http://www.w3.org/2000/svg", 'g');
	this.$el.classList.add('layer');

	// clip the context with a `svg` element
	this.$boundingBox = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
	this.$boundingBox.classList.add('bounding-box');

	// group to apply offset
	this.$offset = document.createElementNS("http://www.w3.org/2000/svg", 'g');
	this.$offset.classList.add('offset', 'items');

	// context interactions
	this.$interactions = document.createElementNS("http://www.w3.org/2000/svg", 'g');
	this.$interactions.classList.add('interactions');
	// this.$interactions.style.display = 'none';

	// @NOTE: works but king of ugly... should be cleaned
	this.contextShape = new Segment();
	this.contextShape.install({
		opacity: function() { 
			return 0.1; 
		}.bind(this), 
		color  : function() { 
			return '#787878'; 
		}.bind(this), 
		width  : function() { 
			return this.timeContext.duration; 
		}.bind(this),
		height : function() { 
			return this._renderingContext.yScale.domain()[1]; 
		}.bind(this),
		y      : function() { 
			return this._renderingContext.yScale.domain()[0]; 
		}.bind(this)
	});

	this.$interactions.appendChild(this.contextShape.render());
	
	// create the DOM tree
	this.$el.appendChild(this.$boundingBox);
	this.$boundingBox.appendChild(this.$offset);
	this.$boundingBox.appendChild(this.$interactions);

	// draw a Segment in context background to debug it's size
	if (this.params.debug) {
		this.$debugRect = document.createElementNS("http://www.w3.org/2000/svg", 'Segment');
		this.$boundingBox.appendChild(this.$debugRect);
		this.$debugRect.style.fill = '#ababab';
		this.$debugRect.style.fillOpacity = 0.1;
	}
}

// --------------------------------------
// Component Configuration
// --------------------------------------

/**
 *  Register the shape and its accessors to use in order to render
 *  the entity or collection
 *  @param ctor <Function:BaseShape> the constructor of the shape to be used
 *  @param accessors <Object> accessors to use in order to map the data structure
 */
Layer.prototype.configureShape = function(ctor, accessors, options) {

	if (accessors == undefined)
		accessors = {};

	if (options == undefined)
		options = {};

	this._shapeConfiguration = { ctor: ctor, accessors: accessors, options: options };
}

/**
 *  Register the shape to use with the entire collection
 *  example: the line in a beakpoint function
 *  @param ctor {BaseShape} the constructor of the shape to use to render data
 *  @param accessors {Object} accessors to use in order to map the data structure
 */
Layer.prototype.configureCommonShape = function(ctor, accessors, options) {

	if (accessors == undefined)
		accessors = {};

	if (options == undefined)
		options = {};

	this._commonShapeConfiguration =  { ctor: ctor, accessors: accessors, options: options };
}

/**
 *  Register the behavior to use when interacting with the shape
 *  @param behavior {BaseBehavior}
 */
Layer.prototype.setBehavior = function(behavior) {
	behavior.initialize(this);
	this._behavior = behavior;
}

/**
 *  update the values in `_renderingContext`
 *  is particulary needed when updating `stretchRatio` as the pointer
 *  to the `xScale` may change
 */
Layer.prototype._updateRenderingContext = function() {
	this._renderingContext.xScale = this.timeContext.xScale;
	this._renderingContext.yScale = this._yScale;
	this._renderingContext.height = this.params.height;
	this._renderingContext.width  = this.timeContext.xScale(this.timeContext.duration);
	// for foreign oject issue in chrome
	this._renderingContext.offsetX = this.timeContext.xScale(this.timeContext.offset);
}


Layer.prototype.select = function() {
	var _this = this;

    for (var _len = arguments.length, $items = Array(_len), _key = 0; _key < _len; _key++) {
		$items[_key] = arguments[_key];
    }

    if (!this._behavior) {
		return;
    }
    if (!$items.length) {
		$items = this.d3items.nodes();
    }

    $items.forEach(function ($el) {
		var item = _this._$itemD3SelectionMap.get($el);
		_this._behavior.select($el, item.datum());
		_this._toFront($el);
    });
}

Layer.prototype.unselect = function() {
	var _this = this;

	for (var _len = arguments.length, $items = Array(_len), _key = 0; _key < _len; _key++) {
		$items[_key] = arguments[_key];
	}

	if (!this._behavior) {
		return;
	}
	if (!$items.length) {
		$items = this.d3items.nodes();
	}

	$items.forEach(function ($el) {
		var item = _this._$itemD3SelectionMap.get($el);
		_this._behavior.unselect($el, item.datum());
	});
}

Layer.prototype.toggleSelection = function() {
	var _this = this;

	for (var _len = arguments.length, $items = Array(_len), _key = 0; _key < _len; _key++) {
		$items[_key] = arguments[_key];
	}

	if (!this._behavior) {
		return;
	}
	if (!$items.length) {
		$items = this.d3items.nodes();
	}

	$items.forEach(function ($el) {
		var item = _this._$itemD3SelectionMap.get($el);
		_this._behavior.toggleS$election($el, item.datum());
	});
}

Layer.prototype.edit = function($items, dx, dy, target) {
	var _this = this;

	if (!this._behavior) {
		return;
	}
	$items = !Array.isArray($items) ? [$items] : $items;

	$items.forEach(function ($el) {
		var item = _this._$itemD3SelectionMap.get($el);
		var shape = _this._$itemShapeMap.get($el);
		var datum = item.datum();
		_this._behavior.edit(_this._renderingContext, shape, datum, dx, dy, target);
		_this.emit("edit", shape, datum);
	});
}

/**
 *  draws the shape to interact with the context
 *  @params {Boolean} [bool=true] - defines if the layer's context is editable or not
 */
Layer.prototype.setContextEditable = function(bool) {

	if (bool == undefined) 
		bool = true;

	const display = (bool) ? 'block' : 'none';
	this.$interactions.style.display = display;
	this._isContextEditable = bool;

}

Layer.prototype.editContext = function(dx, dy, target) {
	timeContextBehavior.edit(this, dx, dy, target);
}

Layer.prototype.stretchContext = function(dx, dy, target) {
	timeContextBehavior.stretch(this, dx, dy, target);
}

// --------------------------------------
// Helpers
// --------------------------------------

/**
 *  Moves an `$el`'s group to the end of the layer (svg z-index...)
 *  @param `$el` {DOMElement} the DOMElement to be moved
 */
Layer.prototype._toFront = function($el) {
	this.$offset.appendChild($el);
}

/**
 *  Returns the d3 selection item to which the given DOMElement b$elongs
 *  @param `$el` {DOMElement} the element to be tested
 *  @return {DOMElement|null} item group containing the `$el` if b$elongs to this layer, null otherwise
 */
Layer.prototype.getItemFromDOMElement = function($el) {
	let $item;

	do {
		if ($el.classList && $el.classList.contains('item')) {
			$item = $el;
			break;
		}

		$el = $el.parentNode;
	} while ($el !== null);

	return this.hasItem($item) ? $item : null;
}

/**
 *  Returns the datum associated to a specific item DOMElement
 *  use d3 internally to retrieve the datum
 *  @param $item {DOMElement}
 *  @return {Object|Array|null} depending on the user data structure
 */
Layer.prototype.getDatumFromItem = function($item) {
	const d3item = this._$itemD3SelectionMap.get($item);
	return d3item ? d3item.datum() : null;
}

/**
 *  Defines if the given d3 selection is an item of the layer
 *  @param item {DOMElement}
 *  @return {bool}
 */
Layer.prototype.hasItem = function($item) {
	const nodes = this.d3items.nodes();
	return nodes.indexOf($item) !== -1;
}

/**
 *  Defines if a given element b$elongs to the layer
 *  is more general than `hasItem`, can be used to check interaction elements too
 *  @param $el {DOMElement}
 *  @return {bool}
 */
Layer.prototype.hasElement = function($el) {
	do {
		if ($el === this.$el) {
			return true;
		}

		$el = $el.parentNode;
	} while ($el !== null);

	return false;
}

/**
 *  @param area {Object} area in which to find the elements
 *  @return {Array} list of the DOM elements in the given area
 */
Layer.prototype.getItemsInArea = function(area) {
	const start    = this.timeContext.xScale(this.timeContext.start);
	const duration = this.timeContext.xScale(this.timeContext.duration);
	const offset   = this.timeContext.xScale(this.timeContext.offset);
	const top      = this.params.top;

	// be aware af context's translations - constrain in working view
	let x1 = Math.max(area.left, start);
	let x2 = Math.min(area.left + area.width, start + duration);
	x1 -= (start + offset);
	x2 -= (start + offset);

	// keep consistent with context y coordinates system
	let y1 = this.params.height - (area.top + area.height);
	let y2 = this.params.height - area.top;

	y1 += this.params.top;
	y2 += this.params.top;

	const itemShapeMap = this._$itemShapeMap;
	const renderingContext = this._renderingContext;

	const items = this.d3items.filter(function(datum, index) {
		const group = this;
		const shape = itemShapeMap.get(group);
		return shape.inArea(renderingContext, datum, x1, y1, x2, y2);
	});

	return items[0].slice(0);
}

// --------------------------------------
// Rendering / Display methods
// --------------------------------------

Layer.prototype.render = function() {
	var that = this;
	// force d3 to keep data in sync with the DOM with a unique id
	this.data.forEach(function(datum) {
		if (that._datumIdMap.has(datum)) { 
			return; 
		}
		that._datumIdMap.set(datum, that._counter++);
	});

	// select items
	this.d3items = d3.select(this.$offset)
								.selectAll('.item')
								.filter(function() {
									return !this.classList.contains('common');
								})
								.data(this.data, function(datum) {
									return that._datumIdMap.get(datum);
								});

	// render `commonShape` only once
	if (this._commonShapeConfiguration !== null && this._$itemCommonShapeMap.size === 0) {
		const ctor = this._commonShapeConfiguration.ctor;
		const accessors = this._commonShapeConfiguration.accessors;
		const options = this._commonShapeConfiguration.options;

		const $group = document.createElementNS("http://www.w3.org/2000/svg", 'g');
		const shape = new ctor(options);

		shape.install(accessors);
		$group.appendChild(shape.render());
		$group.classList.add('item', 'common', shape.getClassName());

		this._$itemCommonShapeMap.set($group, shape);
		this.$offset.appendChild($group);
	}

	// ... enter
	this.d3items.enter()
				.append(function(datum, index) {
					// @NOTE: d3 binds `this` to the container group
					const ctor = that._shapeConfiguration.ctor;
					const accessors = that._shapeConfiguration.accessors;
					const options = that._shapeConfiguration.options;
					const shape = new ctor(options);
					shape.install(accessors);

					const $el = shape.render(that._renderingContext);
					$el.classList.add('item', shape.getClassName());

					that._$itemShapeMap.set($el, shape);
					that._$itemD3SelectionMap.set($el, d3.select($el));

					return $el;
				});

	// ... exit
	const _$itemShapeMap = this._$itemShapeMap;
	const _$itemD3SelectionMap = this._$itemD3SelectionMap;

	this.d3items.exit()
				.each(function(datum, index) {
					const $el = this;
					const shape = _$itemShapeMap.get($el);
					// clean all shape/item references
					shape.destroy();
					that._datumIdMap.delete(datum);
					_$itemShapeMap.delete($el);
					_$itemD3SelectionMap.delete($el);
				})
				.remove();
}

/**
*  updates Context and Shapes
*/
Layer.prototype.update = function() {
	this.updateContainer();
	this.updateShapes();
}

/**
 *  updates the context of the layer
 */
Layer.prototype.updateContainer = function() {
	this._updateRenderingContext();

	const timeContext = this.timeContext;

	const width  = timeContext.xScale(timeContext.duration);
	// offset is relative to tim$eline's timeContext
	const x      = timeContext.parent.xScale(timeContext.start);
	const offset = timeContext.xScale(timeContext.offset);
	const top    = this.params.top;
	const height = this.params.height;
	// matrix to invert the coordinate system
	const translateMatrix = "matrix(1, 0, 0, -1, " + x + ", " + (x + height) + ")";

	this.$el.setAttributeNS(null, 'transform', translateMatrix);

	this.$boundingBox.setAttributeNS(null, 'width', width);
	this.$boundingBox.setAttributeNS(null, 'height', height);
	this.$boundingBox.setAttributeNS(null, 'opacity', this.params.opacity);

	this.$offset.setAttributeNS(null, 'transform', "translate(" + offset + ", 0)");

	// maintain context shape
	this.contextShape.update(this._renderingContext, this.$interactions, this.timeContext, 0);

	// debug context
	if (this.params.debug) {
		this.$debugRect.setAttributeNS(null, 'width', width);
		this.$debugRect.setAttributeNS(null, 'height', height);
	}
}

/**
 *  updates the Shapes which b$elongs to the layer
 *  @param item {DOMElement}
 */
Layer.prototype.updateShapes = function($item) {

	if ($item == undefined) 
		$item = null;

	this._updateRenderingContext();

	const that = this;
	const renderingContext = this._renderingContext;
	const items = $item !== null ? this._$itemD3SelectionMap.get($item) : this.d3items;

	// update common shapes
	this._$itemCommonShapeMap.forEach(function(shape, $item) {
		shape.update(renderingContext, this.data);
	});

	// d3 update - entity or collection shapes
	items.each(function(datum, index) {
		const shape = that._$itemShapeMap.get(this);
		shape.update(renderingContext, this, datum, index);
	});
}

/**
 * @mandatory define the context in which the layer is drawn
 * @param context {TimeContext} the timeContext in which the layer is displayed
 */
Layer.prototype.setTimeContext = function(timeContext) {
	this.timeContext = timeContext;
	// create a mixin to pass to the shapes
	this._renderingContext = {};
	this._updateRenderingContext();
}