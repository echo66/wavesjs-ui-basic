'use strict'

function Line(options) {

  BaseShape.call(this, options);

  this.getClassName = function() { 
    return 'line'; 
  }

  this._getAccessorList = function() {
    return { cx: 0, cy: 0 };
  }

  this._getDefaults = function() {
    return { color: '#000000' };
  }

  this.render = function() {
    if (this.el) { 
      return this.el; 
    }

    this.el = document.createElementNS(this.ns, 'path');
    // this.el.setAttributeNS(null, 'shape-rendering', 'crispEdges');
    return this.el;
  }

  this.update = function(renderingContext, group, data) {
    data = data.slice(0);
    data.sort(function(a, b) { 
      return (this.cx(a) < this.cx(b)) ? -1 : 1; 
    });

    this.el.setAttributeNS(null, 'd', this._buildLine(renderingContext, data));
    this.el.style.stroke = this.params.color;
    this.el.style.fill = 'none';

    data = null;
  }

  // builds the `path.d` attribute
  // @TODO create some ShapeHelper ?
  this._buildLine = function(renderingContext, data) {
    if (!data.length) { return ''; }
    // sort data
    let instructions = data.map(function(datum, index) {
      const x = renderingContext.xScale(this.cx(datum));
      const y = renderingContext.yScale(this.cy(datum));
      return "" + x + "," + y;
    });

    return 'M' + instructions.join('L');
  }

}

Line.prototype = Object.create(BaseShape.prototype);

Line.prototype.constructor = Line;