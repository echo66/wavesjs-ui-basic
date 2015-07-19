'use strict'

/**
*  @class TimelineTimeContext
*
*  A TimelineTimeContext instance represents the mapping between the time and the pixel domains
*
*  The `timelineTimeContext` has 3 important attributes:
*  - `timeContext.xScale` which defines the time to pixel transfert function, itself defined by the `pixelsPerSecond` attribute of the timeline
*  - `timeContext.offset` defines a decay (in time domain) applied to all the views on the timeline. This allow to navigate inside durations longer than what can be represented in Layers (views) containers (e.g. horizontal scroll)
*  - `timeContext.stretchRatio` defines the zoom factor applyed to the timeline
*
*  It owns an helper `timeContext.containersDuration` which maintain a view on how much time the views applyed to the timeline (the `containers`) are representing
*
*  It also maintain an array of references to all the LayerTimeContext attached to the timeline to propagate some global change on the time to pixel representation
*/
function TimelineTimeContext(pixelsPerSecond, visibleWidth) {

	AbstractTimeContext.call(this, {});

	this._children = [];

	this._xScale = null;
	this._originalXScale = null;

	// params
	this._containersDuration = 1; // for layers inheritance only
	this._offset = 0;
	this._stretchRatio = 1;

	Object.defineProperties(this, {

		'pixelsPerSecond' : {
			get : function() {
				return this._pixelsPerSecond
			}, 

			set : function(value) {
				this._pixelsPerSecond = value;

				this.xScaleRange = [0, this.pixelsPerSecond];
				this._visibleDuration = this.visibleWidth / this.pixelsPerSecond;
			}
		}, 

		'offset' : {
			get: function() {
				return this._offset;
			}, 
			set: function(value) {
				this._offset = value;
			}
		}, 

		'zoom' : {
			get : function() {
				return this._zoom;
			}, 
			set : function(value) {
				const xScale = this.originalXScale.copy();
				const _xScale$domain = xScale.domain();
				const min = _xScale$domain[0]; 
				const max = _xScale$domain[1]; 
				const diff = (max - min) / value;

				xScale.domain([min, min + diff]);

				this._xScale = xScale;
				this._zoom = value;

				// Propagate change to children who have their own xScale
				const ratioChange = value / (this._zoom);

				this._children.forEach(function(child) {
					if (!child._xScale) { 
						return; 
					}
					child.stretchRatio = child.zoom * ratioChange;
				});
			}
		}, 

		'visibleWidth' : {
			get : function() {
				return this._visibleWidth;
			}, 

			set : function(value) {
				const widthRatio = value / this.visibleWidth;

				this._visibleWidth = value;
				this._visibleDuration = this.visibleWidth / this.pixelsPerSecond;

				if (this.maintainVisibleDuration) {
					this.pixelsPerSecond = this.pixelsPerSecond * widthRatio;
				}
			}
		},

		'visibleDuration' : {
			get : function() {
				return this._visibleDuration;
			}, 
			// set : function(value) {
			// 	this._visibleDuration = value;
			// }
		}, 

		'maintainVisibleDuration' : {
			get : function() {
				return this._maintainVisibleDuration;
			}, 
			set : function(bool) {
				this._maintainVisibleDuration = bool;
			}
		},

		// @TODO rename to timeToPixel
		'xScale' : {
			get: function() {
				return this._xScale;
			}, 
			set: function(value) {
				this._xScale = scale;

				if (!this._originalXScale) {
					this._originalXScale = this._xScale.copy();
				}
			}
		}, 
		'xScaleRange' : {
			get: function() {
				return this._xScale.range();
			}, 
			set: function(arr) {
				this._xScale.range(arr);
				this._originalXScale.range(arr);
				// propagate to children
				this._children.forEach( function(child){
					child.xScaleRange = arr;
				});
			}
		},
		'originalXScale' : {
			get: function() {
				return this._originalXScale;
			}, 
			set: function(value) {
				this._originalXScale = scale;
			}
		}
	})
}

TimelineTimeContext.prototype = Object.create(AbstractTimeContext.prototype);

TimelineTimeContext.prototype.constructor = TimelineTimeContext;