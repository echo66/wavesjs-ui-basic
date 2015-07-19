'use strict'

function OrthogonalData() {

	this._cols = null; // object of arrays
	this._rows = null; // array of objects


	// verify that data are consistents
	this._checkConsistency = function() {
		let size = null;

		for (let key in this._cols) {
			const col = this._cols[key];
			const colLength = col.length;

			if (size !== null && size !== colLength) {
				throw new Error(`${this.prototype.constructor.name}: inconsistent data`);
			} else if (size === null) {
				size = colLength;
			}
		}
	}

	this.updateFromCols = function() {
		let keys = Object.keys(this._cols);

		keys.forEach(function(key, i) {
			const col = this._cols[key];

			col.forEach(function(value, index) {
				if (this._rows[index] === undefined) 
					this._rows[index] = {};
				this._rows[index][key] = value;
			});
		});

		this._checkConsistency();
	}

	this.updateFromRows = function() {
		this._rows.forEach(function(obj, index) {
			for (let key in obj) {
				if (index === 0) 
					this._cols[key] = [];
				this._cols[key].push(obj[key]);
			}
		});

		this._checkConsistency();
	}

	Object.defineProperties(this, {
		'rows' : {
			get : function() {
				return this._rows;
			},
			set : function(arr) {
				this._rows = arr;
				this._cols = {};

				this.updateFromRows();
			}
		}, 
		'cols' : {
			get : function() {
				return this._cols;
			}, 
			set : function(obj) {
				this._cols = obj;
				this._rows = [];

				this.updateFromCols();
			}
		}
	});


}
