'use strict'

function SegmentLayer(data, options) {
	if (options == undefined)
		options = {};

	Layer.call(this, 'collection', data, options);
	this.configureShape(Segment);
	this.setBehavior(new SegmentBehavior());
}

SegmentLayer.prototype = Object.create(Layer.prototype);

SegmentLayer.prototype.constructor = SegmentLayer;