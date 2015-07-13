'use strict'

// @NOTE: accessors should receive datum index as argument
// to allow the use of sampleRate to define x position
function Waveform (options) {

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
      sampleRate: 44100,
      color: '#000000',
      opacity: 1,
      renderingStrategy: 'svg' // canvas is bugged (translation, etc...)
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
    return 'waveform'; 
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
    return { y: 0 };
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
    Object.keys(accessors).forEach(function(name){
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
    Object.keys(accessors).forEach(function(name){
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

    if (this.params.renderingStrategy === 'svg') {

      this.el = document.createElementNS(this.ns, 'path');
      this.el.setAttributeNS(null, 'fill', 'none');
      this.el.setAttributeNS(null, 'shape-rendering', 'crispEdges');
      this.el.setAttributeNS(null, 'stroke', this.params.color);
      this.el.style.opacity = this.params.opacity;

    } else if (this.params.renderingStrategy === 'canvas') {

      this.el = document.createElementNS(this.ns, 'foreignObject');
      this.el.setAttributeNS(null, 'width', renderingContext.width);
      this.el.setAttributeNS(null, 'height', renderingContext.height);

      const canvas = document.createElementNS(xhtmlNS, 'xhtml:canvas');

      this._ctx = canvas.getContext('2d');
      this._ctx.canvas.width = renderingContext.width;
      this._ctx.canvas.height = renderingContext.height;

      this.el.appendChild(canvas);
    }

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
    // define nbr of samples per pixels
    const sliceMethod = (datum instanceof Float32Array) ? 'subarray' : 'slice';
    const nbrSamples = datum.length;
    const duration = nbrSamples / this.params.sampleRate;
    const width = renderingContext.xScale(duration);
    const samplesPerPixel = nbrSamples / width;
    let minMax = [];
    // get min/max per pixels
    for (let i = 0; i <= width; i++) {
      const startTime = renderingContext.xScale.invert(i);
      const startSample = startTime * this.params.sampleRate;

      const extract = datum[sliceMethod](startSample, startSample + samplesPerPixel);
      let min = Infinity;
      let max = -Infinity;
      for (let j = 0; j < extract.length; j++) {
        let sample = extract[j];
        if (sample < min) { min = sample; }
        if (sample > max) { max = sample; }
      }
      // disallow Infinity
      min = (min === Infinity || min === -Infinity) ? 0 : min;
      max = (max === Infinity || max === -Infinity) ? 0 : max;

      minMax.push({ time: startTime, values: [min, max] });
    }

    const MIN = 0;
    const MAX = 1;

    // rednering strategies
    if (this.params.renderingStrategy === 'svg') {

      let instructions = minMax.map(function(datum, index) {
        const x  = Math.floor(renderingContext.xScale(datum.time));
        let y1 = Math.round(renderingContext.yScale(this.y(datum.values[MIN])));
        let y2 = Math.round(renderingContext.yScale(this.y(datum.values[MAX])));

        return "" + x + "," + y1 + "L" + x + "," + y2;
      });

      const d = 'M' + instructions.join('L');
      this.el.setAttributeNS(null, 'd', d);

    } else if (this.params.renderingStrategy === 'canvas') {

      this._ctx.canvas.width = width;
      this.el.setAttribute('width', width);
      // fix chrome bug with translate
      if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
        this.el.setAttribute('x', renderingContext.offsetX);
      }

      this._ctx.strokeStyle = this.params.color;
      this._ctx.globalAlpha = this.params.opacity;
      this._ctx.moveTo(renderingContext.xScale(0), renderingContext.yScale(0));

      minMax.forEach(function(datum) {
        const x  = renderingContext.xScale(datum.time);
        const y1 = renderingContext.yScale(this.y(datum.values[MIN]));
        const y2 = renderingContext.yScale(this.y(datum.values[MAX]));

        this._ctx.moveTo(x, y1);
        this._ctx.lineTo(x, y2);
      });

      this._ctx.stroke();
    }
  }


  /**
   *  define if the shape is considered to be the given area
   *  arguments are passed in domain unit (time, whatever)
   *  @return {Boolean}
   */
  this.inArea = function(renderingContext, datum, x1, y1, x2, y2) {
    // define nbr of samples per pixels
    const sliceMethod = (datum instanceof Float32Array) ? 'subarray' : 'slice';
    const nbrSamples = datum.length;
    const duration = nbrSamples / this.params.sampleRate;
    const width = renderingContext.xScale(duration);
    const samplesPerPixel = nbrSamples / width;
    let minMax = [];
    // get min/max per pixels
    for (let i = 0; i <= width; i++) {
      const startTime = renderingContext.xScale.invert(i);
      const startSample = startTime * this.params.sampleRate;

      const extract = datum[sliceMethod](startSample, startSample + samplesPerPixel);
      let min = Infinity;
      let max = -Infinity;
      for (let j = 0; j < extract.length; j++) {
        let sample = extract[j];
        if (sample < min) { min = sample; }
        if (sample > max) { max = sample; }
      }
      // disallow Infinity
      min = (min === Infinity || min === -Infinity) ? 0 : min;
      max = (max === Infinity || max === -Infinity) ? 0 : max;

      minMax.push({ time: startTime, values: [min, max] });
    }

    const MIN = 0;
    const MAX = 1;

    // rednering strategies
    if (this.params.renderingStrategy === 'svg') {

      let instructions = minMax.map(function(datum, index) {
        const x  = Math.floor(renderingContext.xScale(datum.time));
        let y1 = Math.round(renderingContext.yScale(this.y(datum.values[MIN])));
        let y2 = Math.round(renderingContext.yScale(this.y(datum.values[MAX])));

        return "" + x + "," + y1 + "L" + x + "," + y2;
      });

      const d = 'M' + instructions.join('L');
      this.el.setAttributeNS(null, 'd', d);

    } else if (this.params.renderingStrategy === 'canvas') {

      this._ctx.canvas.width = width;
      this.el.setAttribute('width', width);
      // fix chrome bug with translate
      if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
        this.el.setAttribute('x', renderingContext.offsetX);
      }

      this._ctx.strokeStyle = this.params.color;
      this._ctx.globalAlpha = this.params.opacity;
      this._ctx.moveTo(renderingContext.xScale(0), renderingContext.yScale(0));

      minMax.forEach(function(datum) {
        const x  = renderingContext.xScale(datum.time);
        const y1 = renderingContext.yScale(this.y(datum.values[MIN]));
        const y2 = renderingContext.yScale(this.y(datum.values[MAX]));

        this._ctx.moveTo(x, y1);
        this._ctx.lineTo(x, y2);
      });

      this._ctx.stroke();
    }
  }

}