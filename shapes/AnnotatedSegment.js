'use strict'

function AnnotatedSegment (options) {

  if (!options)
    options = {};

  this.el = null;
  this.ns = 'http://www.w3.org/2000/svg';
  this.params = Object.assign({}, this._getDefaults(), options);
  // create accessors methods and set default accessor functions
  const accessors = this._getAccessorList();
  this._createAccessors(accessors);
  this._setDefaultAccessors(accessors);


  this._getDefaults = function() {
    return {
      displayHandlers: true,
      handlerWidth: 2,
      handlerOpacity: 0.8,
      opacity: 0.6
    };
  }


  /**
   *  clean references, is called from the `layer`
   */
  this.destroy = function() {
    // this.group = null;
    this.el = null;
  }


  /**
   * @return {String} the name of the shape, used as a class in the element group
   */
  this.getClassName = function() { 
    return 'annotated-segment'; 
  }

  // should only be called once
  // setSvgDefinition(defs) {}

  /**
   * @TODO rename
   * @return {Object}
   *    keys are the accessors methods names to create
   *    values are the default values for each given accessor
   */
  this._getAccessorList = function() { 
    return { x: 0, y: 0, width: 0, height: 1, color: '#000000', opacity: 1, text: 'default' };
  }


  /**
   *  install the given accessors on the shape
   */
  this.install = function(accessors) {
    for (var key in accessors) { 
      this[key] = accessors[key]; 
    }
  }


  /**
   * generic method to create accessors
   * adds accessor to the prototype if not already present
   */
  this._createAccessors = function(accessors) {
    this._accessors = {};
    // add it to the prototype
    const proto = Object.getPrototypeOf(this);
    // create a getter / setter for each accessors
    // setter : `this.x = callback`
    // getter : `this.x(datum)`
    Object.keys(accessors).forEach(function(name) {
      if (proto.hasOwnProperty(name)) { 
        return; 
      }

      Object.defineProperty(proto, name, {
        get: function() { 
          return this._accessors[name]; 
        },
        set: function(func) {
          this._accessors[name] = func;
        }
      });
    });
  }


  /**
   * create a function to be used as a default
   * accessor for each accesors
   */
  this._setDefaultAccessors = function(accessors) {
    Object.keys(accessors).forEach(function(name) {
      const defaultValue = accessors[name];
      let accessor = function(d, v = null) {
        if (v === null) { return d[name] || defaultValue; }
        d[name] = v;
      };
      // set accessor as the default one
      this[name] = accessor;
    });
  }


  /**
   * @param  renderingContext {Context} the renderingContext the layer which owns this item
   * @return  {DOMElement} the DOM element to insert in the item's group
   */
  this.render = function(renderingContext) {
  	if (this.el) { 
      return this.el; 
    }

    this.el = document.createElementNS(this.ns, 'g');

    this.segment = document.createElementNS(this.ns, 'rect');
    this.segment.style.opacity = this.params.opacity;
    this.segment.setAttributeNS(null, 'shape-rendering', 'crispEdges');

    this.el.appendChild(this.segment);

    if (this.params.displayHandlers) {
      this.leftHandler = document.createElementNS(this.ns, 'rect');
      this.leftHandler.classList.add('left', 'handler');
      this.leftHandler.setAttributeNS(null, 'width', this.params.handlerWidth);
      this.leftHandler.setAttributeNS(null, 'shape-rendering', 'crispEdges');
      this.leftHandler.style.opacity = this.params.handlerOpacity;
      this.leftHandler.style.cursor = 'ew-resize';

      this.rightHandler = document.createElementNS(this.ns, 'rect');
      this.rightHandler.classList.add('right', 'handler');
      this.rightHandler.setAttributeNS(null, 'width', this.params.handlerWidth);
      this.rightHandler.setAttributeNS(null, 'shape-rendering', 'crispEdges');
      this.rightHandler.style.opacity = this.params.handlerOpacity;
      this.rightHandler.style.cursor = 'ew-resize';

      this.el.appendChild(this.leftHandler);
      this.el.appendChild(this.rightHandler);
    }

    const height = renderingContext.height;

    this.label = document.createElementNS(this.ns, 'text');
    this.label.setAttributeNS(null, 'x', 1);
    this.label.setAttributeNS(null, 'y', 11);
    this.label.setAttributeNS(null, 'transform', `matrix(1, 0, 0, -1, 0, ${height})`);
    this.label.style.fontSize = '10px';
    this.label.style.fontFamily = 'monospace';
    this.label.style.color = '#676767';
    this.label.style.mozUserSelect = 'none';
    this.label.style.webkitUserSelect = 'none';
    this.label.style.userSelect = 'none';

    this.el.appendChild(this.label);

    return this.el;
  }

  /**
   * @param  group {DOMElement} group of the item in which the shape is drawn
   * @param  renderingContext {Context} the renderingContext the layer which owns this item
   * @param
   *    simpleShape : datum {Object} the datum related to this item's group
   *    commonShape : datum {Array} the associated to the Layer
   * @param
   *    simpleShape : index {Number} the current index of the datum
   *    commonShape : undefined
   * @return  void
   */
  this.update = function(renderingContext, group, datum, index) {
  	const x = renderingContext.xScale(this.x(datum));
    const y = renderingContext.yScale(this.y(datum));
    const width = renderingContext.xScale(this.width(datum));
    const height = renderingContext.yScale(this.height(datum));
    const color = this.color(datum);
    const opacity = this.opacity(datum);

    group.setAttributeNS(null, 'transform', `translate(${x}, ${y})`);

    this.el.style.opacity = opacity;

    this.segment.setAttributeNS(null, 'width', Math.max(width, 0));
    this.segment.setAttributeNS(null, 'height', height);
    this.segment.style.fill = color;

    if (this.params.displayHandlers) {
      // display handlers
      this.leftHandler.setAttributeNS(null, 'height', height);
      this.leftHandler.setAttributeNS(null, 'transform', 'translate(0, 0)');
      this.leftHandler.style.fill = color;

      const rightHandlerTranslate = `translate(${width - this.params.handlerWidth}, 0)`;
      this.rightHandler.setAttributeNS(null, 'height', height);
      this.rightHandler.setAttributeNS(null, 'transform', rightHandlerTranslate);
      this.rightHandler.style.fill = color;
    }

    this.label.innerHTML = this.text(datum);
  }


  /**
   *  define if the shape is considered to be the given area
   *  arguments are passed in domain unit (time, whatever)
   *  @return {Boolean}
   */
  this.inArea = function(renderingContext, datum, x1, y1, x2, y2) {
  	const shapeX1 = renderingContext.xScale(this.x(datum));
    const shapeX2 = renderingContext.xScale(this.x(datum) + this.width(datum));
    const shapeY1 = renderingContext.yScale(this.y(datum));
    const shapeY2 = renderingContext.yScale(this.y(datum) + this.height(datum));

    // http://jsfiddle.net/uthyZ/ - check overlaping area
    const xOverlap = Math.max(0, Math.min(x2, shapeX2) - Math.max(x1, shapeX1));
    const yOverlap = Math.max(0, Math.min(y2, shapeY2) - Math.max(y1, shapeY1));
    const area = xOverlap * yOverlap;

    return area > 0;
  }

}