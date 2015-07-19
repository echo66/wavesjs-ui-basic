'use strict'

function Cursor(options) {

  BaseShape.call(this, options)

  this.getClassName = function() { 
    return 'cursor'; 
  }

  this._getAccessorList = function() {
    return { x: 0 };
  }

  this._getDefaults = function() {
    return {
      color: '#000000',
      opacity: 1
    };
  }

  this.render = function(renderingContext) {
    if (this.el) { return this.el; }

    this.el = document.createElementNS(this.ns, 'line');
    this.el.setAttributeNS(null, 'x', 0);
    this.el.setAttributeNS(null, 'y1', 0);
    this.el.setAttributeNS(null, 'y2', renderingContext.height);
    this.el.setAttributeNS(null, 'shape-rendering', 'crispEdges');

    return this.el;
  }

  this.update = function(renderingContext, group, datum, index) {
    const x = renderingContext.xScale(this.x(datum));
    const color = this.params.color;

    group.setAttributeNS(null, "transform", "translate(" + x + ", 0)");
    this.el.style.stroke = color;
  }

  // not selectable with a drag
  this.inArea = function() { return false; }
}


Cursor.prototype = Object.create(BaseShape.prototype);

Cursor.prototype.constructor = Cursor;