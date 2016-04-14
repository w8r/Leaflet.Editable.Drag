/**
 * Leaflet.Editable extension for dragging
 * @author Alexander Milevski <info@w8r.name>
 * @preserve
 */
L.Editable.PathEditor.include({

  /**
   * Hooks dragging in
   * @override
   * @return {L.Editable.PathEditor}
   */
  enable: function() {
    this._enable();
    if (!this.feature.dragging) {
      L.Handler.PathDrag.makeDraggable(this.feature);
    }
    this.feature.dragging.enable();
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
    this.feature.dragging.disable();
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
    if (this.drawing()) {
      this.endDrawing();
    }
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
