/**
 * Leaflet.Editable extension for dragging
 * @author Alexander Milevski <info@w8r.name>
 * @preserve
 */


L.Editable.include({


  options: L.Util.extend(L.Editable.prototype.options, {
    dragging: true
  }),


  /* eslint-disable new-cap */
  createPolyline: function (latlngs) {
    var line = new this.options.polylineClass(latlngs, {
      draggable: this.options.dragging,
      editOptions: {
        editTools: this
      }
    });
    this.fireAndForward('editable:created', {layer: line});
    return line;
  },


  createPolygon: function (latlngs) {
    var polygon = new this.options.polygonClass(latlngs, {
      draggable: this.options.dragging,
      editOptions: {
        editTools: this
      }
    });
    this.fireAndForward('editable:created', {layer: polygon});
    return polygon;
  }
  /* eslint-enable new-cap */

});


L.Editable.PathEditor.include({

  options: {
    dragging: true
  },

  /**
   * Hooks dragging in
   * @override
   * @return {L.Editable.PathEditor}
   */
  enable: function() {
    this._enable();
    this.feature
      .on('dragstart', this._onFeatureDragStart, this)
      .on('drag',      this._onFeatureDrag,      this)
      .on('dragend',   this._onFeatureDragEnd,   this);

    return this;
  },
  _enable: L.Editable.PathEditor.prototype.enable,


  /**
   * @override
   * @return {L.Editable.PathEditor}
   */
  disable: function() {
    this._disable();
    this.feature
      .off('dragstart', this._onFeatureDragStart, this)
      .off('drag',      this._onFeatureDrag,      this)
      .off('dragend',   this._onFeatureDragEnd,   this);
    return this;
  },
  _disable: L.Editable.PathEditor.prototype.disable,


  /**
   * Basically, remove the vertices
   * @param  {Event} evt
   */
  _onFeatureDragStart: function(evt) {
    this.fireAndForward('editable:shape:dragstart', evt);
    this.editLayer.clearLayers();
    this.commitDrawing();
  },


  /**
   * Just propagate the event
   * @param  {Event} evt
   */
  _onFeatureDrag: function(evt) {
    this.fireAndForward('editable:shape:drag', evt);
  },


  /**
   * Just propagate the event
   * @param  {Event} evt
   */
  _onFeatureDragEnd: function(evt) {
    this.fireAndForward('editable:shape:dragend', evt);
    this.initVertexMarkers();

    // for the circle
    if (typeof this.updateResizeLatLng === 'function') {
      this.updateResizeLatLng();
    }
  }

});
