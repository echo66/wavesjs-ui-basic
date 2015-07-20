'use strict'

function BaseBehavior(options) {

	if (options == undefined) 
		options = {};

	this._selectedItems = new Set(); // no duplicate in Set
    this._selectedClass = options.selectedClass || 'selected';
    this._layer = null;

    this._params = Object.assign({}, this.getDefaults(), options);


	Object.defineProperties(this, {
		'selectedClass' : {
			get : function() {
				return this._selectedClass;
			}, 
			set : function(value) {
				this._selectedClass = value;
			}
		}, 
		'selectedItems' : {
			get : function() {
				var a = new Array(this._selectedItems.size);
				var i = 0;
				this._selectedItems.forEach(function(e) {
					a[i++] = e;
				});
				return a;
			}
		}
	});

}

BaseBehavior.prototype.initialize = function(layer) {
	this._layer = layer;
}

BaseBehavior.prototype.destroy = function() {
	// clean all items in `this._selectedItems`
}

BaseBehavior.prototype.getDefaults = function() {
	return {};
}

/**
 *  @param item {DOMElement} the item to select
 *  @param datum {Object} the related datum (@NOTE remove it ?)
 */
BaseBehavior.prototype.select = function($item, datum) {
	$item.classList.add(this.selectedClass);
	this._selectedItems.add($item);
}

/**
 *  @param item {DOMElement} the item to select
 *  @param datum {Object} the related datum (@NOTE remove it ?)
 */
BaseBehavior.prototype.unselect = function($item, datum) {
	$item.classList.remove(this.selectedClass);
	this._selectedItems.delete($item);
}

/**
 *  @NOTE is this really usefull ?
 *  @param item {DOMElement} the item to select
 *  @param datum {Object} the related datum (@NOTE remove it ?)
 */
BaseBehavior.prototype.toggleSelection = function($item, datum) {
	const method = (this._selectedItems.has($item)) ? 'unselect' : 'select';
	this[method]($item);
}

/**
 *  Edition behavior
 */
BaseBehavior.prototype.edit = function(renderingContext, shape, datum, dx, dy, target) {
	// must be implemented in children
}

if (!Object.assign) {
	Object.defineProperty(Object, 'assign', {
		enumerable: false,
		configurable: true,
		writable: true,
		value: function(target) {
			'use strict';
			if (target === undefined || target === null) {
				throw new TypeError('Cannot convert first argument to object');
			}

			var to = Object(target);
			for (var i = 1; i < arguments.length; i++) {
				var nextSource = arguments[i];
				if (nextSource === undefined || nextSource === null) {
					continue;
				}
				nextSource = Object(nextSource);

				var keysArray = Object.keys(Object(nextSource));
				for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
					var nextKey = keysArray[nextIndex];
					var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
					if (desc !== undefined && desc.enumerable) {
						to[nextKey] = nextSource[nextKey];
					}
				}
			}
			return to;
		}
	});
}