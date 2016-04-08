L.Editable.PathEditor.include({

  enable: function() {
    this._enable();
    this.feature
      .on('dragstart', this._onFeatureDragStart, this)
      .on('drag',      this._onFeatureDrag,      this)
      .on('dragend',   this._onFeatureDragEnd,   this);

    return this;
  },
  _enable: L.Editable.PathEditor.prototype.enable,


  disable: function() {
    this._disable();
    this.feature
      .off('dragstart', this._onFeatureDragStart, this)
      .off('drag',      this._onFeatureDrag,      this)
      .off('dragend',   this._onFeatureDragEnd,   this);
    return this;
  },
  _disable: L.Editable.PathEditor.prototype.disable,


  _onFeatureDragStart: function(evt) {
    this.fireAndForward('editable:shape:dragstart', evt);
    this.editLayer.clearLayers();
    if(this.drawing()) this.endDrawing();
  },


  _onFeatureDrag: function(evt) {
    this.fireAndForward('editable:shape:drag', evt);
  },


  _onFeatureDragEnd: function(evt) {
    this.fireAndForward('editable:shape:dragend', evt);
    this.initVertexMarkers();
  }

});
