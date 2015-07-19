'use strict'

function CenteredZoomState(timeline) {
  
  BaseState.call(this, timeline);

  this.currentLayer = null;

  this.handleEvent = function(e) {
    switch(e.type) {
      case 'mousedown':
        this.onMouseDown(e);
        break;
      case 'mousemove':
        this.onMouseMove(e);
        break;
      case 'mouseup':
        this.onMouseUp(e);
        break;
    }
  }

  this.onMouseDown = function(e) {
    this.mouseDown = true;
  }

  this.onMouseMove = function(e) {
    if (!this.mouseDown) { 
      return; 
    }

    const timeline = this.timeline;
    const timeContext = timeline.timeContext;
    const lastCenterTime = timeContext.xScale.invert(e.x);

    timeContext.stretchRatio += e.dy / 100;
    timeContext.stretchRatio = Math.max(timeContext.stretchRatio, 0.01);

    const newCenterTime = timeContext.xScale.invert(e.x);
    const delta = newCenterTime - lastCenterTime;
    const offset = timeContext.offset;
    // apply new offset to keep it centered to the mouse
    timeContext.offset += (delta + timeContext.xScale.invert(e.dx));

    // clamp other values here if needed (example: offset < 0, stretchRatio > 1, etc...)

    // example keep in container when zoomed out
    if (timeContext.stretchRatio < 1) {
      const minOffset = timeContext.xScale.invert(0);
      const maxOffset = timeContext.xScale.invert(timeline.containersWidth - timeContext.xScale(timeContext.containersDuration));

      timeContext.offset = Math.max(timeContext.offset, minOffset);
      timeContext.offset = Math.min(timeContext.offset, maxOffset);
    }

    timeline.update();
  }

  this.onMouseUp = function(e) {
    this.mouseDown = false;
  }
}

CenteredZoomState.prototype = Object.create(BaseState.prototype);

CenteredZoomState.prototype.constructor = CenteredZoomState;