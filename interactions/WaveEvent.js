'use strict'

// base class for all Events
// @NOTE: use a single Event per Surface
function WaveEvent(type, originalEvent) {

    this.type = type;
    this.target = originalEvent.target;
    this.currentTarget = originalEvent.currentTarget;
    this.originalEvent = originalEvent;

    // is setted in timeline's states
    // this.currentTarget = null;
    this.x = null;
    this.y = null;
    this.dx = null;
    this.dy = null;
    this.area = null; // @TODO rename


    this.defineArea = function(mouseDownEvent, lastEvent) {
        if (!mouseDownEvent || !lastEvent) { 
            return; 
        }

        this.dx = this.x - lastEvent.x;
        this.dy = this.y - lastEvent.y;

        const left = mouseDownEvent.x < this.x ? mouseDownEvent.x : this.x;
        const top  = mouseDownEvent.y < this.y ? mouseDownEvent.y : this.y;
        const width  = Math.abs(Math.round(this.x - mouseDownEvent.x));
        const height = Math.abs(Math.round(this.y - mouseDownEvent.y));

        this.area = { left, top, width, height };
    }

}

WaveEvent.prototype = Object.create(BaseState.prototype);

WaveEvent.prototype.constructor = WaveEvent;