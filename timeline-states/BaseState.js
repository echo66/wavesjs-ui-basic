'use strict'

function BaseState(timeline, options) {

	if (options == undefined)
		options = {}

	this.timeline = timeline;

	Object.defineProperties(this, {
		'layers' : {
			get : function() {
				return this.timeline.tracks.layers;
			}
		}, 
		'tracks' : {
			get : function() {
				return this.timeline.tracks;
			}
		}
	});
}

/**
 * Called when the timeline is entering the state
 */
BaseState.prototype.enter = function() {}

/**
 * Called when the timeline is exiting the state
 */
BaseState.prototype.exit = function() {}

/**
 * handle registered inputs from surface, keyboard, etc...
 * @param {Event} the event to process
 */
BaseState.prototype.handleEvent = function(e) {}