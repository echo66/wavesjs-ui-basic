'use strict';

// private item -> id map to force d3 tp keep in sync with the DOM
Layer._counter = 0;
Layer._datumIdMap = new Map();

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
	this.data = data;

	const defaults = {
		height: 100,
		top: 0,
		id: '',
		yDomain: [0, 1],
		opacity: 1,
		debugContext: false, // pass the context in debug mode
		contextHandlerWidth: 2
	};

	this.ns = "http://www.w3.org/2000/svg";

	this.params = Object.assign({}, defaults, options);
	this.timeContext = null;

	this.container = null; // offset group of the parent context
	this.group = null; // group created by the layer inside the context
	this.d3items = null; // d3 collection of the layer items

	this._shapeConfiguration = null; // { ctor, accessors, options }
	this._commonShapeConfiguration = null; // { ctor, accessors, options }

	this._itemElShapeMap = new Map(); // item group <DOMElement> => shape
	this._itemElD3SelectionMap = new Map(); // item group <DOMElement> => shape
	this._itemCommonShapeMap = new Map(); // one entry max in this map

	this._isContextEditable = false;
	this._behavior = null;

	this._yScale = d3Scale.linear()
						.domain(this.params.yDomain)
						.range([0, this.params.height]);

	// initialize timeContext layout
	this._renderContainer();




	// destroy() {
	//   this.timeContext = null;
	//   this.d3items = null;
	//   this.data = null;
	//   this.params = null;
	//   this._behavior = null;
	//
	//   // @TODO
	//      - clean Maps
	//      - clean listeners
	//   // can't do `this = null` from here...
	// }

	Object.defineProperties(this, {
		'yDomain' : {
			get : function() {
				return this.params.yDomain;
			}, 
			set : function(domain) {
				this.params.yDomain = domain;
				this._yScale.domain(domain);
			}
		}, 
		'opacity' : {
			get : function() {
				return this.params.opacity;
			}, 
			set : function(value) {
				this.params.opacity = value;
			}
		}, 
		'data' : {
			// --------------------------------------
			// Data
			// --------------------------------------
			get : function() {
				return this._data;
			}, 
			set : function(data) {
				switch (this.dataType) {
					case 'entity':
						if (this._data) {  // if data already exists, reuse the reference
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

	// destroy() {
	//   this.timeContext = null;
	//   this.d3items = null;
	//   this.data = null;
	//   this.params = null;
	//   this._behavior = null;
	//
	//   // @TODO
	//      - clean Maps
	//      - clean listeners
	//   // can't do `this = null` from here...
	// }

	/**
	 * @mandatory define the context in which the layer is drawn
	 * @param context {TimeContext} the timeContext in which the layer is displayed
	 */
	this.setTimeContext = function(timeContext) {
		this.timeContext = timeContext;
		// create a mixin to pass to the shapes
		this._renderingContext = {};
		this._updateRenderingContext();
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
	this.configureShape = function(ctor, accessors, options) {
		if (accessors == undefined)
			accessors = {};
		if (options == undefined)
			options = {};
		this._shapeConfiguration = { ctor, accessors, options };
	}

	/**
	 *  Register the shape to use with the entire collection
	 *  example: the line in a beakpoint function
	 *  @param ctor {BaseShape} the constructor of the shape to use to render data
	 *  @param accessors {Object} accessors to use in order to map the data structure
	 */
	this.configureCommonShape = function(ctor, accessors, options) {
		if (accessors == undefined)
			accessors = {};
		if (options == undefined)
			options = {};
		this._commonShapeConfiguration = { ctor: ctor, accessors: accessors, options: options };
	}

	/**
	 *  Register the behavior to use when interacting with the shape
	 *  @param behavior {BaseBehavior}
	 */
	this.setBehavior = function(behavior) {
		behavior.initialize(this);
		this._behavior = behavior;
	}

	/**
	*  update the values in `_renderingContext`
	*  is particulary needed when updating `stretchRatio` as the pointer
	*  to the `xScale` may change
	*/
	this._updateRenderingContext = function() {
		this._renderingContext.xScale = this.timeContext.xScale;
		this._renderingContext.yScale = this._yScale;
		this._renderingContext.height = this.params.height;
		this._renderingContext.width  = this.timeContext.xScale(this.timeContext.duration);
		// for foreign oject issue in chrome
		this._renderingContext.offsetX = this.timeContext.xScale(this.timeContext.offset);
	}

	// --------------------------------------
	// Behavior Accessors
	// --------------------------------------

	this.select = function() {
		var _this = this;

		for (var _len = arguments.length, itemEls = Array(_len), _key = 0; _key < _len; _key++) {
			itemEls[_key] = arguments[_key];
		}

		if (!this._behavior) {
			return;
		}
		if (!itemEls.length) {
			itemEls = this.d3items.nodes();
		}

		itemEls.forEach(function(el) {
			var item = _this._itemElD3SelectionMap.get(el);
			_this._behavior.select(el, item.datum());
			_this._toFront(el);
		});
	}

	this.unselect = function() {
		var _this = this;

		for (var _len = arguments.length, itemEls = Array(_len), _key = 0; _key < _len; _key++) {
			itemEls[_key] = arguments[_key];
		}

		if (!this._behavior) {
			return;
		}
		if (!itemEls.length) {
			itemEls = this.d3items.nodes();
		}

		itemEls.forEach(function (el) {
			var item = _this._itemElD3SelectionMap.get(el);
			_this._behavior.unselect(el, item.datum());
		});
	}

	this.toggleSelection = function() {
		var _this = this;

		for (var _len = arguments.length, itemEls = Array(_len), _key = 0; _key < _len; _key++) {
			itemEls[_key] = arguments[_key];
		}

		if (!this._behavior) {
			return;
		}
		if (!itemEls.length) {
			itemEls = this.d3items.nodes();
		}

		itemEls.forEach(function (el) {
			var item = _this._itemElD3SelectionMap.get(el);
			_this._behavior.toggleSelection(el, item.datum());
		});
	}

	this.edit = function(itemEls, dx, dy, target) {
		var _this = this;

		if (!this._behavior) {
			return;
		}
		itemEls = !Array.isArray(itemEls) ? [itemEls] : itemEls;

		itemEls.forEach(function (el) {
			var item = _this._itemElD3SelectionMap.get(el);
			var shape = _this._itemElShapeMap.get(el);
			var datum = item.datum();
			_this._behavior.edit(_this._renderingContext, shape, datum, dx, dy, target);
			_this.emit("edit", shape, datum);
		});
	}

	// --------------------------------------
	// Helpers
	// --------------------------------------

	/**
	 *  Moves an `el`'s group to the end of the layer (svg z-index...)
	 *  @param `el` {DOMElement} the DOMElement to be moved
	 */
	this._toFront = function(el) {
		this.group.appendChild(el);
	}

	/**
	 *  Returns the d3Selection item to which the given DOMElement belongs
	 *  @param `el` {DOMElement} the element to be tested
	 *  @return {DOMElelement|null} item group containing the `el` if belongs to this layer, null otherwise
	 */
	this.getItemFromDOMElement = function(el) {
		let itemEl;

		do {
			if (el.classList && el.classList.contains('item')) {
				itemEl = el;
				break;
			}
			el = el.parentNode;
		} while (el !== null);

		return this.hasItem(itemEl) ? itemEl : null;
	}

	/**
	 *  Returns the datum associated to a specific item DOMElement
	 *  use d3 internally to retrieve the datum
	 *  @param itemEl {DOMElement}
	 *  @return {Object|Array|null} depending on the user data structure
	 */
	this.getDatumFromItem = function(itemEl) {
		const d3item = this._itemElD3SelectionMap.get(itemEl);
		return d3item ? d3item.datum() : null;
	}

	/**
	 *  Defines if the given d3 selection is an item of the layer
	 *  @param item {DOMElement}
	 *  @return {bool}
	 */
	this.hasItem = function(itemEl) {
		const nodes = this.d3items.nodes();
		return nodes.indexOf(itemEl) !== -1;
	}

	/**
	 *  Defines if a given element belongs to the layer
	 *  is more general than `hasItem`, can be used to check interaction elements too
	 *  @param el {DOMElement}
	 *  @return {bool}
	 */
	this.hasElement = function(el) {
		do {
			if (el === this.container) {
				return true;
			}
			el = el.parentNode;
		} while (el !== null);

		return false;
	}

	/**
	 *  @param area {Object} area in which to find the elements
	 *  @return {Array} list of the DOM elements in the given area
	 */
	this.getItemsInArea = function(area) {
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

		const itemShapeMap = this._itemElShapeMap;
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

	/**
	 *  render the DOM in memory on layer creation to be able to use it before
	 *  the layer is actually inserted in the DOM
	 */
	this._renderContainer = function() {

		// wrapper group for `start, top and context flip matrix
		this.container = document.createElementNS(this.ns, 'g');
		this.container.classList.add('layer');

		// clip the context with a `svg` element
		this.boundingBox = document.createElementNS(this.ns, 'svg');
		this.boundingBox.classList.add('bounding-box');

		// group to apply offset
		this.group = document.createElementNS(this.ns, 'g');
		this.group.classList.add('offset', 'items');

		// context interactions
		this.interactionsGroup = document.createElementNS(this.ns, 'g');
		this.interactionsGroup.classList.add('layer-interactions');
		this.interactionsGroup.style.display = 'none';

		// @NOTE: works but king of ugly... should be cleaned
		this.contextShape = new Segment();
		this.contextShape.install({
			opacity: function() { return 0.1; },
			color  : function() { return '#787878'; },
			width  : function() { return this.timeContext.duration; },
			height : function() { return this._renderingContext.yScale.domain()[1]; },
			y      : function() { return this._renderingContext.yScale.domain()[0]; }
		});

		this.interactionsGroup.appendChild(this.contextShape.render());

		// create the DOM tree
		this.container.appendChild(this.boundingBox);
		this.boundingBox.appendChild(this.interactionsGroup);
		this.boundingBox.appendChild(this.group);

		// draw a Segment in context background to debug it's size
		if (this.params.debug) {
			this.debugRect = document.createElementNS(this.ns, 'Segment');
			this.boundingBox.appendChild(this.debugRect);
			this.debugRect.style.fill = '#ababab';
			this.debugRect.style.fillOpacity = 0.1;
		}
	}

	/**
	 *  Returns the previsouly created layer's container
	 *  @return {DOMElement}
	 */
	this.renderContainer = function() {
		return this.container;
	}

	/**
	*  Creates the DOM according to given data and shapes
	*/
	this.drawShapes = function() {
		// force d3 to keep data in sync with the DOM with a unique id
		this.data.forEach(function(datum) {
			if (Layer._datumIdMap.has(datum)) { 
				return; 
			}
			Layer._datumIdMap.set(datum, Layer._counter++);
		});

		// select items
		this.d3items = d3Selection.select(this.group)
									.selectAll('.item')
									.filter(function() {
										return !this.classList.contains('common');
									})
									.data(this.data, function(datum) {
										return Layer._datumIdMap.get(datum);
									});

		// render `commonShape` only once
		if (this._commonShapeConfiguration !== null && this._itemCommonShapeMap.size === 0 ) {
			
			const ctor = this._commonShapeConfiguration.ctor;
			const accessors = this._commonShapeConfiguration.accessors;
			const options = this._commonShapeConfiguration.options;

			const group = document.createElementNS(this.ns, 'g');
			const shape = new ctor(options);

			shape.install(accessors);
			group.appendChild(shape.render());
			group.classList.add('item', 'common', shape.getClassName());

			this._itemCommonShapeMap.set(group, shape);
			this.group.appendChild(group);
		}

		// ... enter
		this.d3items.enter()
					.append(function(datum, index) {
						// @NOTE: d3 binds `this` to the container group
						const ctor = this._shapeConfiguration.ctor;
						const accessors = this._shapeConfiguration.accessors;
						const options = this._shapeConfiguration.options;

						const shape = new ctor(options);
						shape.install(accessors);

						const el = shape.render(this._renderingContext);
						el.classList.add('item', shape.getClassName());
						this._itemElShapeMap.set(el, shape);
						this._itemElD3SelectionMap.set(el, d3Selection.select(el));

						return el;
					});

		// ... exit
		const _itemElShapeMap = this._itemElShapeMap;
		const _itemElD3SelectionMap = this._itemElD3SelectionMap;

		this.d3items.exit()
					.each(function(datum, index) {
						const el = this;
						const shape = _itemElShapeMap.get(el);
						// clean all shape/item references
						shape.destroy();
						Layer._datumIdMap.delete(datum);
						_itemElShapeMap.delete(el);
						_itemElD3SelectionMap.delete(el);
					})
					.remove();
	}

	/**
	 *  updates Context and Shapes
	 */
	this.update = function() {
		this.updateContainer();
		this.updateShapes();
	}

	/**
	 *  updates the context of the layer
	 */
	this.updateContainer = function() {
		this._updateRenderingContext();

		const width  = this.timeContext.xScale(this.timeContext.duration);
		// offset is relative to timeline's timeContext
		const x      = this.timeContext.parent.xScale(this.timeContext.start);
		const offset = this.timeContext.xScale(this.timeContext.offset);
		const top    = this.params.top;
		const height = this.params.height;
		// matrix to invert the coordinate system
		const translateMatrix = "matrix(1, 0, 0, -1, " + x + ", " + (top + height) + ")";

		this.container.setAttributeNS(null, 'transform', translateMatrix);

		this.boundingBox.setAttributeNS(null, 'width', width);
		this.boundingBox.setAttributeNS(null, 'height', height);
		this.boundingBox.style.opacity = this.params.opacity;

		this.group.setAttributeNS(null, 'transform', "translate(" + offset + ", 0)");

		// maintain context shape
		this.contextShape.update(
			this._renderingContext,
			this.interactionsGroup,
			this.timeContext,
			0
		);

		// debug context
		if (this.params.debug) {
			this.debugRect.setAttributeNS(null, 'width', width);
			this.debugRect.setAttributeNS(null, 'height', height);
		}
	}

	/**
	 *  updates the Shapes which belongs to the layer
	 *  @param item {DOMElement}
	 */
	this.updateShapes = function(item) {
		if (item == undefined)
			item = null;

		this._updateRenderingContext();

		const that = this;
		const renderingContext = this._renderingContext;
		const items = (item !== null) ? d3Selection.select(item) : this.d3items;

		// update common shapes
		this._itemCommonShapeMap.forEach(function(shape, item) {
			shape.update(renderingContext, item, this.data);
		});

		// d3 update - entity or collection shapes
		items.each(function(datum, index) {
			const el = this;
			const shape = that._itemElShapeMap.get(el);
			shape.update(renderingContext, el, datum, index);
		});
	}
}