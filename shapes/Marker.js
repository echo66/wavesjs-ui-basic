'use strict'

// @NOTE: accessors should receive datum index as argument
// to allow the use of sampleRate to define x position
function Marker (options) {

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
      handlerWidth: 7,
      handlerHeight: 10,
      displayHandler: true,
      opacity: 1
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
    return 'marker'; 
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
    return { x: 0, color: '#000000' };
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
    Object.keys(accessors).forEach((name) => {
      if (proto.hasOwnProperty(name)) { return; }

      Object.defineProperty(proto, name, {
        get: function() { return this._accessors[name]; },
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
    Object.keys(accessors).forEach((name) => {
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
    if (this.el) { return this.el; }

    const height = renderingContext.height;

    this.el = document.createElementNS(this.ns, 'g');
    this.line = document.createElementNS(this.ns, 'rect');

    // draw line
    this.line.setAttributeNS(null, 'x', 0);
    this.line.setAttributeNS(null, 'y', 0);
    this.line.setAttributeNS(null, 'width', 1);
    this.line.setAttributeNS(null, 'height', height);
    this.line.setAttributeNS(null, 'shape-rendering', 'optimizeSpeed');

    this.el.appendChild(this.line);

    if (this.params.displayHandlers) {
      this.handler = document.createElementNS(this.ns, 'rect');

      this.handler.setAttributeNS(null, 'x', -((this.params.handlerWidth - 1) / 2));
      this.handler.setAttributeNS(null, 'y', renderingContext.height - this.params.handlerHeight);
      this.handler.setAttributeNS(null, 'width', this.params.handlerWidth);
      this.handler.setAttributeNS(null, 'height', this.params.handlerHeight);
      this.handler.setAttributeNS(null, 'shape-rendering', 'crispEdges');

      this.el.appendChild(this.handler);
    }

    this.el.style.opacity = this.params.opacity;

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
    const x = renderingContext.xScale(this.x(datum)) - 0.5;
    const color = this.color(datum);

    group.setAttributeNS(null, 'transform', `translate(${x}, 0)`);

    this.line.style.fill = color;

    if (this.params.displayHandlers) {
      this.handler.style.fill = color;
    }
  }


  /**
   *  define if the shape is considered to be the given area
   *  arguments are passed in domain unit (time, whatever)
   *  @return {Boolean}
   */
  this.inArea = function(renderingContext, datum, x1, y1, x2, y2) {
    // handlers only are selectable
    const x = renderingContext.xScale(this.x(datum));
    const shapeX1 = x - (this.params.handlerWidth - 1) / 2;
    const shapeX2 = shapeX1 + this.params.handlerWidth;
    const shapeY1 = renderingContext.height - this.params.handlerHeight;
    const shapeY2 = renderingContext.height;

    const xOverlap = Math.max(0, Math.min(x2, shapeX2) - Math.max(x1, shapeX1));
    const yOverlap = Math.max(0, Math.min(y2, shapeY2) - Math.max(y1, shapeY1));
    const area = xOverlap * yOverlap;

    return area > 0;
  }

}