'use strict'

// works
function ContextEditionState(timeline) {
  
  BaseState.call(this, timeline);

}

ContextEditionState.prototype = Object.create(BaseState.prototype);

ContextEditionState.prototype.constructor = ContextEditionState;

ContextEditionState.prototype.handleEvent = function(e) {
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

ContextEditionState.prototype.onMouseDown = function(e) {
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

ContextEditionState.prototype.onMouseMove = function(e) {
  if (!this.mouseDown || !this.currentLayer) { 
    return; 
  }

  const layer = this.currentLayer;
  const target = this.currentTarget;

  if (!e.originalEvent.shiftKey) {
    layer.editContext(e.dx, e.dy, target);
  } else {
    layer.stretchContext(e.dx, e.dy, target);
  }

  this.timeline.tracks.update(layer);
}

ContextEditionState.prototype.onMouseUp = function(e) {
  this.mouseDown = false;
  this.currentTarget = null;
  this.currentLayer = null;
}