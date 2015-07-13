'use strict'

function BaseState(timeline, options) {

	if (options == undefined)
		options = {}

	this.timeline = timeline;
	this.layers = timeline.layers;
	// this.interactionsGroup = options.interactionsGroup;

	/**
	 * Called when the timeline is entering the state
	 */
	this.enter = function() {}

	/**
	 * Called when the timeline is exiting the state
	 */
	this.exit = function() {}

	/**
	 * handle registered inputs from surface, keyboard, etc...
	 * @param {Event} the event to process
	 */
	this.handleEvent = function(e) {}

}