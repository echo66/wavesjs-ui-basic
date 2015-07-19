'use strict'

function BrushZoomState(timeline) {
  
  BaseState.call(this, timeline);

  this.ns = 'http://www.w3.org/2000/svg';

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
      case 'keydown':
        this.onKeyDown(e);
        break;
    }
  }

  this.onMouseDown = function(e) {
    this.brushes = [];
    this.startX = e.x;
    // create brush in each containers
    for (let id in this.timeline.containers) {
      const container = this.timeline.containers[id];
      const interactions = container.interactionsElement;

      const brush = document.createElementNS(this.ns, 'rect');
      brush.setAttributeNS(null, 'height', container.height);
      brush.setAttributeNS(null, 'y', 0);
      brush.style.fill = '#787878';
      brush.style.opacity = 0.2;

      interactions.appendChild(brush);

      this.brushes.push(brush);
    }
  }

  this.onMouseMove = function(e) {
    // update brush
    const width = Math.abs(e.x - this.startX);
    const x = Math.min(e.x, this.startX);

    this.brushes.forEach(function(brush) {
      brush.setAttributeNS(null, 'width', width);
      brush.setAttributeNS(null, 'x', x);
    });
  }

  this.onMouseUp = function(e) {
    // remove brush
    this.brushes.forEach(function(brush) {
      brush.parentNode.removeChild(brush);
    });

    const timeline = this.timeline;
    const timeContext = timeline.timeContext;
    // update timeline
    const startX = this.startX;
    const endX = e.x;

    const minTime = timeContext.xScale.invert(Math.min(startX, endX));
    const maxTime = timeContext.xScale.invert(Math.max(startX, endX));
    const deltaDuration = maxTime - minTime;

    const stretchRatio = timeContext.containersDuration / deltaDuration;

    timeContext.offset = -minTime;
    timeContext.stretchRatio = stretchRatio;

    timeline.update();
  }

  this.onKeyDown = function(e) {
    // reset on space bar
    if (e.originalEvent.keyCode === 32) {
      this.timeline.timeContext.offset = 0;
      this.timeline.timeContext.stretchRatio = 1;
      this.timeline.update();
    }
  }
}

BrushZoomState.prototype = Object.create(BaseState.prototype);

BrushZoomState.prototype.constructor = BrushZoomState;