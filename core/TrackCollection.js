'use strict'

/**
 * The `ViewCollection` class allow to update all timeline's tracks at once
 */
function TrackCollection(timeline) {

  Array.call(this);

  this._timeline = timeline;

  // @TODO
  // this should be in the timeline
  this._getLayersOrGroups = function(layerOrGroup) {

    if (layerOrGroup == undefined)
      layerOrGroup = null;

    let layers = null;

    if (typeof layerOrGroup === 'string') {
      layers = this._timeline.groupedLayers[layerOrGroup];
    } else if (layerOrGroup instanceof Layer) {
      layers = [layerOrGroup];
    } else {
      layers = this.layers;
    }

    return layers;
  }

  Object.defineProperties(this, {
    // @NOTE keep this ?
    // could prepare some vertical resizing ability
    // this should be able to modify the layers yScale to be really usefull
    'height' : {
      set : function(value) {
        this.forEach(function(track) { 
          track.height = value; 
        });
      }
    },
    // access layers
    'layers' : {
      get : function() {
        let layers = [];
        this.forEach(function(track) { 
          layers = layers.concat(track.layers); 
        });

        return layers;
      },
    }
  });

  this.render = function() {
    this.forEach(function(track) { 
      track.render(); 
    });
    this._timeline.emit('render');
  }

  // should be update(...layersOrGroups)
  this.update = function(layerOrGroup) {
    const layers = this._getLayersOrGroups(layerOrGroup);
    this.forEach(function(track) { 
      track.update(layers); 
    });
    this._timeline.emit('update', layers);
  }

  this.updateContainer = function(trackOrTrackIds) {
    this.forEach(function(track) { 
      track.updateContainer(); 
    });
    this._timeline.emit('update:containers');
  }

  this.updateLayers = function(layerOrGroup) {
    const layers = this._getLayersOrGroups(layerOrGroup);
    this.forEach(function(track) { 
      track.updateLayers(layers); 
    });
    this._timeline.emit('update:layers');
  }
}


TrackCollection.prototype = Object.create(Array.prototype);

TrackCollection.prototype.constructor = TrackCollection;