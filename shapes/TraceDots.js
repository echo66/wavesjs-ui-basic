'use strict'

// @NOTE: accessors should receive datum index as argument
// to allow the use of sampleRate to define x position
function TraceDots (options) {

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
      meanRadius: 3,
      rangeRadius: 3,
      meanColor: '#232323',
      rangeColor: 'steelblue'
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
    return 'trace-dots'; 
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
        if (v === null) { 
          return d[name] || defaultValue; 
        }
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
    // container
    this.el = document.createElementNS(this.ns, "g");
    // draw mean dot
    this.mean = document.createElementNS(this.ns, "circle");
    this.mean.setAttributeNS(null, "r", this.params.meanRadius);
    this.mean.setAttributeNS(null, "stroke", this.params.meanColor);
    this.mean.setAttributeNS(null, "fill", "transparent");
    this.mean.classList.add("mean");
    // range dots (0 => top, 1 => bottom)
    this.max = document.createElementNS(this.ns, "circle");
    this.max.setAttributeNS(null, "r", this.params.meanRadius);
    this.max.setAttributeNS(null, "stroke", this.params.rangeColor);
    this.max.setAttributeNS(null, "fill", "transparent");
    this.max.classList.add("max");

    this.min = document.createElementNS(this.ns, "circle");
    this.min.setAttributeNS(null, "r", this.params.meanRadius);
    this.min.setAttributeNS(null, "stroke", this.params.rangeColor);
    this.min.setAttributeNS(null, "fill", "transparent");
    this.min.classList.add("min");

    this.el.appendChild(this.mean);
    this.el.appendChild(this.max);
    this.el.appendChild(this.min);

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
    const mean = this.yMean(datum);
    const range = this.yRange(datum);
    const x = this.x(datum);
    
    // y positions
    const meanPos = "" + renderingContext.yScale(mean);
    this.mean.setAttributeNS(null, "transform", "translate(0, " + meanPos + ")");

    const halfRange = range / 2;
    const max = renderingContext.yScale(mean + halfRange);
    this.max.setAttributeNS(null, "transform", "translate(0, " + max + ")");
    const min = renderingContext.yScale(mean - halfRange);
    this.min.setAttributeNS(null, "transform", "translate(0, " + min + ")");

    const xPos = renderingContext.xScale(x);
    this.el.setAttributeNS(null, "transform", "translate(" + xPos + ", 0)");
  }


  /**
   *  define if the shape is considered to be the given area
   *  arguments are passed in domain unit (time, whatever)
   *  @return {Boolean}
   */
  this.inArea = function(renderingContext, datum, x1, y1, x2, y2) {}

}