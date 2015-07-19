'use strict'

function MarkerBehavior(options) {

  BaseBehavior.call(this, options);

  this.edit = function(renderingContext, shape, datum, dx, dy, target) {
    const x = renderingContext.xScale(shape.x(datum));
    let targetX = ((x + dx) > 0) ? x + dx : 0;

    shape.x(datum, renderingContext.xScale.invert(targetX));
  }
}

MarkerBehavior.prototype = Object.create(BaseBehavior.prototype);

MarkerBehavior.prototype.constructor = MarkerBehavior;