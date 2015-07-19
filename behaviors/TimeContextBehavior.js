'use strict'

function TimeContextBehavior() {
  /**
   *  draw the shape to interact with the context
   *  @params bool {Boolean} define if the layer's context is editable or not
   */
  this.setEditable = function(layer, bool = true) {
    const (display = bool) ? 'block' : 'none';
    layer.interactionsGroup.style.display = display;
    layer._isContextEditable = bool;
  }

  this.edit = function(layer, dx, dy, target) {
    const timeContext = layer.timeContext;

    if (target === layer.contextShape.leftHandler) {
      this._editLeft(timeContext, dx);
    } else if (target === layer.contextShape.rightHandler) {
      this._editRight(timeContext, dx);
    } else {
      this._move(timeContext, dx);
    }
  }

  this._editLeft = function(timeContext, dx) {
    // edit `start`, `offset` and `duration`
    const x = timeContext.parent.xScale(timeContext.start);
    const offset = timeContext.xScale(timeContext.offset);
    const width = timeContext.xScale(timeContext.duration);

    const targetX = x + dx;
    const targetOffset = offset - dx;
    const targetWidth = Math.max(width - dx, 1);

    timeContext.start = timeContext.parent.xScale.invert(targetX);
    timeContext.offset = timeContext.xScale.invert(targetOffset);
    timeContext.duration = timeContext.xScale.invert(targetWidth);
  }

  this._editRight = function(timeContext, dx) {
    const width = timeContext.xScale(timeContext.duration);
    const targetWidth = Math.max(width + dx, 1);

    timeContext.duration = timeContext.xScale.invert(targetWidth);
  }

  this._move = function(timeContext, dx) {
    const x = timeContext.parent.xScale(timeContext.start);
    const targetX = Math.max(x + dx, 0);

    timeContext.start = timeContext.parent.xScale.invert(targetX);
  }

  this.stretch = function(layer, dx, dy, target) {
    const timeContext = layer.timeContext;
    const lastDuration = timeContext.duration;
    const lastOffset = timeContext.offset;

    if (target.classList.contains('handler') && target.classList.contains('left')) {
      this._editLeft(timeContext, dx);
    } else if (target.classList.contains('handler') && target.classList.contains('right')) {
      this._editRight(timeContext, dx);
    } else {
      this._move(timeContext, dx);
    }

    const newDuration = timeContext.duration;
    const ratio = (newDuration / lastDuration);

    timeContext.stretchRatio *= ratio;
    timeContext.offset = lastOffset;
    timeContext.duration = lastDuration;
  }
}