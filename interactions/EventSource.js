'use strict'

/**
* Main interface for event source
*/
function EventSource(el) {

	EventEmitter.call(this);

	this.el = el;

	this._bindEvents();
}

EventSource.prototype._createEvent = function(type, e) {}

EventSource.prototype._bindEvents = function() {}