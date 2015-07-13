'use strict'

// @NOTE: accessors should receive datum index as argument
// to allow the use of sampleRate to define x position
function TraceCommon (options) {

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
      rangeColor: 'steelblue',
      meanColor: '#232323',
      displayMean: true
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
    return 'trace-common'; 
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
    return { x: 0, yMean: 0, yRange: 0 };
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
    if (this.el) { 
      return this.el; 
    }
    this.el = document.createElementNS(this.ns, 'g');
    // range path
    this.range = document.createElementNS(this.ns, 'path');
    this.el.appendChild(this.range);

    // mean line
    if (this.params.displayMean) {
      this.mean = document.createElementNS(this.ns, 'path');
      this.el.appendChild(this.mean);
    }

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
    // order data by x position
    data = data.slice(0);
    data.sort(function(a,b) {
      return this.x(a) < this.x(b) ? -1 : 1;
    });

    if (this.params.displayMean) {
      this.mean.setAttributeNS(null, 'd', this._buildMeanLine(renderingContext, data));
      this.mean.setAttributeNS(null, 'stroke', this.params.meanColor);
      this.mean.setAttributeNS(null, 'fill', 'none');
    }

    this.range.setAttributeNS(null, 'd', this._buildRangeZone(renderingContext, data));
    this.range.setAttributeNS(null, 'stroke', 'none');
    this.range.setAttributeNS(null, 'fill', this.params.rangeColor);
    this.range.setAttributeNS(null, 'opacity', '0.4');

    data = null;
  }


  /**
   *  define if the shape is considered to be the given area
   *  arguments are passed in domain unit (time, whatever)
   *  @return {Boolean}
   */
  this.inArea = function(renderingContext, datum, x1, y1, x2, y2) {}


  this._buildMeanLine = function(renderingContext, data) {
    let instructions = data.map((datum, index) => {
      const x = renderingContext.xScale(this.x(datum));
      const y = renderingContext.yScale(this.yMean(datum));
      return `${x},${y}`;
    });

    return 'M' + instructions.join('L');
  }


  this._buildRangeZone = function(renderingContext, data) {
    const length = data.length;
    // const lastIndex = data
    let instructionsStart = '';
    let instructionsEnd = '';

    for (let i = 0; i < length; i++) {
      const datum = data[i];
      const mean = this.yMean(datum);
      const halfRange = this.yRange(datum) / 2;

      const x = renderingContext.xScale(this.x(datum));
      const y0 = renderingContext.yScale(mean + halfRange);
      const y1 = renderingContext.yScale(mean - halfRange);

      const start = `${x},${y0}`;
      const end = `${x},${y1}`;

      instructionsStart = instructionsStart === '' ? start : `${instructionsStart}L${start}`;
      instructionsEnd = instructionsEnd === '' ? end : `${end}L${instructionsEnd}`;
    }

    let instructions = `M${instructionsStart}L${instructionsEnd}Z`;
    return instructions;
  }

}