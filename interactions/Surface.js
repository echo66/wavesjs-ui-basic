'use strict'

function Surface(el){
	/**
	* @param el <DOMElement> the DOM element to monitore
	* @param padding <Object> the padding of the current surface @TODO
	*/
	EventSource.call(this, el);

	// this.isMouseDown = false;
	this.mouseDownEvent = null;
	this.lastEvent = null;
	this.body = window.document.body;

	/**
	 *  factory method for `Event` class
	 */
	this._createEvent = function(type, e) {
		const event = new WaveEvent(type, e);

		const pos = this._getRelativePosition(e);
		event.x = pos.x;
		event.y = pos.y;

		return event;
	}

	/**
	 * @param  e <Event> raw event from listener
	 * @return <Object> the x, y coordinates coordinates relative to the surface element
	 */
	this._getRelativePosition = function(e) {
		// @TODO: should be able to ignore padding
		let x = 0;
		let y = 0;
		const clientRect = this.el.getBoundingClientRect();
		const scrollLeft = this.body.scrollLeft + document.documentElement.scrollLeft;
		const scrollTop  = this.body.scrollTop + document.documentElement.scrollTop;

		// adapted from http://www.quirksmode.org/js/events_properties.html#position
		if (e.pageX || e.pageY) {
			x = e.pageX;
			y = e.pageY;
		} else if (e.clientX || e.clientY) {
			// normalize to pageX, pageY
			x = e.clientX + scrollLeft;
			y = e.clientY + scrollTop;
		}

		// clientRect refers to the client, not to the page
		x = x - (clientRect.left + scrollLeft);
		y = y - (clientRect.top  + scrollTop );

		// should handle padding

		return { x, y };
	}

	/**
	 * keep this private to avoir double event binding
	 * main logic of the surface is here
	 * should be extended with needed events
	 * @NOTE should we stop the propagation inside the timeline ?
	 */
	this._bindEvents = function() {

		// @NOTE add mouseup on body too
		var onMouseDown = function(e) {
			// e.stopPropagation();
			let event = this._createEvent('mousedown', e);

			this.isMouseDown = true;
			this.mouseDownEvent = event;
			this.lastEvent = event;
			// register mouse move on body - more user friendly
			this.body.addEventListener('mousemove', onMouseMove, false);
			this.body.addEventListener('mouseup', onMouseUp, false);

			this.emit('event', event);
		};

		var onMouseMove = function(e) {
			// e.stopPropagation();
			let event = this._createEvent('mousemove', e);
			event.defineArea(this.mouseDownEvent, this.lastEvent);
			// update `lastEvent` for next call
			this.lastEvent = event;

			this.emit('event', event);
		};

		var onMouseUp = function(e) {
			// e.stopPropagation();
			let event = this._createEvent('mouseup', e);
			event.defineArea(this.mouseDownEvent, this.lastEvent);

			this.isMouseDown = false;
			this.mouseDownEvent = null;
			this.lastEvent = null;
			// remove listener on
			this.body.removeEventListener('mousemove', onMouseMove);
			this.body.removeEventListener('mouseup', onMouseUp);

			this.emit('event', event);
		};

		var onClick = function(e) {
			// e.stopPropagation();
			let event = this._createEvent('click', e);
			this.emit('event', event);
		};

		var onDblClick = function(e) {
			// e.stopPropagation();
			let event = this._createEvent('dblclick', e);
			this.emit('event', event);
		};

		// bind callbacks
		this.el.addEventListener('mousedown', onMouseDown, false);
		this.el.addEventListener('click', onClick, false);
		this.el.addEventListener('dblclick', onDblClick, false);

		// let svgs = this.el.querySelectorAll('svg');
		// for (let i = 0, l = svgs.length; i < l; i++) {
		//   svgs[i].addEventListener('mousedown', onMouseDown, false);
		// }

		// @TODO: mouseenter, mouseleave, wheel ?
	}
}