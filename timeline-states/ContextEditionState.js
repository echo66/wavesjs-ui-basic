'use strict'

function ContextEditionState(timeline) {
  
  BaseState.call(this, timeline);

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
    this.currentTarget = e.target;

    for (let i = 0, l = this.layers.length; i < l; i++) {
      const layer = this.layers[i];
      if (layer.hasElement(e.target)) {
        this.currentLayer = layer;
        break;
      }
    }
  }

  this.onMouseMove = function(e) {
    if (!this.mouseDown || !this.currentLayer) { 
      return; 
    }

    const layer = this.currentLayer;
    const target = this.currentTarget;

    if (!e.originalEvent.shiftKey) {
      this.timeline.timeContextBehavior.edit(layer, e.dx, e.dy, target);
    } else {
      this.timeline.timeContextBehavior.stretch(layer, e.dx, e.dy, target);
    }

    this.timeline.update(this.currentLayer);
  }

  this.onMouseUp = function(e) {
    this.mouseDown = false;
    this.currentTarget = null;
    this.currentLayer = null;
  }
}

ContextEditionState.prototype = Object.create(BaseState.prototype);

ContextEditionState.prototype.constructor = ContextEditionState;