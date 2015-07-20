'use strict'

function Cursor(options) {

  BaseShape.call(this, options)

}


Cursor.prototype = Object.create(BaseShape.prototype);

Cursor.prototype.constructor = Cursor;


Cursor.prototype.getClassName = function() { 
  return 'cursor'; 
}

Cursor.prototype._getAccessorList = function() {
  return { x: 0 };
}

Cursor.prototype._getDefaults = function() {
  return {
    color: '#000000',
    opacity: 1
  };
}

Cursor.prototype.render = function(renderingContext) {
  if (this.el) { return this.el; }

  this.el = document.createElementNS(this.ns, 'line');
  this.el.setAttributeNS(null, 'x', 0);
  this.el.setAttributeNS(null, 'y1', 0);
  this.el.setAttributeNS(null, 'y2', renderingContext.height);
  this.el.setAttributeNS(null, 'shape-rendering', 'crispEdges');

  return this.el;
}

Cursor.prototype.update = function(renderingContext, group, datum, index) {
  const x = renderingContext.xScale(this.x(datum));
  const color = this.params.color;

  group.setAttributeNS(null, "transform", "translate(" + x + ", 0)");
  this.el.style.stroke = color;
}

// not selectable with a drag
Cursor.prototype.inArea = function() { 
  return false; 
}