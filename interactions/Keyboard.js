'use strict'

/**
*  http://javascript.info/tutorial/keyboard-events
*/
function Keyboard(el) {

	EventSource.call(this, el);

	this.body = window.document.body;


	this._createEvent = function(type, e) {
		const event = new WaveEvent(type, e);

		event.shiftKey = e.shiftKey;
		event.ctrlKey = e.ctrlKey;
		event.altKey = e.altKey;
		event.metaKey = e.metaKey;
		event.char = String.fromCharCode(e.keyCode);

		return event;
	}

	this._bindEvents = function() {
		const onKeyDown = function(e) {
			let event = this._createEvent('keydown', e);
			this.emit('event', event);
		};

		const onKeyUp = function(e) {
			let event = this._createEvent('keyup', e);
			this.emit('event', event);
		};

		this.el.onkeydown = onKeyDown;
		this.el.onkeyup = onKeyUp;
	}

}

Keyboard.prototype = Object.create(EventSource.prototype);

Keyboard.prototype.constructor = Keyboard;