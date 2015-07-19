'use strict'

function SegmentBehavior(options) {
  
  BaseBehavior.call(this, options);

  this.edit = function(renderingContext, shape, datum, dx, dy, target) {
    let action = 'move';
    const classList = target.classList;

    if (target === shape.leftHandler) {
      action = 'resizeLeft';
    } else if (target === shape.rightHandler) {
      action = 'resizeRight';
    }

    this["_" + action](renderingContext, shape, datum, dx, dy, target);
  }

  this._move = function(renderingContext, shape, datum, dx, dy, target) {
    const layerHeight = renderingContext.height;
    // current values
    const x = renderingContext.xScale(shape.x(datum));
    const y = renderingContext.yScale(shape.y(datum));
    const height = renderingContext.yScale(shape.height(datum));
    // target values
    let targetX = Math.max(x + dx, 0);
    let targetY = y - dy;

    // lock in layer's y axis
    if (targetY < 0) {
      targetY = 0;
    } else if (targetY + height > layerHeight) {
      targetY = layerHeight - height;
    }

    shape.x(datum, renderingContext.xScale.invert(targetX));
    shape.y(datum, renderingContext.yScale.invert(targetY));
  }

  this._resizeLeft = function(renderingContext, shape, datum, dx, dy, target) {
    // current values
    const x     = renderingContext.xScale(shape.x(datum));
    const width = renderingContext.xScale(shape.width(datum));
    // target values
    let maxTargetX  = x + width;
    let targetX     = (x + dx < maxTargetX) ? Math.max(x + dx, 0) : x;
    let targetWidth = (targetX !== 0) ? Math.max(width - dx, 1) : width;

    shape.x(datum, renderingContext.xScale.invert(targetX));
    shape.width(datum, renderingContext.xScale.invert(targetWidth));
  }

  this._resizeRight = function(renderingContext, shape, datum, dx, dy, target) {
    // current values
    const width = renderingContext.xScale(shape.width(datum));
    // target values
    let targetWidth = Math.max(width + dx, 1);

    shape.width(datum, renderingContext.xScale.invert(targetWidth));
  }
}

SegmentBehavior.prototype = Object.create(BaseBehavior.prototype);

SegmentBehavior.prototype.constructor = SegmentBehavior;