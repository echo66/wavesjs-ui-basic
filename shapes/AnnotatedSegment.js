'use strict'

function AnnotatedSegment(options) {

  BaseShape.call(this, options)

  this.getClassName = function() { 
    return 'annotated-segment'; 
  }

  this._getAccessorList = function() {
    let list = super._getAccessorList();
    list.text = 'default';
    return list;
  }

  this.render = function(renderingContext) {
    this.el = super.render(renderingContext);
    const height = renderingContext.height;

    this.label = document.createElementNS(this.ns, 'text');
    this.label.setAttributeNS(null, 'x', 1);
    this.label.setAttributeNS(null, 'y', 11);
    this.label.setAttributeNS(null, 'transform', "matrix(1, 0, 0, -1, 0, " + height + ")");
    this.label.style.fontSize = '10px';
    this.label.style.fontFamily = 'monospace';
    this.label.style.color = '#676767';
    this.label.style.mozUserSelect = 'none';
    this.label.style.webkitUserSelect = 'none';
    this.label.style.userSelect = 'none';

    this.el.appendChild(this.label);

    return this.el;
  }

  this.update = function(renderingContext, group, datum, index) {
    super.update(renderingContext, group, datum, index);

    this.label.innerHTML = this.text(datum);
  }
}

AnnotatedSegment.prototype = Object.create(Segment.prototype);

AnnotatedSegment.prototype.constructor = AnnotatedSegment;