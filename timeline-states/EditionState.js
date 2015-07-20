import BaseState from './base-state';


// @NOTE => overlaps SelectionBehavior in some way...
function EditionState(timeline) {
	
	BaseState.call(this, timeline);

	this.currentEditedLayer = null;
	this.currentTarget = null;

}

EditionState.prototype = Object.create(BaseState.prototype);

EditionState.prototype.constructor = EditionState;

EditionState.prototype.enter = function() {}
	
EditionState.prototype.exit = function() {}

EditionState.prototype.handleEvent = function(e) {

	switch (e.type) {
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

EditionState.prototype.onMouseDown = function(e) {

	this.mouseDown = true;
	// keep target consistent with mouse down
	// @NOTE: move this to Surface ?
	this.currentTarget = e.target;

	this.layers.forEach(function(layer) {
		if (!layer.hasElement(this.currentTarget)) { 
			return; 
		}

		if (!e.originalEvent.shiftKey) {
			layer.unselect();
		}

		const item = layer.getItemFromDOMElement(this.currentTarget);
		
		if (item === null) { 
			return; 
		}

		this.currentEditedLayer = layer;
		layer.select(item);
	});
}

EditionState.prototype.onMouseMove = function(e) {

	if (!this.mouseDown || !this.currentEditedLayer) { 
		return; 
	}

	const layer = this.currentEditedLayer;
	const items = layer.selectedItems;
	
	layer.edit(items, e.dx, e.dy, this.currentTarget);
	layer.update(items);

}

EditionState.prototype.onMouseUp = function(e) {

	this.currentEditedLayer = null;
	this.mouseDown = false;

}