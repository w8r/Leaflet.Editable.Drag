(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var editable = require('../../');
var MAPBOX_TOKEN = 'pk.eyJ1IjoidzhyIiwiYSI6IlF2Nlh6QVkifQ.D7BkmeoMI7GEkMDtg3durw';

var map = global.map = L.map('map', {
  editable: true
}).setView([31.2352, 121.4942], 15);
map.addLayer(new L.TileLayer(
  'https://a.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}.png?access_token=' + MAPBOX_TOKEN)
);

L.EditControl = L.Control.extend({
  options: {
    position: 'topleft',
    callback: null,
    kind: '',
    html: ''
  },

  onAdd: function (map) {
    var container = L.DomUtil.create('div', 'leaflet-control leaflet-bar'),
        link = L.DomUtil.create('a', '', container);

    link.href = '#';
    link.title = 'Create a new ' + this.options.kind;
    link.innerHTML = this.options.html;
    L.DomEvent
      .on(link, 'click', L.DomEvent.stop)
      .on(link, 'click', function () {
        window.LAYER = this.options.callback(null, {
          draggable: true
        });
    }, this);

    return container;
  }
});

L.NewLineControl = L.EditControl.extend({
  options: {
    position: 'topleft',
    callback: L.Util.bind(map.editTools.startPolyline, map.editTools),
    kind: 'line',
    html: '\\/\\'
  }
});

L.NewPolygonControl = L.EditControl.extend({
  options: {
    position: 'topleft',
    callback: L.Util.bind(map.editTools.startPolygon, map.editTools),
    kind: 'polygon',
    html: '▰'
  }
});

L.NewMarkerControl = L.EditControl.extend({
  options: {
    position: 'topleft',
    callback: L.Util.bind(map.editTools.startMarker, map.editTools),
    kind: 'marker',
    html: '🖈'
  }
});

[
  new L.NewMarkerControl(), new L.NewLineControl(), new L.NewPolygonControl()
].forEach(map.addControl, map);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../":2}],2:[function(require,module,exports){
require('leaflet-editable');
require('leaflet-path-drag');
require('./src/Leaflet.Editable.Drag');

module.exports = L.Editable;

},{"./src/Leaflet.Editable.Drag":8,"leaflet-editable":3,"leaflet-path-drag":4}],3:[function(require,module,exports){
L.Editable = L.Class.extend({

    includes: [L.Mixin.Events],

    statics: {
        FORWARD: 1,
        BACKWARD: -1
    },

    options: {
        zIndex: 1000,
        polygonClass: L.Polygon,
        polylineClass: L.Polyline,
        markerClass: L.Marker,
        drawingCSSClass: 'leaflet-editable-drawing'
    },

    initialize: function (map, options) {
        L.setOptions(this, options);
        this._lastZIndex = this.options.zIndex;
        this.map = map;
        this.editLayer = this.createEditLayer();
        this.featuresLayer = this.createFeaturesLayer();
        this.newClickHandler = this.createNewClickHandler();
        this.forwardLineGuide = this.createLineGuide();
        this.backwardLineGuide = this.createLineGuide();
    },

    fireAndForward: function (type, e) {
        e = e || {};
        e.editTools = this;
        this.fire(type, e);
        this.map.fire(type, e);
    },

    createLineGuide: function () {
        var options = L.extend({dashArray: '5,10', weight: 1}, this.options.lineGuideOptions);
        return L.polyline([], options);
    },

    createVertexIcon: function (options) {
        return L.Browser.touch ? new L.Editable.TouchVertexIcon(options) : new L.Editable.VertexIcon(options);
    },

    createNewClickHandler: function () {
        return L.marker(this.map.getCenter(), {
            icon: this.createVertexIcon({className: 'leaflet-div-icon leaflet-drawing-icon'}),
            opacity: 0,
            zIndexOffset: this._lastZIndex
        });
    },

    createEditLayer: function () {
        return this.options.editLayer || new L.LayerGroup().addTo(this.map);
    },

    createFeaturesLayer: function () {
        return this.options.featuresLayer || new L.LayerGroup().addTo(this.map);
    },

    moveForwardLineGuide: function (latlng) {
        if (this.forwardLineGuide._latlngs.length) {
            this.forwardLineGuide._latlngs[1] = latlng;
            this.forwardLineGuide.redraw();
        }
    },

    moveBackwardLineGuide: function (latlng) {
        if (this.backwardLineGuide._latlngs.length) {
            this.backwardLineGuide._latlngs[1] = latlng;
            this.backwardLineGuide.redraw();
        }
    },

    anchorForwardLineGuide: function (latlng) {
        this.forwardLineGuide._latlngs[0] = latlng;
        this.forwardLineGuide.redraw();
    },

    anchorBackwardLineGuide: function (latlng) {
        this.backwardLineGuide._latlngs[0] = latlng;
        this.backwardLineGuide.redraw();
    },

    attachForwardLineGuide: function () {
        this.editLayer.addLayer(this.forwardLineGuide);
    },

    attachBackwardLineGuide: function () {
        this.editLayer.addLayer(this.backwardLineGuide);
    },

    detachForwardLineGuide: function () {
        this.forwardLineGuide._latlngs = [];
        this.editLayer.removeLayer(this.forwardLineGuide);
    },

    detachBackwardLineGuide: function () {
        this.backwardLineGuide._latlngs = [];
        this.editLayer.removeLayer(this.backwardLineGuide);
    },

    updateNewClickHandlerZIndex: function () {
        this._lastZIndex += 2;
        this.newClickHandler.setZIndexOffset(this._lastZIndex);
    },

    registerForDrawing: function (editor) {
        this.map.on('mousemove touchmove', editor.onMouseMove, editor);
        if (this._drawingEditor) this.unregisterForDrawing(this._drawingEditor);
        this._drawingEditor = editor;
        this.editLayer.addLayer(this.newClickHandler);
        this.newClickHandler.on('click', editor.onNewClickHandlerClicked, editor);
        if (L.Browser.touch) this.map.on('click', editor.onTouch, editor);
        L.DomUtil.addClass(this.map._container, this.options.drawingCSSClass);
        this.updateNewClickHandlerZIndex();
    },

    unregisterForDrawing: function (editor) {
        editor = editor || this._drawingEditor;
        this.editLayer.removeLayer(this.newClickHandler);
        if (!editor) return;
        this.map.off('mousemove touchmove', editor.onMouseMove, editor);
        this.newClickHandler.off('click', editor.onNewClickHandlerClicked, editor);
        if (L.Browser.touch) this.map.off('click', editor.onTouch, editor);
        if (editor !== this._drawingEditor) return;
        delete this._drawingEditor;
        if (editor.drawing) editor.cancelDrawing();
        L.DomUtil.removeClass(this.map._container, this.options.drawingCSSClass);
    },

    stopDrawing: function () {
        this.unregisterForDrawing();
    },

    connectCreatedToMap: function (layer) {
        return this.featuresLayer.addLayer(layer);
    },

    startPolyline: function (latlng) {
        var line = this.createPolyline([]);
        this.connectCreatedToMap(line);
        var editor = line.enableEdit();
        editor.startDrawingForward();
        if (latlng) editor.newPointForward(latlng);
        return line;
    },

    startPolygon: function (latlng) {
        var polygon = this.createPolygon([]);
        this.connectCreatedToMap(polygon);
        var editor = polygon.enableEdit();
        editor.startDrawingForward();
        if (latlng) editor.newPointForward(latlng);
        return polygon;
    },

    startMarker: function (latlng) {
        latlng = latlng || this.map.getCenter();
        var marker = this.createMarker(latlng);
        this.connectCreatedToMap(marker);
        var editor = marker.enableEdit();
        editor.startDrawing();
        return marker;
    },

    startHole: function (editor, latlng) {
        editor.newHole(latlng);
    },

    extendMultiPolygon: function (multi) {
        var polygon = this.createPolygon([]);
        multi.addLayer(polygon);
        polygon.multi = multi;
        var editor = polygon.enableEdit();
        editor.startDrawingForward();
        return polygon;
    },

    createPolyline: function (latlngs) {
        var line = new this.options.polylineClass(latlngs, {editOptions: {editTools: this}});
        this.fireAndForward('editable:created', {layer: line});
        return line;
    },

    createPolygon: function (latlngs) {
        var polygon = new this.options.polygonClass(latlngs, {editOptions: {editTools: this}});
        this.fireAndForward('editable:created', {layer: polygon});
        return polygon;
    },

    createMarker: function (latlng) {
        var marker = new this.options.markerClass(latlng, {editOptions: {editTools: this}});
        this.fireAndForward('editable:created', {layer: marker});
        return marker;
    }

});

L.Map.addInitHook(function () {

    this.whenReady(function () {
        if (this.options.editable) {
            this.editTools = new L.Editable(this, this.options.editOptions);
        }
    });

});

L.Editable.VertexIcon = L.DivIcon.extend({

    options: {
        iconSize: new L.Point(8, 8)
    }

});

L.Editable.TouchVertexIcon = L.Editable.VertexIcon.extend({

    options: {
        iconSize: new L.Point(20, 20)
    }

});


L.Editable.VertexMarker = L.Marker.extend({

    options: {
        draggable: true,
        className: 'leaflet-div-icon leaflet-vertex-icon'
    },

    initialize: function (latlng, latlngs, editor, options) {
        this.latlng = latlng;
        this.latlngs = latlngs;
        this.editor = editor;
        L.Marker.prototype.initialize.call(this, latlng, options);
        this.options.icon = this.editor.tools.createVertexIcon({className: this.options.className});
        this.latlng.__vertex = this;
        this.editor.editLayer.addLayer(this);
        this.setZIndexOffset(editor.tools._lastZIndex + 1);
    },

    onAdd: function (map) {
        L.Marker.prototype.onAdd.call(this, map);
        this.on('drag', this.onDrag);
        this.on('dragstart', this.onDragStart);
        this.on('dragend', this.onDragEnd);
        this.on('click', this.onClick);
        this.on('contextmenu', this.onContextMenu);
        this.on('mousedown touchstart', this.onMouseDown);
        this.addMiddleMarkers();
    },

    onRemove: function (map) {
        if (this.middleMarker) this.middleMarker.delete();
        delete this.latlng.__vertex;
        this.off('drag', this.onDrag);
        this.off('dragstart', this.onDragStart);
        this.off('dragend', this.onDragEnd);
        this.off('click', this.onClick);
        this.off('contextmenu', this.onContextMenu);
        this.off('mousedown touchstart', this.onMouseDown);
        L.Marker.prototype.onRemove.call(this, map);
    },

    onDrag: function (e) {
        e.vertex = this;
        this.editor.onVertexMarkerDrag(e);
        var iconPos = L.DomUtil.getPosition(this._icon),
            latlng = this._map.layerPointToLatLng(iconPos);
        this.latlng.lat = latlng.lat;
        this.latlng.lng = latlng.lng;
        this.editor.refresh();
        if (this.middleMarker) {
            this.middleMarker.updateLatLng();
        }
        var next = this.getNext();
        if (next && next.middleMarker) {
            next.middleMarker.updateLatLng();
        }
    },

    onDragStart: function (e) {
        e.vertex = this;
        this.editor.onVertexMarkerDragStart(e);
    },

    onDragEnd: function (e) {
        e.vertex = this;
        this.editor.onVertexMarkerDragEnd(e);
    },

    onClick: function (e) {
        e.vertex = this;
        this.editor.onVertexMarkerClick(e);
    },

    onContextMenu: function (e) {
        e.vertex = this;
        this.editor.onVertexMarkerContextMenu(e);
    },

    onMouseDown: function (e) {
        e.vertex = this;
        this.editor.onVertexMarkerMouseDown(e);
    },

    delete: function () {
        var next = this.getNext();  // Compute before changing latlng
        this.latlngs.splice(this.latlngs.indexOf(this.latlng), 1);
        this.editor.editLayer.removeLayer(this);
        this.editor.onVertexDeleted({latlng: this.latlng, vertex: this});
        if (next) next.resetMiddleMarker();
    },

    getIndex: function () {
        return this.latlngs.indexOf(this.latlng);
    },

    getLastIndex: function () {
        return this.latlngs.length - 1;
    },

    getPrevious: function () {
        if (this.latlngs.length < 2) return;
        var index = this.getIndex(),
            previousIndex = index - 1;
        if (index === 0 && this.editor.CLOSED) previousIndex = this.getLastIndex();
        var previous = this.latlngs[previousIndex];
        if (previous) return previous.__vertex;
    },

    getNext: function () {
        if (this.latlngs.length < 2) return;
        var index = this.getIndex(),
            nextIndex = index + 1;
        if (index === this.getLastIndex() && this.editor.CLOSED) nextIndex = 0;
        var next = this.latlngs[nextIndex];
        if (next) return next.__vertex;
    },

    addMiddleMarker: function (previous) {
        previous = previous || this.getPrevious();
        if (previous && !this.middleMarker) this.middleMarker = this.editor.addMiddleMarker(previous, this, this.latlngs, this.editor);
    },

    addMiddleMarkers: function () {
        if (this.editor.tools.options.skipMiddleMarkers) return;
        var previous = this.getPrevious();
        if (previous) {
            this.addMiddleMarker(previous);
        }
        var next = this.getNext();
        if (next) {
            next.resetMiddleMarker();
        }
    },

    resetMiddleMarker: function () {
        if (this.middleMarker) this.middleMarker.delete();
        this.addMiddleMarker();
    },

    _initInteraction: function () {
        L.Marker.prototype._initInteraction.call(this);
        L.DomEvent.on(this._icon, 'touchstart', function (e) {this._fireMouseEvent(e);}, this);
    }

});

L.Editable.mergeOptions({
    vertexMarkerClass: L.Editable.VertexMarker
});

L.Editable.MiddleMarker = L.Marker.extend({

    options: {
        opacity: 0.5,
        className: 'leaflet-div-icon leaflet-middle-icon'
    },

    initialize: function (left, right, latlngs, editor, options) {
        this.left = left;
        this.right = right;
        this.editor = editor;
        this.latlngs = latlngs;
        L.Marker.prototype.initialize.call(this, this.computeLatLng(), options);
        this._opacity = this.options.opacity;
        this.options.icon = this.editor.tools.createVertexIcon({className: this.options.className});
        this.editor.editLayer.addLayer(this);
        this.setVisibility();
    },

    setVisibility: function () {
        var leftPoint = this._map.latLngToContainerPoint(this.left.latlng),
            rightPoint = this._map.latLngToContainerPoint(this.right.latlng),
            size = L.point(this.options.icon.options.iconSize);
        if (leftPoint.distanceTo(rightPoint) < size.x * 3) {
            this.hide();
        } else {
            this.show();
        }
    },

    show: function () {
        this.setOpacity(this._opacity);
    },

    hide: function () {
        this.setOpacity(0);
    },

    updateLatLng: function () {
        this.setLatLng(this.computeLatLng());
        this.setVisibility();
    },

    computeLatLng: function () {
        var leftPoint = this.editor.map.latLngToContainerPoint(this.left.latlng),
            rightPoint = this.editor.map.latLngToContainerPoint(this.right.latlng),
            y = (leftPoint.y + rightPoint.y) / 2,
            x = (leftPoint.x + rightPoint.x) / 2;
        return this.editor.map.containerPointToLatLng([x, y]);
    },

    onAdd: function (map) {
        L.Marker.prototype.onAdd.call(this, map);
        this.on('mousedown touchstart', this.onMouseDown);
        map.on('zoomend', this.setVisibility, this);
    },

    onRemove: function (map) {
        delete this.right.middleMarker;
        this.off('mousedown touchstart', this.onMouseDown);
        map.off('zoomend', this.setVisibility, this);
        L.Marker.prototype.onRemove.call(this, map);
    },

    onMouseDown: function (e) {
        this.editor.onMiddleMarkerMouseDown(e, this);
        this.latlngs.splice(this.index(), 0, e.latlng);
        this.editor.refresh();
        var marker = this.editor.addVertexMarker(e.latlng, this.latlngs);
        marker.dragging._draggable._onDown(e.originalEvent);  // Transfer ongoing dragging to real marker
        this.delete();
    },

    delete: function () {
        this.editor.editLayer.removeLayer(this);
    },

    index: function () {
        return this.latlngs.indexOf(this.right.latlng);
    },

    _initInteraction: function () {
        L.Marker.prototype._initInteraction.call(this);
        L.DomEvent.on(this._icon, 'touchstart', function (e) {this._fireMouseEvent(e);}, this);
    }

});

L.Editable.mergeOptions({
    middleMarkerClass: L.Editable.MiddleMarker
});

L.Editable.BaseEditor = L.Class.extend({

    initialize: function (map, feature, options) {
        L.setOptions(this, options);
        this.map = map;
        this.feature = feature;
        this.feature.editor = this;
        this.editLayer = new L.LayerGroup();
        this.tools = this.options.editTools || map.editTools;
    },

    enable: function () {
        if (this._enabled) return this;
        this.tools.editLayer.addLayer(this.editLayer);
        this.onEnable();
        this._enabled = true;
        this.feature.on('remove', this.disable, this);
        return this;
    },

    disable: function () {
        this.feature.off('remove', this.disable, this);
        this.editLayer.clearLayers();
        this.tools.editLayer.removeLayer(this.editLayer);
        this.onDisable();
        delete this._enabled;
        if (this.drawing) this.cancelDrawing();
        return this;
    },

    fireAndForward: function (type, e) {
        e = e || {};
        e.layer = this.feature;
        this.feature.fire(type, e);
        if (this.feature.multi) this.feature.multi.fire(type, e);
        this.tools.fireAndForward(type, e);
    },

    onEnable: function () {
        this.fireAndForward('editable:enable');
    },

    onDisable: function () {
        this.fireAndForward('editable:disable');
    },

    onEditing: function () {
        this.fireAndForward('editable:editing');
    },

    onStartDrawing: function () {
        this.fireAndForward('editable:drawing:start');
    },

    onEndDrawing: function () {
        this.fireAndForward('editable:drawing:end');
    },

    onCancelDrawing: function () {
        this.fireAndForward('editable:drawing:cancel');
    },

    onCommitDrawing: function () {
        this.fireAndForward('editable:drawing:commit');
    },

    startDrawing: function () {
        if (!this.drawing) this.drawing = L.Editable.FORWARD;
        this.tools.registerForDrawing(this);
        this.onStartDrawing();
    },

    commitDrawing: function () {
        this.onCommitDrawing();
        this.endDrawing();
    },

    cancelDrawing: function () {
        this.onCancelDrawing();
        this.endDrawing();
    },

    endDrawing: function () {
        this.drawing = false;
        this.tools.unregisterForDrawing(this);
        this.onEndDrawing();
    },

    onMouseMove: function (e) {
        if (this.drawing) {
            this.tools.newClickHandler.setLatLng(e.latlng);
        }
    },

    onTouch: function (e) {
        this.onMouseMove(e);
        if (this.drawing) this.tools.newClickHandler._fireMouseEvent(e);
    },

    onNewClickHandlerClicked: function (e) {
        this.fireAndForward('editable:drawing:click', e);
    },

    isNewClickValid: function (latlng) {
        return true;
    }

});

L.Editable.MarkerEditor = L.Editable.BaseEditor.extend({

    enable: function () {
        if (this._enabled) return this;
        L.Editable.BaseEditor.prototype.enable.call(this);
        this.feature.dragging.enable();
        this.feature.on('dragstart', this.onEditing, this);
        return this;
    },

    disable: function () {
        L.Editable.BaseEditor.prototype.disable.call(this);
        this.feature.dragging.disable();
        this.feature.off('dragstart', this.onEditing, this);
        return this;
    },

    onMouseMove: function (e) {
        if (this.drawing) {
            L.Editable.BaseEditor.prototype.onMouseMove.call(this, e);
            this.feature.setLatLng(e.latlng);
            this.tools.newClickHandler._bringToFront();
        }
    },

    onNewClickHandlerClicked: function (e) {
        if (!this.isNewClickValid(e.latlng)) return;
        // Send event before finishing drawing
        L.Editable.BaseEditor.prototype.onNewClickHandlerClicked.call(this, e);
        this.commitDrawing();
    }

});

L.Editable.PathEditor = L.Editable.BaseEditor.extend({

    CLOSED: false,
    MIN_VERTEX: 2,

    enable: function () {
        if (this._enabled) return this;
        L.Editable.BaseEditor.prototype.enable.call(this);
        if (this.feature) {
            this.initVertexMarkers();
        }
        return this;
    },

    disable: function () {
        return L.Editable.BaseEditor.prototype.disable.call(this);
    },

    initVertexMarkers: function () {
        // groups can be only latlngs (for polyline or symple polygon,
        // or latlngs plus many holes, in case of a complex polygon)
        var latLngGroups = this.getLatLngsGroups();
        for (var i = 0; i < latLngGroups.length; i++) {
            this.addVertexMarkers(latLngGroups[i]);
        }
    },

    getLatLngsGroups: function () {
        return [this.getLatLngs()];
    },

    getLatLngs: function () {
        return this.feature.getLatLngs();
    },

    reset: function () {
        this.editLayer.clearLayers();
        this.initVertexMarkers();
    },

    addVertexMarker: function (latlng, latlngs) {
        return new this.tools.options.vertexMarkerClass(latlng, latlngs, this);
    },

    addVertexMarkers: function (latlngs) {
        for (var i = 0; i < latlngs.length; i++) {
            this.addVertexMarker(latlngs[i], latlngs);
        }
    },

    addMiddleMarker: function (left, right, latlngs) {
        return new this.tools.options.middleMarkerClass(left, right, latlngs, this);
    },

    onVertexMarkerClick: function (e) {
        var index = e.vertex.getIndex();
        if (e.originalEvent.ctrlKey) {
            this.onVertexMarkerCtrlClick(e);
        } else if (e.originalEvent.altKey) {
            this.onVertexMarkerAltClick(e);
        } else if (e.originalEvent.shiftKey) {
            this.onVertexMarkerShiftClick(e);
        } else if (index >= this.MIN_VERTEX - 1 && index === e.vertex.getLastIndex() && this.drawing === L.Editable.FORWARD) {
            this.commitDrawing();
        } else if (index === 0 && this.drawing === L.Editable.BACKWARD && this._drawnLatLngs.length >= this.MIN_VERTEX) {
            this.commitDrawing();
        } else if (index === 0 && this.drawing === L.Editable.FORWARD && this._drawnLatLngs.length >= this.MIN_VERTEX && this.CLOSED) {
            this.commitDrawing();  // Allow to close on first point also for polygons
        } else {
            this.onVertexRawMarkerClick(e);
        }
    },

    onVertexRawMarkerClick: function (e) {
        if (!this.vertexCanBeDeleted(e.vertex)) return;
        e.vertex.delete();
        this.refresh();
    },

    vertexCanBeDeleted: function (vertex) {
        return vertex.latlngs.length > this.MIN_VERTEX;
    },

    onVertexDeleted: function (e) {
        this.fireAndForward('editable:vertex:deleted', e);
    },

    onVertexMarkerCtrlClick: function (e) {
        this.fireAndForward('editable:vertex:ctrlclick', e);
    },

    onVertexMarkerShiftClick: function (e) {
        this.fireAndForward('editable:vertex:shiftclick', e);
    },

    onVertexMarkerAltClick: function (e) {
        this.fireAndForward('editable:vertex:altclick', e);
    },

    onVertexMarkerContextMenu: function (e) {
        this.fireAndForward('editable:vertex:contextmenu', e);
    },

    onVertexMarkerMouseDown: function (e) {
        this.fireAndForward('editable:vertex:mousedown', e);
    },

    onMiddleMarkerMouseDown: function (e) {
        this.fireAndForward('editable:middlemarker:mousedown', e);
    },

    onVertexMarkerDrag: function (e) {
        this.fireAndForward('editable:vertex:drag', e);
    },

    onVertexMarkerDragStart: function (e) {
        this.fireAndForward('editable:vertex:dragstart', e);
    },

    onVertexMarkerDragEnd: function (e) {
        this.fireAndForward('editable:vertex:dragend', e);
    },

    startDrawing: function () {
        if (!this._drawnLatLngs) this._drawnLatLngs = this.getLatLngs();
        L.Editable.BaseEditor.prototype.startDrawing.call(this);
    },

    startDrawingForward: function () {
        this.startDrawing();
        this.tools.attachForwardLineGuide();
    },

    endDrawing: function () {
        L.Editable.BaseEditor.prototype.endDrawing.call(this);
        this.tools.detachForwardLineGuide();
        this.tools.detachBackwardLineGuide();
        delete this._drawnLatLngs;
    },

    addLatLng: function (latlng) {
        if (this.drawing === L.Editable.FORWARD) this._drawnLatLngs.push(latlng);
        else this._drawnLatLngs.unshift(latlng);
        this.refresh();
        this.addVertexMarker(latlng, this._drawnLatLngs);
    },

    newPointForward: function (latlng) {
        this.addLatLng(latlng);
        this.tools.anchorForwardLineGuide(latlng);
        if (!this.tools.backwardLineGuide._latlngs[0]) {
            this.tools.anchorBackwardLineGuide(latlng);
        }
    },

    newPointBackward: function (latlng) {
        this.addLatLng(latlng);
        this.tools.anchorBackwardLineGuide(latlng);
    },

    onNewClickHandlerClicked: function (e) {
        if (!this.isNewClickValid(e.latlng)) return;
        if (this.drawing === L.Editable.FORWARD) this.newPointForward(e.latlng);
        else this.newPointBackward(e.latlng);
        L.Editable.BaseEditor.prototype.onNewClickHandlerClicked.call(this, e);
    },

    onMouseMove: function (e) {
        if (this.drawing) {
            L.Editable.BaseEditor.prototype.onMouseMove.call(this, e);
            this.tools.moveForwardLineGuide(e.latlng);
            this.tools.moveBackwardLineGuide(e.latlng);
        }
    },

    refresh: function () {
        this.feature.redraw();
        this.onEditing();
    }

});

L.Editable.PolylineEditor = L.Editable.PathEditor.extend({

    startDrawingBackward: function () {
        this.drawing = L.Editable.BACKWARD;
        this.startDrawing();
        this.tools.attachBackwardLineGuide();
    },

    continueBackward: function () {
        this.tools.anchorBackwardLineGuide(this.getFirstLatLng());
        this.startDrawingBackward();
    },

    continueForward: function () {
        this.tools.anchorForwardLineGuide(this.getLastLatLng());
        this.startDrawingForward();
    },

    getLastLatLng: function () {
        return this.getLatLngs()[this.getLatLngs().length - 1];
    },

    getFirstLatLng: function () {
        return this.getLatLngs()[0];
    }

});

L.Editable.PolygonEditor = L.Editable.PathEditor.extend({

    CLOSED: true,
    MIN_VERTEX: 3,

    getLatLngsGroups: function () {
        var groups = L.Editable.PathEditor.prototype.getLatLngsGroups.call(this);
        if (this.feature._holes) {
            for (var i = 0; i < this.feature._holes.length; i++) {
                groups.push(this.feature._holes[i]);
            }
        }
        return groups;
    },

    startDrawingForward: function () {
        L.Editable.PathEditor.prototype.startDrawingForward.call(this);
        this.tools.attachBackwardLineGuide();
    },

    addNewEmptyHole: function () {
        var holes = Array();
        if (!this.feature._holes) {
            this.feature._holes = [];
        }
        this.feature._holes.push(holes);
        return holes;
    },

    newHole: function (latlng) {
        this._drawnLatLngs = this.addNewEmptyHole();
        this.startDrawingForward();
        if (latlng) this.newPointForward(latlng);
    },

    checkContains: function (latlng) {
        return this.feature._containsPoint(this.map.latLngToLayerPoint(latlng));
    },

    vertexCanBeDeleted: function (vertex) {
        if (vertex.latlngs === this.getLatLngs()) return L.Editable.PathEditor.prototype.vertexCanBeDeleted.call(this, vertex);
        else return true;  // Holes can be totally deleted without removing the layer itself
    },

    isNewClickValid: function (latlng) {
        if (this._drawnLatLngs !== this.getLatLngs()) return this.checkContains(latlng);
        return true;
    },

    onVertexDeleted: function (e) {
        L.Editable.PathEditor.prototype.onVertexDeleted.call(this, e);
        if (!e.vertex.latlngs.length && e.vertex.latlngs !== this.getLatLngs()) {
            this.feature._holes.splice(this.feature._holes.indexOf(e.vertex.latlngs), 1);
        }
    }

});

L.Map.mergeOptions({
    polylineEditorClass: L.Editable.PolylineEditor
});

L.Map.mergeOptions({
    polygonEditorClass: L.Editable.PolygonEditor
});

L.Map.mergeOptions({
    markerEditorClass: L.Editable.MarkerEditor
});

var EditableMixin = {

    createEditor: function (map) {
        map = map || this._map;
        var Klass = this.options.editorClass || this.getEditorClass(map);
        return new Klass(map, this, this.options.editOptions);
    },

    enableEdit: function () {
        if (!this.editor) this.createEditor();
        if (this.multi) this.multi.onEditEnabled();
        return this.editor.enable();
    },

    editEnabled: function () {
        return this.editor && this.editor._enabled;
    },

    disableEdit: function () {
        if (this.editor) {
            if (this.multi) this.multi.onEditDisabled();
            this.editor.disable();
            delete this.editor;
        }
    },

    toggleEdit: function () {
      if (this.editEnabled()) {
        this.disableEdit();
      } else {
        this.enableEdit();
      }
    }

};

L.Polyline.include(EditableMixin);
L.Polygon.include(EditableMixin);
L.Marker.include(EditableMixin);

L.Polyline.include({

    _containsPoint: function (p, closed) {  // Copy-pasted from Leaflet
        var i, j, k, len, len2, dist, part,
            w = this.options.weight / 2;

        if (L.Browser.touch) {
            w += 10; // polyline click tolerance on touch devices
        }

        for (i = 0, len = this._parts.length; i < len; i++) {
            part = this._parts[i];
            for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
                if (!closed && (j === 0)) {
                    continue;
                }

                dist = L.LineUtil.pointToSegmentDistance(p, part[k], part[j]);

                if (dist <= w) {
                    return true;
                }
            }
        }
        return false;
    },

    getEditorClass: function (map) {
        return map.options.polylineEditorClass;
    }

});
L.Polygon.include({

    _containsPoint: function (p) {  // Copy-pasted from Leaflet
        var inside = false,
            part, p1, p2,
            i, j, k,
            len, len2;

        // TODO optimization: check if within bounds first

        if (L.Polyline.prototype._containsPoint.call(this, p, true)) {
            // click on polygon border
            return true;
        }

        // ray casting algorithm for detecting if point is in polygon

        for (i = 0, len = this._parts.length; i < len; i++) {
            part = this._parts[i];

            for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
                p1 = part[j];
                p2 = part[k];

                if (((p1.y > p.y) !== (p2.y > p.y)) &&
                        (p.x < (p2.x - p1.x) * (p.y - p1.y) / (p2.y - p1.y) + p1.x)) {
                    inside = !inside;
                }
            }
        }

        return inside;
    },

    getEditorClass: function (map) {
        return map.options.polygonEditorClass;
    }

});

L.Marker.include({

    getEditorClass: function (map) {
        return map.options.markerEditorClass;
    }

});

var MultiEditableMixin = {

    enableEdit: function () {
        this.eachLayer(function(layer) {
            layer.multi = this;
            layer.enableEdit();
        }, this);
    },

    disableEdit: function () {
        this.eachLayer(function(layer) {
            layer.disableEdit();
        });
    },

    toggleEdit: function (e) {
        if (!e.layer.editor) {
            this.enableEdit(e);
        } else {
            this.disableEdit();
        }
    },

    onEditEnabled: function () {
        if (!this._editEnabled) {
            this._editEnabled = true;
            this.fire('editable:multi:edit:enabled');
        }
    },

    onEditDisabled: function () {
        if (this._editEnabled) {
            this._editEnabled = false;
            this.fire('editable:multi:edit:disabled');
        }
    },

    editEnabled: function () {
        return !!this._editEnabled;
    }

};
L.MultiPolygon.include(MultiEditableMixin);
L.MultiPolyline.include(MultiEditableMixin);

},{}],4:[function(require,module,exports){
require('./src/Path.Transform');
require('./src/Path.Drag');
require('./src/MultiPoly.Drag');

module.exports = L.Path.Drag;

},{"./src/MultiPoly.Drag":5,"./src/Path.Drag":6,"./src/Path.Transform":7}],5:[function(require,module,exports){
(function() {

  // listen and propagate dragstart on sub-layers
  L.FeatureGroup.EVENTS += ' dragstart';

  function wrapMethod(klasses, methodName, method) {
    for (var i = 0, len = klasses.length; i < len; i++) {
      var klass = klasses[i];
      klass.prototype['_' + methodName] = klass.prototype[methodName];
      klass.prototype[methodName] = method;
    }
  }

  /**
   * @param {L.Polygon|L.Polyline} layer
   * @return {L.MultiPolygon|L.MultiPolyline}
   */
  function addLayer(layer) {
    if (this.hasLayer(layer)) {
      return this;
    }
    layer
      .on('drag', this._onDrag, this)
      .on('dragend', this._onDragEnd, this);
    return this._addLayer.call(this, layer);
  }

  /**
   * @param  {L.Polygon|L.Polyline} layer
   * @return {L.MultiPolygon|L.MultiPolyline}
   */
  function removeLayer(layer) {
    if (!this.hasLayer(layer)) {
      return this;
    }
    layer
      .off('drag', this._onDrag, this)
      .off('dragend', this._onDragEnd, this);
    return this._removeLayer.call(this, layer);
  }

  // duck-type methods to listen to the drag events
  wrapMethod([L.MultiPolygon, L.MultiPolyline], 'addLayer', addLayer);
  wrapMethod([L.MultiPolygon, L.MultiPolyline], 'removeLayer', removeLayer);

  var dragMethods = {
    _onDrag: function(evt) {
      var layer = evt.target;
      this.eachLayer(function(otherLayer) {
        if (otherLayer !== layer) {
          otherLayer._applyTransform(layer.dragging._matrix);
        }
      });

      this._propagateEvent(evt);
    },

    _onDragEnd: function(evt) {
      var layer = evt.target;

      this.eachLayer(function(otherLayer) {
        if (otherLayer !== layer) {
          otherLayer._resetTransform();
          otherLayer.dragging._transformPoints(layer.dragging._matrix);
        }
      });

      this._propagateEvent(evt);
    }
  };

  L.MultiPolygon.include(dragMethods);
  L.MultiPolyline.include(dragMethods);

})();

},{}],6:[function(require,module,exports){
/**
 * Leaflet vector features drag functionality
 * @preserve
 */

"use strict";

/**
 * Drag handler
 * @class L.Path.Drag
 * @extends {L.Handler}
 */
L.Handler.PathDrag = L.Handler.extend( /** @lends  L.Path.Drag.prototype */ {

  statics: {
    DRAGGABLE_CLS: 'leaflet-path-draggable'
  },

  /**
   * @param  {L.Path} path
   * @constructor
   */
  initialize: function(path) {

    /**
     * @type {L.Path}
     */
    this._path = path;

    /**
     * @type {Array.<Number>}
     */
    this._matrix = null;

    /**
     * @type {L.Point}
     */
    this._startPoint = null;

    /**
     * @type {L.Point}
     */
    this._dragStartPoint = null;

    /**
     * @type {Boolean}
     */
    this._dragInProgress = false;

    /**
     * @type {Boolean}
     */
    this._dragMoved = false;

  },


  /**
   * Enable dragging
   */
  addHooks: function() {
    var className = L.Handler.PathDrag.DRAGGABLE_CLS;
    var path      = this._path._path;

    this._path.on('mousedown', this._onDragStart, this);
    this._path.options.className =
      (this._path.options.className || '') + ' ' + className;

    if (!L.Path.CANVAS && path) {
      L.DomUtil.addClass(path, className);
    }
  },


  /**
   * Disable dragging
   */
  removeHooks: function() {
    var className = L.Handler.PathDrag.DRAGGABLE_CLS;
    var path      = this._path._path;

    this._path.off('mousedown', this._onDragStart, this);
    this._path.options.className =
      (this._path.options.className || '').replace(className, '');

    if (!L.Path.CANVAS && path) {
      L.DomUtil.removeClass(path, className);
    }
    this._dragMoved = false;
  },


  /**
   * @return {Boolean}
   */
  moved: function() {
    return this._dragMoved;
  },


  /**
   * If dragging currently in progress.
   *
   * @return {Boolean}
   */
  inProgress: function() {
    return this._dragInProgress;
  },


  /**
   * Start drag
   * @param  {L.MouseEvent} evt
   */
  _onDragStart: function(evt) {
    this._dragInProgress = true;
    this._startPoint = evt.containerPoint.clone();
    this._dragStartPoint = evt.containerPoint.clone();
    this._matrix = [1, 0, 0, 1, 0, 0];

    if(this._path._point) {
      this._point = this._path._point.clone();
    }

    this._path._map
      .on('mousemove', this._onDrag, this)
      .on('mouseup', this._onDragEnd, this)
    this._dragMoved = false;
  },


  /**
   * Dragging
   * @param  {L.MouseEvent} evt
   */
  _onDrag: function(evt) {
    var x = evt.containerPoint.x;
    var y = evt.containerPoint.y;

    var matrix     = this._matrix;
    var path       = this._path;
    var startPoint = this._startPoint;

    var dx = x - startPoint.x;
    var dy = y - startPoint.y;

    if (!this._dragMoved && (dx || dy)) {
      this._dragMoved = true;
      path.fire('dragstart');

      if (path._popup) {
        path._popup._close();
        path.off('click', path._openPopup, path);
      }
    }

    matrix[4] += dx;
    matrix[5] += dy;

    startPoint.x = x;
    startPoint.y = y;

    path._applyTransform(matrix);

    if (path._point) { // L.Circle, L.CircleMarker
      path._point.x = this._point.x + matrix[4];
      path._point.y = this._point.y + matrix[5];
    }

    path.fire('drag');
    L.DomEvent.stop(evt.originalEvent);
  },


  /**
   * Dragging stopped, apply
   * @param  {L.MouseEvent} evt
   */
  _onDragEnd: function(evt) {
    L.DomEvent.stop(evt);
    L.DomEvent._fakeStop({ type: 'click' });

    this._dragInProgress = false;
    // undo container transform
    this._path._resetTransform();
    // apply matrix
    this._transformPoints(this._matrix);

    this._path._map
      .off('mousemove', this._onDrag, this)
      .off('mouseup', this._onDragEnd, this);

    // consistency
    this._path.fire('dragend', {
      distance: Math.sqrt(
        L.LineUtil._sqDist(this._dragStartPoint, evt.containerPoint)
      )
    });

    if (this._path._popup) {
      L.Util.requestAnimFrame(function() {
        this._path.on('click', this._path._openPopup, this._path);
      }, this);
    }

    this._matrix = null;
    this._startPoint = null;
    this._point = null;
    this._dragStartPoint = null;
  },


  /**
   * Transforms point according to the provided transformation matrix.
   *
   *  @param {Array.<Number>} matrix
   *  @param {L.LatLng} point
   */
  _transformPoint: function(point, matrix) {
    var path = this._path;

    var px = L.point(matrix[4], matrix[5]);

    var crs = path._map.options.crs;
    var transformation = crs.transformation;
    var scale = crs.scale(path._map.getZoom());
    var projection = crs.projection;

    var diff = transformation.untransform(px, scale)
      .subtract(transformation.untransform(L.point(0, 0), scale));

    return projection.unproject(projection.project(point)._add(diff));
  },


  /**
   * Applies transformation, does it in one sweep for performance,
   * so don't be surprised about the code repetition.
   *
   * [ x ]   [ a  b  tx ] [ x ]   [ a * x + b * y + tx ]
   * [ y ] = [ c  d  ty ] [ y ] = [ c * x + d * y + ty ]
   *
   * @param {Array.<Number>} matrix
   */
  _transformPoints: function(matrix) {
    var path = this._path;
    var i, len, latlng;

    var px = L.point(matrix[4], matrix[5]);

    var crs = path._map.options.crs;
    var transformation = crs.transformation;
    var scale = crs.scale(path._map.getZoom());
    var projection = crs.projection;

    var diff = transformation.untransform(px, scale)
      .subtract(transformation.untransform(L.point(0, 0), scale));

    // console.time('transform');

    // all shifts are in-place
    if (path._point) { // L.Circle
      path._latlng = projection.unproject(
        projection.project(path._latlng)._add(diff));
      path._point = this._point._add(px);
    } else if (path._originalPoints) { // everything else
      for (i = 0, len = path._originalPoints.length; i < len; i++) {
        latlng = path._latlngs[i];
        path._latlngs[i] = projection
          .unproject(projection.project(latlng)._add(diff));
        path._originalPoints[i]._add(px);
      }
    }

    // holes operations
    if (path._holes) {
      for (i = 0, len = path._holes.length; i < len; i++) {
        for (var j = 0, len2 = path._holes[i].length; j < len2; j++) {
          latlng = path._holes[i][j];
          path._holes[i][j] = projection
            .unproject(projection.project(latlng)._add(diff));
          path._holePoints[i][j]._add(px);
        }
      }
    }

    // console.timeEnd('transform');

    path._updatePath();
  }

});


// Init hook instead of replacing the `initEvents`
L.Path.addInitHook(function() {
  if (this.options.draggable) {
    if (this.dragging) {
      this.dragging.enable();
    } else {
      this.dragging = new L.Handler.PathDrag(this);
      this.dragging.enable();
    }
  } else if (this.dragging) {
    this.dragging.disable();
  }
});

/*
 * Return transformed points in case if dragging is enabled and in progress,
 * otherwise - call original method.
 *
 * For L.Circle and L.Polyline
 */

// don't like this? me neither, but I like it even less
// when the original methods are not exposed
L.Circle.prototype._getLatLng = L.Circle.prototype.getLatLng;
L.Circle.prototype.getLatLng = function() {
  if (this.dragging && this.dragging.inProgress()) {
    return this.dragging._transformPoint(this._latlng, this.dragging._matrix);
  } else {
    return this._getLatLng();
  }
};


L.Polyline.prototype._getLatLngs = L.Polyline.prototype.getLatLngs;
L.Polyline.prototype.getLatLngs = function() {
  if (this.dragging && this.dragging.inProgress()) {
    var matrix = this.dragging._matrix;
    var points = this._getLatLngs();
    for (var i = 0, len = points.length; i < len; i++) {
      points[i] = this.dragging._transformPoint(points[i], matrix);
    }
    return points;
  } else {
    return this._getLatLngs();
  }
};

},{}],7:[function(require,module,exports){
/**
 * Matrix transform path for SVG/VML
 * TODO: adapt to Leaflet 0.8 upon release
 */

"use strict";

if (L.Browser.svg) { // SVG transformation

  L.Path.include({

    /**
     * Reset transform matrix
     */
    _resetTransform: function() {
      this._container.setAttributeNS(null, 'transform', '');
    },

    /**
     * Applies matrix transformation to SVG
     * @param {Array.<Number>} matrix
     */
    _applyTransform: function(matrix) {
      this._container.setAttributeNS(null, "transform",
        'matrix(' + matrix.join(' ') + ')');
    }

  });

} else { // VML transform routines

  L.Path.include({

    /**
     * Reset transform matrix
     */
    _resetTransform: function() {
      if (this._skew) {
        // super important! workaround for a 'jumping' glitch:
        // disable transform before removing it
        this._skew.on = false;
        this._container.removeChild(this._skew);
        this._skew = null;
      }
    },

    /**
     * Applies matrix transformation to VML
     * @param {Array.<Number>} matrix
     */
    _applyTransform: function(matrix) {
      var skew = this._skew;

      if (!skew) {
        skew = this._createElement('skew');
        this._container.appendChild(skew);
        skew.style.behavior = 'url(#default#VML)';
        this._skew = skew;
      }

      // handle skew/translate separately, cause it's broken
      var mt = matrix[0].toFixed(8) + " " + matrix[1].toFixed(8) + " " +
        matrix[2].toFixed(8) + " " + matrix[3].toFixed(8) + " 0 0";
      var offset = Math.floor(matrix[4]).toFixed() + ", " +
        Math.floor(matrix[5]).toFixed() + "";

      var s = this._container.style;
      var l = parseFloat(s.left);
      var t = parseFloat(s.top);
      var w = parseFloat(s.width);
      var h = parseFloat(s.height);

      if (isNaN(l)) l = 0;
      if (isNaN(t)) t = 0;
      if (isNaN(w) || !w) w = 1;
      if (isNaN(h) || !h) h = 1;

      var origin = (-l / w - 0.5).toFixed(8) + " " + (-t / h - 0.5).toFixed(8);

      skew.on = "f";
      skew.matrix = mt;
      skew.origin = origin;
      skew.offset = offset;
      skew.on = true;
    }

  });
}

// Renderer-independent
L.Path.include({

  /**
   * Check if the feature was dragged, that'll supress the click event
   * on mouseup. That fixes popups for example
   *
   * @param  {MouseEvent} e
   */
  _onMouseClick: function(e) {
    if ((this.dragging && this.dragging.moved()) ||
      (this._map.dragging && this._map.dragging.moved())) {
      return;
    }

    this._fireMouseEvent(e);
  }
});

},{}],8:[function(require,module,exports){
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlL2pzL2FwcC5qcyIsImluZGV4LmpzIiwibm9kZV9tb2R1bGVzL2xlYWZsZXQtZWRpdGFibGUvc3JjL0xlYWZsZXQuRWRpdGFibGUuanMiLCJub2RlX21vZHVsZXMvbGVhZmxldC1wYXRoLWRyYWcvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbGVhZmxldC1wYXRoLWRyYWcvc3JjL011bHRpUG9seS5EcmFnLmpzIiwibm9kZV9tb2R1bGVzL2xlYWZsZXQtcGF0aC1kcmFnL3NyYy9QYXRoLkRyYWcuanMiLCJub2RlX21vZHVsZXMvbGVhZmxldC1wYXRoLWRyYWcvc3JjL1BhdGguVHJhbnNmb3JtLmpzIiwic3JjL0xlYWZsZXQuRWRpdGFibGUuRHJhZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBlZGl0YWJsZSA9IHJlcXVpcmUoJy4uLy4uLycpO1xudmFyIE1BUEJPWF9UT0tFTiA9ICdway5leUoxSWpvaWR6aHlJaXdpWVNJNklsRjJObGg2UVZraWZRLkQ3QmttZW9NSTdHRWtNRHRnM2R1cncnO1xuXG52YXIgbWFwID0gZ2xvYmFsLm1hcCA9IEwubWFwKCdtYXAnLCB7XG4gIGVkaXRhYmxlOiB0cnVlXG59KS5zZXRWaWV3KFszMS4yMzUyLCAxMjEuNDk0Ml0sIDE1KTtcbm1hcC5hZGRMYXllcihuZXcgTC5UaWxlTGF5ZXIoXG4gICdodHRwczovL2EudGlsZXMubWFwYm94LmNvbS92NC9tYXBib3guc3RyZWV0cy1iYXNpYy97en0ve3h9L3t5fS5wbmc/YWNjZXNzX3Rva2VuPScgKyBNQVBCT1hfVE9LRU4pXG4pO1xuXG5MLkVkaXRDb250cm9sID0gTC5Db250cm9sLmV4dGVuZCh7XG4gIG9wdGlvbnM6IHtcbiAgICBwb3NpdGlvbjogJ3RvcGxlZnQnLFxuICAgIGNhbGxiYWNrOiBudWxsLFxuICAgIGtpbmQ6ICcnLFxuICAgIGh0bWw6ICcnXG4gIH0sXG5cbiAgb25BZGQ6IGZ1bmN0aW9uIChtYXApIHtcbiAgICB2YXIgY29udGFpbmVyID0gTC5Eb21VdGlsLmNyZWF0ZSgnZGl2JywgJ2xlYWZsZXQtY29udHJvbCBsZWFmbGV0LWJhcicpLFxuICAgICAgICBsaW5rID0gTC5Eb21VdGlsLmNyZWF0ZSgnYScsICcnLCBjb250YWluZXIpO1xuXG4gICAgbGluay5ocmVmID0gJyMnO1xuICAgIGxpbmsudGl0bGUgPSAnQ3JlYXRlIGEgbmV3ICcgKyB0aGlzLm9wdGlvbnMua2luZDtcbiAgICBsaW5rLmlubmVySFRNTCA9IHRoaXMub3B0aW9ucy5odG1sO1xuICAgIEwuRG9tRXZlbnRcbiAgICAgIC5vbihsaW5rLCAnY2xpY2snLCBMLkRvbUV2ZW50LnN0b3ApXG4gICAgICAub24obGluaywgJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB3aW5kb3cuTEFZRVIgPSB0aGlzLm9wdGlvbnMuY2FsbGJhY2sobnVsbCwge1xuICAgICAgICAgIGRyYWdnYWJsZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICB9LCB0aGlzKTtcblxuICAgIHJldHVybiBjb250YWluZXI7XG4gIH1cbn0pO1xuXG5MLk5ld0xpbmVDb250cm9sID0gTC5FZGl0Q29udHJvbC5leHRlbmQoe1xuICBvcHRpb25zOiB7XG4gICAgcG9zaXRpb246ICd0b3BsZWZ0JyxcbiAgICBjYWxsYmFjazogTC5VdGlsLmJpbmQobWFwLmVkaXRUb29scy5zdGFydFBvbHlsaW5lLCBtYXAuZWRpdFRvb2xzKSxcbiAgICBraW5kOiAnbGluZScsXG4gICAgaHRtbDogJ1xcXFwvXFxcXCdcbiAgfVxufSk7XG5cbkwuTmV3UG9seWdvbkNvbnRyb2wgPSBMLkVkaXRDb250cm9sLmV4dGVuZCh7XG4gIG9wdGlvbnM6IHtcbiAgICBwb3NpdGlvbjogJ3RvcGxlZnQnLFxuICAgIGNhbGxiYWNrOiBMLlV0aWwuYmluZChtYXAuZWRpdFRvb2xzLnN0YXJ0UG9seWdvbiwgbWFwLmVkaXRUb29scyksXG4gICAga2luZDogJ3BvbHlnb24nLFxuICAgIGh0bWw6ICfilrAnXG4gIH1cbn0pO1xuXG5MLk5ld01hcmtlckNvbnRyb2wgPSBMLkVkaXRDb250cm9sLmV4dGVuZCh7XG4gIG9wdGlvbnM6IHtcbiAgICBwb3NpdGlvbjogJ3RvcGxlZnQnLFxuICAgIGNhbGxiYWNrOiBMLlV0aWwuYmluZChtYXAuZWRpdFRvb2xzLnN0YXJ0TWFya2VyLCBtYXAuZWRpdFRvb2xzKSxcbiAgICBraW5kOiAnbWFya2VyJyxcbiAgICBodG1sOiAn8J+WiCdcbiAgfVxufSk7XG5cbltcbiAgbmV3IEwuTmV3TWFya2VyQ29udHJvbCgpLCBuZXcgTC5OZXdMaW5lQ29udHJvbCgpLCBuZXcgTC5OZXdQb2x5Z29uQ29udHJvbCgpXG5dLmZvckVhY2gobWFwLmFkZENvbnRyb2wsIG1hcCk7XG4iLCJyZXF1aXJlKCdsZWFmbGV0LWVkaXRhYmxlJyk7XG5yZXF1aXJlKCdsZWFmbGV0LXBhdGgtZHJhZycpO1xucmVxdWlyZSgnLi9zcmMvTGVhZmxldC5FZGl0YWJsZS5EcmFnJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gTC5FZGl0YWJsZTtcbiIsIkwuRWRpdGFibGUgPSBMLkNsYXNzLmV4dGVuZCh7XG5cbiAgICBpbmNsdWRlczogW0wuTWl4aW4uRXZlbnRzXSxcblxuICAgIHN0YXRpY3M6IHtcbiAgICAgICAgRk9SV0FSRDogMSxcbiAgICAgICAgQkFDS1dBUkQ6IC0xXG4gICAgfSxcblxuICAgIG9wdGlvbnM6IHtcbiAgICAgICAgekluZGV4OiAxMDAwLFxuICAgICAgICBwb2x5Z29uQ2xhc3M6IEwuUG9seWdvbixcbiAgICAgICAgcG9seWxpbmVDbGFzczogTC5Qb2x5bGluZSxcbiAgICAgICAgbWFya2VyQ2xhc3M6IEwuTWFya2VyLFxuICAgICAgICBkcmF3aW5nQ1NTQ2xhc3M6ICdsZWFmbGV0LWVkaXRhYmxlLWRyYXdpbmcnXG4gICAgfSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChtYXAsIG9wdGlvbnMpIHtcbiAgICAgICAgTC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9sYXN0WkluZGV4ID0gdGhpcy5vcHRpb25zLnpJbmRleDtcbiAgICAgICAgdGhpcy5tYXAgPSBtYXA7XG4gICAgICAgIHRoaXMuZWRpdExheWVyID0gdGhpcy5jcmVhdGVFZGl0TGF5ZXIoKTtcbiAgICAgICAgdGhpcy5mZWF0dXJlc0xheWVyID0gdGhpcy5jcmVhdGVGZWF0dXJlc0xheWVyKCk7XG4gICAgICAgIHRoaXMubmV3Q2xpY2tIYW5kbGVyID0gdGhpcy5jcmVhdGVOZXdDbGlja0hhbmRsZXIoKTtcbiAgICAgICAgdGhpcy5mb3J3YXJkTGluZUd1aWRlID0gdGhpcy5jcmVhdGVMaW5lR3VpZGUoKTtcbiAgICAgICAgdGhpcy5iYWNrd2FyZExpbmVHdWlkZSA9IHRoaXMuY3JlYXRlTGluZUd1aWRlKCk7XG4gICAgfSxcblxuICAgIGZpcmVBbmRGb3J3YXJkOiBmdW5jdGlvbiAodHlwZSwgZSkge1xuICAgICAgICBlID0gZSB8fMKge307XG4gICAgICAgIGUuZWRpdFRvb2xzID0gdGhpcztcbiAgICAgICAgdGhpcy5maXJlKHR5cGUsIGUpO1xuICAgICAgICB0aGlzLm1hcC5maXJlKHR5cGUsIGUpO1xuICAgIH0sXG5cbiAgICBjcmVhdGVMaW5lR3VpZGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSBMLmV4dGVuZCh7ZGFzaEFycmF5OiAnNSwxMCcsIHdlaWdodDogMX0sIHRoaXMub3B0aW9ucy5saW5lR3VpZGVPcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIEwucG9seWxpbmUoW10sIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICBjcmVhdGVWZXJ0ZXhJY29uOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gTC5Ccm93c2VyLnRvdWNoID8gbmV3IEwuRWRpdGFibGUuVG91Y2hWZXJ0ZXhJY29uKG9wdGlvbnMpIDogbmV3IEwuRWRpdGFibGUuVmVydGV4SWNvbihvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgY3JlYXRlTmV3Q2xpY2tIYW5kbGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBMLm1hcmtlcih0aGlzLm1hcC5nZXRDZW50ZXIoKSwge1xuICAgICAgICAgICAgaWNvbjogdGhpcy5jcmVhdGVWZXJ0ZXhJY29uKHtjbGFzc05hbWU6ICdsZWFmbGV0LWRpdi1pY29uIGxlYWZsZXQtZHJhd2luZy1pY29uJ30pLFxuICAgICAgICAgICAgb3BhY2l0eTogMCxcbiAgICAgICAgICAgIHpJbmRleE9mZnNldDogdGhpcy5fbGFzdFpJbmRleFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgY3JlYXRlRWRpdExheWVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZWRpdExheWVyIHx8wqBuZXcgTC5MYXllckdyb3VwKCkuYWRkVG8odGhpcy5tYXApO1xuICAgIH0sXG5cbiAgICBjcmVhdGVGZWF0dXJlc0xheWVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZmVhdHVyZXNMYXllciB8fMKgbmV3IEwuTGF5ZXJHcm91cCgpLmFkZFRvKHRoaXMubWFwKTtcbiAgICB9LFxuXG4gICAgbW92ZUZvcndhcmRMaW5lR3VpZGU6IGZ1bmN0aW9uIChsYXRsbmcpIHtcbiAgICAgICAgaWYgKHRoaXMuZm9yd2FyZExpbmVHdWlkZS5fbGF0bG5ncy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMuZm9yd2FyZExpbmVHdWlkZS5fbGF0bG5nc1sxXSA9IGxhdGxuZztcbiAgICAgICAgICAgIHRoaXMuZm9yd2FyZExpbmVHdWlkZS5yZWRyYXcoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBtb3ZlQmFja3dhcmRMaW5lR3VpZGU6IGZ1bmN0aW9uIChsYXRsbmcpIHtcbiAgICAgICAgaWYgKHRoaXMuYmFja3dhcmRMaW5lR3VpZGUuX2xhdGxuZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLmJhY2t3YXJkTGluZUd1aWRlLl9sYXRsbmdzWzFdID0gbGF0bG5nO1xuICAgICAgICAgICAgdGhpcy5iYWNrd2FyZExpbmVHdWlkZS5yZWRyYXcoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhbmNob3JGb3J3YXJkTGluZUd1aWRlOiBmdW5jdGlvbiAobGF0bG5nKSB7XG4gICAgICAgIHRoaXMuZm9yd2FyZExpbmVHdWlkZS5fbGF0bG5nc1swXSA9IGxhdGxuZztcbiAgICAgICAgdGhpcy5mb3J3YXJkTGluZUd1aWRlLnJlZHJhdygpO1xuICAgIH0sXG5cbiAgICBhbmNob3JCYWNrd2FyZExpbmVHdWlkZTogZnVuY3Rpb24gKGxhdGxuZykge1xuICAgICAgICB0aGlzLmJhY2t3YXJkTGluZUd1aWRlLl9sYXRsbmdzWzBdID0gbGF0bG5nO1xuICAgICAgICB0aGlzLmJhY2t3YXJkTGluZUd1aWRlLnJlZHJhdygpO1xuICAgIH0sXG5cbiAgICBhdHRhY2hGb3J3YXJkTGluZUd1aWRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZWRpdExheWVyLmFkZExheWVyKHRoaXMuZm9yd2FyZExpbmVHdWlkZSk7XG4gICAgfSxcblxuICAgIGF0dGFjaEJhY2t3YXJkTGluZUd1aWRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZWRpdExheWVyLmFkZExheWVyKHRoaXMuYmFja3dhcmRMaW5lR3VpZGUpO1xuICAgIH0sXG5cbiAgICBkZXRhY2hGb3J3YXJkTGluZUd1aWRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZm9yd2FyZExpbmVHdWlkZS5fbGF0bG5ncyA9IFtdO1xuICAgICAgICB0aGlzLmVkaXRMYXllci5yZW1vdmVMYXllcih0aGlzLmZvcndhcmRMaW5lR3VpZGUpO1xuICAgIH0sXG5cbiAgICBkZXRhY2hCYWNrd2FyZExpbmVHdWlkZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmJhY2t3YXJkTGluZUd1aWRlLl9sYXRsbmdzID0gW107XG4gICAgICAgIHRoaXMuZWRpdExheWVyLnJlbW92ZUxheWVyKHRoaXMuYmFja3dhcmRMaW5lR3VpZGUpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVOZXdDbGlja0hhbmRsZXJaSW5kZXg6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fbGFzdFpJbmRleCArPSAyO1xuICAgICAgICB0aGlzLm5ld0NsaWNrSGFuZGxlci5zZXRaSW5kZXhPZmZzZXQodGhpcy5fbGFzdFpJbmRleCk7XG4gICAgfSxcblxuICAgIHJlZ2lzdGVyRm9yRHJhd2luZzogZnVuY3Rpb24gKGVkaXRvcikge1xuICAgICAgICB0aGlzLm1hcC5vbignbW91c2Vtb3ZlIHRvdWNobW92ZScsIGVkaXRvci5vbk1vdXNlTW92ZSwgZWRpdG9yKTtcbiAgICAgICAgaWYgKHRoaXMuX2RyYXdpbmdFZGl0b3IpIHRoaXMudW5yZWdpc3RlckZvckRyYXdpbmcodGhpcy5fZHJhd2luZ0VkaXRvcik7XG4gICAgICAgIHRoaXMuX2RyYXdpbmdFZGl0b3IgPSBlZGl0b3I7XG4gICAgICAgIHRoaXMuZWRpdExheWVyLmFkZExheWVyKHRoaXMubmV3Q2xpY2tIYW5kbGVyKTtcbiAgICAgICAgdGhpcy5uZXdDbGlja0hhbmRsZXIub24oJ2NsaWNrJywgZWRpdG9yLm9uTmV3Q2xpY2tIYW5kbGVyQ2xpY2tlZCwgZWRpdG9yKTtcbiAgICAgICAgaWYgKEwuQnJvd3Nlci50b3VjaCkgdGhpcy5tYXAub24oJ2NsaWNrJywgZWRpdG9yLm9uVG91Y2gsIGVkaXRvcik7XG4gICAgICAgIEwuRG9tVXRpbC5hZGRDbGFzcyh0aGlzLm1hcC5fY29udGFpbmVyLCB0aGlzLm9wdGlvbnMuZHJhd2luZ0NTU0NsYXNzKTtcbiAgICAgICAgdGhpcy51cGRhdGVOZXdDbGlja0hhbmRsZXJaSW5kZXgoKTtcbiAgICB9LFxuXG4gICAgdW5yZWdpc3RlckZvckRyYXdpbmc6IGZ1bmN0aW9uIChlZGl0b3IpIHtcbiAgICAgICAgZWRpdG9yID0gZWRpdG9yIHx8IHRoaXMuX2RyYXdpbmdFZGl0b3I7XG4gICAgICAgIHRoaXMuZWRpdExheWVyLnJlbW92ZUxheWVyKHRoaXMubmV3Q2xpY2tIYW5kbGVyKTtcbiAgICAgICAgaWYgKCFlZGl0b3IpIHJldHVybjtcbiAgICAgICAgdGhpcy5tYXAub2ZmKCdtb3VzZW1vdmUgdG91Y2htb3ZlJywgZWRpdG9yLm9uTW91c2VNb3ZlLCBlZGl0b3IpO1xuICAgICAgICB0aGlzLm5ld0NsaWNrSGFuZGxlci5vZmYoJ2NsaWNrJywgZWRpdG9yLm9uTmV3Q2xpY2tIYW5kbGVyQ2xpY2tlZCwgZWRpdG9yKTtcbiAgICAgICAgaWYgKEwuQnJvd3Nlci50b3VjaCkgdGhpcy5tYXAub2ZmKCdjbGljaycsIGVkaXRvci5vblRvdWNoLCBlZGl0b3IpO1xuICAgICAgICBpZiAoZWRpdG9yICE9PSB0aGlzLl9kcmF3aW5nRWRpdG9yKSByZXR1cm47XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9kcmF3aW5nRWRpdG9yO1xuICAgICAgICBpZiAoZWRpdG9yLmRyYXdpbmcpIGVkaXRvci5jYW5jZWxEcmF3aW5nKCk7XG4gICAgICAgIEwuRG9tVXRpbC5yZW1vdmVDbGFzcyh0aGlzLm1hcC5fY29udGFpbmVyLCB0aGlzLm9wdGlvbnMuZHJhd2luZ0NTU0NsYXNzKTtcbiAgICB9LFxuXG4gICAgc3RvcERyYXdpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy51bnJlZ2lzdGVyRm9yRHJhd2luZygpO1xuICAgIH0sXG5cbiAgICBjb25uZWN0Q3JlYXRlZFRvTWFwOiBmdW5jdGlvbiAobGF5ZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmVhdHVyZXNMYXllci5hZGRMYXllcihsYXllcik7XG4gICAgfSxcblxuICAgIHN0YXJ0UG9seWxpbmU6IGZ1bmN0aW9uIChsYXRsbmcpIHtcbiAgICAgICAgdmFyIGxpbmUgPSB0aGlzLmNyZWF0ZVBvbHlsaW5lKFtdKTtcbiAgICAgICAgdGhpcy5jb25uZWN0Q3JlYXRlZFRvTWFwKGxpbmUpO1xuICAgICAgICB2YXIgZWRpdG9yID0gbGluZS5lbmFibGVFZGl0KCk7XG4gICAgICAgIGVkaXRvci5zdGFydERyYXdpbmdGb3J3YXJkKCk7XG4gICAgICAgIGlmIChsYXRsbmcpIGVkaXRvci5uZXdQb2ludEZvcndhcmQobGF0bG5nKTtcbiAgICAgICAgcmV0dXJuIGxpbmU7XG4gICAgfSxcblxuICAgIHN0YXJ0UG9seWdvbjogZnVuY3Rpb24gKGxhdGxuZykge1xuICAgICAgICB2YXIgcG9seWdvbiA9IHRoaXMuY3JlYXRlUG9seWdvbihbXSk7XG4gICAgICAgIHRoaXMuY29ubmVjdENyZWF0ZWRUb01hcChwb2x5Z29uKTtcbiAgICAgICAgdmFyIGVkaXRvciA9IHBvbHlnb24uZW5hYmxlRWRpdCgpO1xuICAgICAgICBlZGl0b3Iuc3RhcnREcmF3aW5nRm9yd2FyZCgpO1xuICAgICAgICBpZiAobGF0bG5nKSBlZGl0b3IubmV3UG9pbnRGb3J3YXJkKGxhdGxuZyk7XG4gICAgICAgIHJldHVybiBwb2x5Z29uO1xuICAgIH0sXG5cbiAgICBzdGFydE1hcmtlcjogZnVuY3Rpb24gKGxhdGxuZykge1xuICAgICAgICBsYXRsbmcgPSBsYXRsbmcgfHzCoHRoaXMubWFwLmdldENlbnRlcigpO1xuICAgICAgICB2YXIgbWFya2VyID0gdGhpcy5jcmVhdGVNYXJrZXIobGF0bG5nKTtcbiAgICAgICAgdGhpcy5jb25uZWN0Q3JlYXRlZFRvTWFwKG1hcmtlcik7XG4gICAgICAgIHZhciBlZGl0b3IgPSBtYXJrZXIuZW5hYmxlRWRpdCgpO1xuICAgICAgICBlZGl0b3Iuc3RhcnREcmF3aW5nKCk7XG4gICAgICAgIHJldHVybiBtYXJrZXI7XG4gICAgfSxcblxuICAgIHN0YXJ0SG9sZTogZnVuY3Rpb24gKGVkaXRvciwgbGF0bG5nKSB7XG4gICAgICAgIGVkaXRvci5uZXdIb2xlKGxhdGxuZyk7XG4gICAgfSxcblxuICAgIGV4dGVuZE11bHRpUG9seWdvbjogZnVuY3Rpb24gKG11bHRpKSB7XG4gICAgICAgIHZhciBwb2x5Z29uID0gdGhpcy5jcmVhdGVQb2x5Z29uKFtdKTtcbiAgICAgICAgbXVsdGkuYWRkTGF5ZXIocG9seWdvbik7XG4gICAgICAgIHBvbHlnb24ubXVsdGkgPSBtdWx0aTtcbiAgICAgICAgdmFyIGVkaXRvciA9IHBvbHlnb24uZW5hYmxlRWRpdCgpO1xuICAgICAgICBlZGl0b3Iuc3RhcnREcmF3aW5nRm9yd2FyZCgpO1xuICAgICAgICByZXR1cm4gcG9seWdvbjtcbiAgICB9LFxuXG4gICAgY3JlYXRlUG9seWxpbmU6IGZ1bmN0aW9uIChsYXRsbmdzKSB7XG4gICAgICAgIHZhciBsaW5lID0gbmV3IHRoaXMub3B0aW9ucy5wb2x5bGluZUNsYXNzKGxhdGxuZ3MsIHtlZGl0T3B0aW9uczoge2VkaXRUb29sczogdGhpc319KTtcbiAgICAgICAgdGhpcy5maXJlQW5kRm9yd2FyZCgnZWRpdGFibGU6Y3JlYXRlZCcsIHtsYXllcjogbGluZX0pO1xuICAgICAgICByZXR1cm4gbGluZTtcbiAgICB9LFxuXG4gICAgY3JlYXRlUG9seWdvbjogZnVuY3Rpb24gKGxhdGxuZ3MpIHtcbiAgICAgICAgdmFyIHBvbHlnb24gPSBuZXcgdGhpcy5vcHRpb25zLnBvbHlnb25DbGFzcyhsYXRsbmdzLCB7ZWRpdE9wdGlvbnM6IHtlZGl0VG9vbHM6IHRoaXN9fSk7XG4gICAgICAgIHRoaXMuZmlyZUFuZEZvcndhcmQoJ2VkaXRhYmxlOmNyZWF0ZWQnLCB7bGF5ZXI6IHBvbHlnb259KTtcbiAgICAgICAgcmV0dXJuIHBvbHlnb247XG4gICAgfSxcblxuICAgIGNyZWF0ZU1hcmtlcjogZnVuY3Rpb24gKGxhdGxuZykge1xuICAgICAgICB2YXIgbWFya2VyID0gbmV3IHRoaXMub3B0aW9ucy5tYXJrZXJDbGFzcyhsYXRsbmcsIHtlZGl0T3B0aW9uczoge2VkaXRUb29sczogdGhpc319KTtcbiAgICAgICAgdGhpcy5maXJlQW5kRm9yd2FyZCgnZWRpdGFibGU6Y3JlYXRlZCcsIHtsYXllcjogbWFya2VyfSk7XG4gICAgICAgIHJldHVybiBtYXJrZXI7XG4gICAgfVxuXG59KTtcblxuTC5NYXAuYWRkSW5pdEhvb2soZnVuY3Rpb24gKCkge1xuXG4gICAgdGhpcy53aGVuUmVhZHkoZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmVkaXRhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmVkaXRUb29scyA9IG5ldyBMLkVkaXRhYmxlKHRoaXMsIHRoaXMub3B0aW9ucy5lZGl0T3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9KTtcblxufSk7XG5cbkwuRWRpdGFibGUuVmVydGV4SWNvbiA9IEwuRGl2SWNvbi5leHRlbmQoe1xuXG4gICAgb3B0aW9uczoge1xuICAgICAgICBpY29uU2l6ZTogbmV3IEwuUG9pbnQoOCwgOClcbiAgICB9XG5cbn0pO1xuXG5MLkVkaXRhYmxlLlRvdWNoVmVydGV4SWNvbiA9IEwuRWRpdGFibGUuVmVydGV4SWNvbi5leHRlbmQoe1xuXG4gICAgb3B0aW9uczoge1xuICAgICAgICBpY29uU2l6ZTogbmV3IEwuUG9pbnQoMjAsIDIwKVxuICAgIH1cblxufSk7XG5cblxuTC5FZGl0YWJsZS5WZXJ0ZXhNYXJrZXIgPSBMLk1hcmtlci5leHRlbmQoe1xuXG4gICAgb3B0aW9uczoge1xuICAgICAgICBkcmFnZ2FibGU6IHRydWUsXG4gICAgICAgIGNsYXNzTmFtZTogJ2xlYWZsZXQtZGl2LWljb24gbGVhZmxldC12ZXJ0ZXgtaWNvbidcbiAgICB9LFxuXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKGxhdGxuZywgbGF0bG5ncywgZWRpdG9yLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMubGF0bG5nID0gbGF0bG5nO1xuICAgICAgICB0aGlzLmxhdGxuZ3MgPSBsYXRsbmdzO1xuICAgICAgICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcbiAgICAgICAgTC5NYXJrZXIucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCh0aGlzLCBsYXRsbmcsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLm9wdGlvbnMuaWNvbiA9IHRoaXMuZWRpdG9yLnRvb2xzLmNyZWF0ZVZlcnRleEljb24oe2NsYXNzTmFtZTogdGhpcy5vcHRpb25zLmNsYXNzTmFtZX0pO1xuICAgICAgICB0aGlzLmxhdGxuZy5fX3ZlcnRleCA9IHRoaXM7XG4gICAgICAgIHRoaXMuZWRpdG9yLmVkaXRMYXllci5hZGRMYXllcih0aGlzKTtcbiAgICAgICAgdGhpcy5zZXRaSW5kZXhPZmZzZXQoZWRpdG9yLnRvb2xzLl9sYXN0WkluZGV4ICsgMSk7XG4gICAgfSxcblxuICAgIG9uQWRkOiBmdW5jdGlvbiAobWFwKSB7XG4gICAgICAgIEwuTWFya2VyLnByb3RvdHlwZS5vbkFkZC5jYWxsKHRoaXMsIG1hcCk7XG4gICAgICAgIHRoaXMub24oJ2RyYWcnLCB0aGlzLm9uRHJhZyk7XG4gICAgICAgIHRoaXMub24oJ2RyYWdzdGFydCcsIHRoaXMub25EcmFnU3RhcnQpO1xuICAgICAgICB0aGlzLm9uKCdkcmFnZW5kJywgdGhpcy5vbkRyYWdFbmQpO1xuICAgICAgICB0aGlzLm9uKCdjbGljaycsIHRoaXMub25DbGljayk7XG4gICAgICAgIHRoaXMub24oJ2NvbnRleHRtZW51JywgdGhpcy5vbkNvbnRleHRNZW51KTtcbiAgICAgICAgdGhpcy5vbignbW91c2Vkb3duIHRvdWNoc3RhcnQnLCB0aGlzLm9uTW91c2VEb3duKTtcbiAgICAgICAgdGhpcy5hZGRNaWRkbGVNYXJrZXJzKCk7XG4gICAgfSxcblxuICAgIG9uUmVtb3ZlOiBmdW5jdGlvbiAobWFwKSB7XG4gICAgICAgIGlmICh0aGlzLm1pZGRsZU1hcmtlcikgdGhpcy5taWRkbGVNYXJrZXIuZGVsZXRlKCk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmxhdGxuZy5fX3ZlcnRleDtcbiAgICAgICAgdGhpcy5vZmYoJ2RyYWcnLCB0aGlzLm9uRHJhZyk7XG4gICAgICAgIHRoaXMub2ZmKCdkcmFnc3RhcnQnLCB0aGlzLm9uRHJhZ1N0YXJ0KTtcbiAgICAgICAgdGhpcy5vZmYoJ2RyYWdlbmQnLCB0aGlzLm9uRHJhZ0VuZCk7XG4gICAgICAgIHRoaXMub2ZmKCdjbGljaycsIHRoaXMub25DbGljayk7XG4gICAgICAgIHRoaXMub2ZmKCdjb250ZXh0bWVudScsIHRoaXMub25Db250ZXh0TWVudSk7XG4gICAgICAgIHRoaXMub2ZmKCdtb3VzZWRvd24gdG91Y2hzdGFydCcsIHRoaXMub25Nb3VzZURvd24pO1xuICAgICAgICBMLk1hcmtlci5wcm90b3R5cGUub25SZW1vdmUuY2FsbCh0aGlzLCBtYXApO1xuICAgIH0sXG5cbiAgICBvbkRyYWc6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGUudmVydGV4ID0gdGhpcztcbiAgICAgICAgdGhpcy5lZGl0b3Iub25WZXJ0ZXhNYXJrZXJEcmFnKGUpO1xuICAgICAgICB2YXIgaWNvblBvcyA9IEwuRG9tVXRpbC5nZXRQb3NpdGlvbih0aGlzLl9pY29uKSxcbiAgICAgICAgICAgIGxhdGxuZyA9IHRoaXMuX21hcC5sYXllclBvaW50VG9MYXRMbmcoaWNvblBvcyk7XG4gICAgICAgIHRoaXMubGF0bG5nLmxhdCA9IGxhdGxuZy5sYXQ7XG4gICAgICAgIHRoaXMubGF0bG5nLmxuZyA9IGxhdGxuZy5sbmc7XG4gICAgICAgIHRoaXMuZWRpdG9yLnJlZnJlc2goKTtcbiAgICAgICAgaWYgKHRoaXMubWlkZGxlTWFya2VyKSB7XG4gICAgICAgICAgICB0aGlzLm1pZGRsZU1hcmtlci51cGRhdGVMYXRMbmcoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbmV4dCA9IHRoaXMuZ2V0TmV4dCgpO1xuICAgICAgICBpZiAobmV4dCAmJiBuZXh0Lm1pZGRsZU1hcmtlcikge1xuICAgICAgICAgICAgbmV4dC5taWRkbGVNYXJrZXIudXBkYXRlTGF0TG5nKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25EcmFnU3RhcnQ6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGUudmVydGV4ID0gdGhpcztcbiAgICAgICAgdGhpcy5lZGl0b3Iub25WZXJ0ZXhNYXJrZXJEcmFnU3RhcnQoZSk7XG4gICAgfSxcblxuICAgIG9uRHJhZ0VuZDogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgZS52ZXJ0ZXggPSB0aGlzO1xuICAgICAgICB0aGlzLmVkaXRvci5vblZlcnRleE1hcmtlckRyYWdFbmQoZSk7XG4gICAgfSxcblxuICAgIG9uQ2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGUudmVydGV4ID0gdGhpcztcbiAgICAgICAgdGhpcy5lZGl0b3Iub25WZXJ0ZXhNYXJrZXJDbGljayhlKTtcbiAgICB9LFxuXG4gICAgb25Db250ZXh0TWVudTogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgZS52ZXJ0ZXggPSB0aGlzO1xuICAgICAgICB0aGlzLmVkaXRvci5vblZlcnRleE1hcmtlckNvbnRleHRNZW51KGUpO1xuICAgIH0sXG5cbiAgICBvbk1vdXNlRG93bjogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgZS52ZXJ0ZXggPSB0aGlzO1xuICAgICAgICB0aGlzLmVkaXRvci5vblZlcnRleE1hcmtlck1vdXNlRG93bihlKTtcbiAgICB9LFxuXG4gICAgZGVsZXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBuZXh0ID0gdGhpcy5nZXROZXh0KCk7ICAvLyBDb21wdXRlIGJlZm9yZSBjaGFuZ2luZyBsYXRsbmdcbiAgICAgICAgdGhpcy5sYXRsbmdzLnNwbGljZSh0aGlzLmxhdGxuZ3MuaW5kZXhPZih0aGlzLmxhdGxuZyksIDEpO1xuICAgICAgICB0aGlzLmVkaXRvci5lZGl0TGF5ZXIucmVtb3ZlTGF5ZXIodGhpcyk7XG4gICAgICAgIHRoaXMuZWRpdG9yLm9uVmVydGV4RGVsZXRlZCh7bGF0bG5nOiB0aGlzLmxhdGxuZywgdmVydGV4OiB0aGlzfSk7XG4gICAgICAgIGlmIChuZXh0KSBuZXh0LnJlc2V0TWlkZGxlTWFya2VyKCk7XG4gICAgfSxcblxuICAgIGdldEluZGV4OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxhdGxuZ3MuaW5kZXhPZih0aGlzLmxhdGxuZyk7XG4gICAgfSxcblxuICAgIGdldExhc3RJbmRleDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sYXRsbmdzLmxlbmd0aCAtIDE7XG4gICAgfSxcblxuICAgIGdldFByZXZpb3VzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmxhdGxuZ3MubGVuZ3RoIDwgMikgcmV0dXJuO1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmdldEluZGV4KCksXG4gICAgICAgICAgICBwcmV2aW91c0luZGV4ID0gaW5kZXggLSAxO1xuICAgICAgICBpZiAoaW5kZXggPT09IDAgJiYgdGhpcy5lZGl0b3IuQ0xPU0VEKSBwcmV2aW91c0luZGV4ID0gdGhpcy5nZXRMYXN0SW5kZXgoKTtcbiAgICAgICAgdmFyIHByZXZpb3VzID0gdGhpcy5sYXRsbmdzW3ByZXZpb3VzSW5kZXhdO1xuICAgICAgICBpZiAocHJldmlvdXMpIHJldHVybiBwcmV2aW91cy5fX3ZlcnRleDtcbiAgICB9LFxuXG4gICAgZ2V0TmV4dDogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5sYXRsbmdzLmxlbmd0aCA8IDIpIHJldHVybjtcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5nZXRJbmRleCgpLFxuICAgICAgICAgICAgbmV4dEluZGV4ID0gaW5kZXggKyAxO1xuICAgICAgICBpZiAoaW5kZXggPT09IHRoaXMuZ2V0TGFzdEluZGV4KCkgJiYgdGhpcy5lZGl0b3IuQ0xPU0VEKSBuZXh0SW5kZXggPSAwO1xuICAgICAgICB2YXIgbmV4dCA9IHRoaXMubGF0bG5nc1tuZXh0SW5kZXhdO1xuICAgICAgICBpZiAobmV4dCkgcmV0dXJuIG5leHQuX192ZXJ0ZXg7XG4gICAgfSxcblxuICAgIGFkZE1pZGRsZU1hcmtlcjogZnVuY3Rpb24gKHByZXZpb3VzKSB7XG4gICAgICAgIHByZXZpb3VzID0gcHJldmlvdXMgfHzCoHRoaXMuZ2V0UHJldmlvdXMoKTtcbiAgICAgICAgaWYgKHByZXZpb3VzICYmICF0aGlzLm1pZGRsZU1hcmtlcikgdGhpcy5taWRkbGVNYXJrZXIgPSB0aGlzLmVkaXRvci5hZGRNaWRkbGVNYXJrZXIocHJldmlvdXMsIHRoaXMsIHRoaXMubGF0bG5ncywgdGhpcy5lZGl0b3IpO1xuICAgIH0sXG5cbiAgICBhZGRNaWRkbGVNYXJrZXJzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvci50b29scy5vcHRpb25zLnNraXBNaWRkbGVNYXJrZXJzKSByZXR1cm47XG4gICAgICAgIHZhciBwcmV2aW91cyA9IHRoaXMuZ2V0UHJldmlvdXMoKTtcbiAgICAgICAgaWYgKHByZXZpb3VzKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1pZGRsZU1hcmtlcihwcmV2aW91cyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5leHQgPSB0aGlzLmdldE5leHQoKTtcbiAgICAgICAgaWYgKG5leHQpIHtcbiAgICAgICAgICAgIG5leHQucmVzZXRNaWRkbGVNYXJrZXIoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZXNldE1pZGRsZU1hcmtlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5taWRkbGVNYXJrZXIpIHRoaXMubWlkZGxlTWFya2VyLmRlbGV0ZSgpO1xuICAgICAgICB0aGlzLmFkZE1pZGRsZU1hcmtlcigpO1xuICAgIH0sXG5cbiAgICBfaW5pdEludGVyYWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIEwuTWFya2VyLnByb3RvdHlwZS5faW5pdEludGVyYWN0aW9uLmNhbGwodGhpcyk7XG4gICAgICAgIEwuRG9tRXZlbnQub24odGhpcy5faWNvbiwgJ3RvdWNoc3RhcnQnLCBmdW5jdGlvbiAoZSkge3RoaXMuX2ZpcmVNb3VzZUV2ZW50KGUpO30sIHRoaXMpO1xuICAgIH1cblxufSk7XG5cbkwuRWRpdGFibGUubWVyZ2VPcHRpb25zKHtcbiAgICB2ZXJ0ZXhNYXJrZXJDbGFzczogTC5FZGl0YWJsZS5WZXJ0ZXhNYXJrZXJcbn0pO1xuXG5MLkVkaXRhYmxlLk1pZGRsZU1hcmtlciA9IEwuTWFya2VyLmV4dGVuZCh7XG5cbiAgICBvcHRpb25zOiB7XG4gICAgICAgIG9wYWNpdHk6IDAuNSxcbiAgICAgICAgY2xhc3NOYW1lOiAnbGVhZmxldC1kaXYtaWNvbiBsZWFmbGV0LW1pZGRsZS1pY29uJ1xuICAgIH0sXG5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAobGVmdCwgcmlnaHQsIGxhdGxuZ3MsIGVkaXRvciwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmxlZnQgPSBsZWZ0O1xuICAgICAgICB0aGlzLnJpZ2h0ID0gcmlnaHQ7XG4gICAgICAgIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xuICAgICAgICB0aGlzLmxhdGxuZ3MgPSBsYXRsbmdzO1xuICAgICAgICBMLk1hcmtlci5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKHRoaXMsIHRoaXMuY29tcHV0ZUxhdExuZygpLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fb3BhY2l0eSA9IHRoaXMub3B0aW9ucy5vcGFjaXR5O1xuICAgICAgICB0aGlzLm9wdGlvbnMuaWNvbiA9IHRoaXMuZWRpdG9yLnRvb2xzLmNyZWF0ZVZlcnRleEljb24oe2NsYXNzTmFtZTogdGhpcy5vcHRpb25zLmNsYXNzTmFtZX0pO1xuICAgICAgICB0aGlzLmVkaXRvci5lZGl0TGF5ZXIuYWRkTGF5ZXIodGhpcyk7XG4gICAgICAgIHRoaXMuc2V0VmlzaWJpbGl0eSgpO1xuICAgIH0sXG5cbiAgICBzZXRWaXNpYmlsaXR5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBsZWZ0UG9pbnQgPSB0aGlzLl9tYXAubGF0TG5nVG9Db250YWluZXJQb2ludCh0aGlzLmxlZnQubGF0bG5nKSxcbiAgICAgICAgICAgIHJpZ2h0UG9pbnQgPSB0aGlzLl9tYXAubGF0TG5nVG9Db250YWluZXJQb2ludCh0aGlzLnJpZ2h0LmxhdGxuZyksXG4gICAgICAgICAgICBzaXplID0gTC5wb2ludCh0aGlzLm9wdGlvbnMuaWNvbi5vcHRpb25zLmljb25TaXplKTtcbiAgICAgICAgaWYgKGxlZnRQb2ludC5kaXN0YW5jZVRvKHJpZ2h0UG9pbnQpIDwgc2l6ZS54ICogMykge1xuICAgICAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNob3coKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzaG93OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuc2V0T3BhY2l0eSh0aGlzLl9vcGFjaXR5KTtcbiAgICB9LFxuXG4gICAgaGlkZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnNldE9wYWNpdHkoMCk7XG4gICAgfSxcblxuICAgIHVwZGF0ZUxhdExuZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnNldExhdExuZyh0aGlzLmNvbXB1dGVMYXRMbmcoKSk7XG4gICAgICAgIHRoaXMuc2V0VmlzaWJpbGl0eSgpO1xuICAgIH0sXG5cbiAgICBjb21wdXRlTGF0TG5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBsZWZ0UG9pbnQgPSB0aGlzLmVkaXRvci5tYXAubGF0TG5nVG9Db250YWluZXJQb2ludCh0aGlzLmxlZnQubGF0bG5nKSxcbiAgICAgICAgICAgIHJpZ2h0UG9pbnQgPSB0aGlzLmVkaXRvci5tYXAubGF0TG5nVG9Db250YWluZXJQb2ludCh0aGlzLnJpZ2h0LmxhdGxuZyksXG4gICAgICAgICAgICB5ID0gKGxlZnRQb2ludC55ICsgcmlnaHRQb2ludC55KSAvIDIsXG4gICAgICAgICAgICB4ID0gKGxlZnRQb2ludC54ICsgcmlnaHRQb2ludC54KSAvIDI7XG4gICAgICAgIHJldHVybiB0aGlzLmVkaXRvci5tYXAuY29udGFpbmVyUG9pbnRUb0xhdExuZyhbeCwgeV0pO1xuICAgIH0sXG5cbiAgICBvbkFkZDogZnVuY3Rpb24gKG1hcCkge1xuICAgICAgICBMLk1hcmtlci5wcm90b3R5cGUub25BZGQuY2FsbCh0aGlzLCBtYXApO1xuICAgICAgICB0aGlzLm9uKCdtb3VzZWRvd24gdG91Y2hzdGFydCcsIHRoaXMub25Nb3VzZURvd24pO1xuICAgICAgICBtYXAub24oJ3pvb21lbmQnLCB0aGlzLnNldFZpc2liaWxpdHksIHRoaXMpO1xuICAgIH0sXG5cbiAgICBvblJlbW92ZTogZnVuY3Rpb24gKG1hcCkge1xuICAgICAgICBkZWxldGUgdGhpcy5yaWdodC5taWRkbGVNYXJrZXI7XG4gICAgICAgIHRoaXMub2ZmKCdtb3VzZWRvd24gdG91Y2hzdGFydCcsIHRoaXMub25Nb3VzZURvd24pO1xuICAgICAgICBtYXAub2ZmKCd6b29tZW5kJywgdGhpcy5zZXRWaXNpYmlsaXR5LCB0aGlzKTtcbiAgICAgICAgTC5NYXJrZXIucHJvdG90eXBlLm9uUmVtb3ZlLmNhbGwodGhpcywgbWFwKTtcbiAgICB9LFxuXG4gICAgb25Nb3VzZURvd246IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yLm9uTWlkZGxlTWFya2VyTW91c2VEb3duKGUsIHRoaXMpO1xuICAgICAgICB0aGlzLmxhdGxuZ3Muc3BsaWNlKHRoaXMuaW5kZXgoKSwgMCwgZS5sYXRsbmcpO1xuICAgICAgICB0aGlzLmVkaXRvci5yZWZyZXNoKCk7XG4gICAgICAgIHZhciBtYXJrZXIgPSB0aGlzLmVkaXRvci5hZGRWZXJ0ZXhNYXJrZXIoZS5sYXRsbmcsIHRoaXMubGF0bG5ncyk7XG4gICAgICAgIG1hcmtlci5kcmFnZ2luZy5fZHJhZ2dhYmxlLl9vbkRvd24oZS5vcmlnaW5hbEV2ZW50KTsgIC8vIFRyYW5zZmVyIG9uZ29pbmcgZHJhZ2dpbmcgdG8gcmVhbCBtYXJrZXJcbiAgICAgICAgdGhpcy5kZWxldGUoKTtcbiAgICB9LFxuXG4gICAgZGVsZXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yLmVkaXRMYXllci5yZW1vdmVMYXllcih0aGlzKTtcbiAgICB9LFxuXG4gICAgaW5kZXg6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGF0bG5ncy5pbmRleE9mKHRoaXMucmlnaHQubGF0bG5nKTtcbiAgICB9LFxuXG4gICAgX2luaXRJbnRlcmFjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICBMLk1hcmtlci5wcm90b3R5cGUuX2luaXRJbnRlcmFjdGlvbi5jYWxsKHRoaXMpO1xuICAgICAgICBMLkRvbUV2ZW50Lm9uKHRoaXMuX2ljb24sICd0b3VjaHN0YXJ0JywgZnVuY3Rpb24gKGUpIHt0aGlzLl9maXJlTW91c2VFdmVudChlKTt9LCB0aGlzKTtcbiAgICB9XG5cbn0pO1xuXG5MLkVkaXRhYmxlLm1lcmdlT3B0aW9ucyh7XG4gICAgbWlkZGxlTWFya2VyQ2xhc3M6IEwuRWRpdGFibGUuTWlkZGxlTWFya2VyXG59KTtcblxuTC5FZGl0YWJsZS5CYXNlRWRpdG9yID0gTC5DbGFzcy5leHRlbmQoe1xuXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG1hcCwgZmVhdHVyZSwgb3B0aW9ucykge1xuICAgICAgICBMLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMubWFwID0gbWFwO1xuICAgICAgICB0aGlzLmZlYXR1cmUgPSBmZWF0dXJlO1xuICAgICAgICB0aGlzLmZlYXR1cmUuZWRpdG9yID0gdGhpcztcbiAgICAgICAgdGhpcy5lZGl0TGF5ZXIgPSBuZXcgTC5MYXllckdyb3VwKCk7XG4gICAgICAgIHRoaXMudG9vbHMgPSB0aGlzLm9wdGlvbnMuZWRpdFRvb2xzIHx8IG1hcC5lZGl0VG9vbHM7XG4gICAgfSxcblxuICAgIGVuYWJsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fZW5hYmxlZCkgcmV0dXJuIHRoaXM7XG4gICAgICAgIHRoaXMudG9vbHMuZWRpdExheWVyLmFkZExheWVyKHRoaXMuZWRpdExheWVyKTtcbiAgICAgICAgdGhpcy5vbkVuYWJsZSgpO1xuICAgICAgICB0aGlzLl9lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5mZWF0dXJlLm9uKCdyZW1vdmUnLCB0aGlzLmRpc2FibGUsIHRoaXMpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgZGlzYWJsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmZlYXR1cmUub2ZmKCdyZW1vdmUnLCB0aGlzLmRpc2FibGUsIHRoaXMpO1xuICAgICAgICB0aGlzLmVkaXRMYXllci5jbGVhckxheWVycygpO1xuICAgICAgICB0aGlzLnRvb2xzLmVkaXRMYXllci5yZW1vdmVMYXllcih0aGlzLmVkaXRMYXllcik7XG4gICAgICAgIHRoaXMub25EaXNhYmxlKCk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9lbmFibGVkO1xuICAgICAgICBpZiAodGhpcy5kcmF3aW5nKSB0aGlzLmNhbmNlbERyYXdpbmcoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGZpcmVBbmRGb3J3YXJkOiBmdW5jdGlvbiAodHlwZSwgZSkge1xuICAgICAgICBlID0gZSB8fMKge307XG4gICAgICAgIGUubGF5ZXIgPSB0aGlzLmZlYXR1cmU7XG4gICAgICAgIHRoaXMuZmVhdHVyZS5maXJlKHR5cGUsIGUpO1xuICAgICAgICBpZiAodGhpcy5mZWF0dXJlLm11bHRpKSB0aGlzLmZlYXR1cmUubXVsdGkuZmlyZSh0eXBlLCBlKTtcbiAgICAgICAgdGhpcy50b29scy5maXJlQW5kRm9yd2FyZCh0eXBlLCBlKTtcbiAgICB9LFxuXG4gICAgb25FbmFibGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5maXJlQW5kRm9yd2FyZCgnZWRpdGFibGU6ZW5hYmxlJyk7XG4gICAgfSxcblxuICAgIG9uRGlzYWJsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmZpcmVBbmRGb3J3YXJkKCdlZGl0YWJsZTpkaXNhYmxlJyk7XG4gICAgfSxcblxuICAgIG9uRWRpdGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmZpcmVBbmRGb3J3YXJkKCdlZGl0YWJsZTplZGl0aW5nJyk7XG4gICAgfSxcblxuICAgIG9uU3RhcnREcmF3aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZmlyZUFuZEZvcndhcmQoJ2VkaXRhYmxlOmRyYXdpbmc6c3RhcnQnKTtcbiAgICB9LFxuXG4gICAgb25FbmREcmF3aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZmlyZUFuZEZvcndhcmQoJ2VkaXRhYmxlOmRyYXdpbmc6ZW5kJyk7XG4gICAgfSxcblxuICAgIG9uQ2FuY2VsRHJhd2luZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmZpcmVBbmRGb3J3YXJkKCdlZGl0YWJsZTpkcmF3aW5nOmNhbmNlbCcpO1xuICAgIH0sXG5cbiAgICBvbkNvbW1pdERyYXdpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5maXJlQW5kRm9yd2FyZCgnZWRpdGFibGU6ZHJhd2luZzpjb21taXQnKTtcbiAgICB9LFxuXG4gICAgc3RhcnREcmF3aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghdGhpcy5kcmF3aW5nKSB0aGlzLmRyYXdpbmcgPSBMLkVkaXRhYmxlLkZPUldBUkQ7XG4gICAgICAgIHRoaXMudG9vbHMucmVnaXN0ZXJGb3JEcmF3aW5nKHRoaXMpO1xuICAgICAgICB0aGlzLm9uU3RhcnREcmF3aW5nKCk7XG4gICAgfSxcblxuICAgIGNvbW1pdERyYXdpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5vbkNvbW1pdERyYXdpbmcoKTtcbiAgICAgICAgdGhpcy5lbmREcmF3aW5nKCk7XG4gICAgfSxcblxuICAgIGNhbmNlbERyYXdpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5vbkNhbmNlbERyYXdpbmcoKTtcbiAgICAgICAgdGhpcy5lbmREcmF3aW5nKCk7XG4gICAgfSxcblxuICAgIGVuZERyYXdpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5kcmF3aW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMudG9vbHMudW5yZWdpc3RlckZvckRyYXdpbmcodGhpcyk7XG4gICAgICAgIHRoaXMub25FbmREcmF3aW5nKCk7XG4gICAgfSxcblxuICAgIG9uTW91c2VNb3ZlOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAodGhpcy5kcmF3aW5nKSB7XG4gICAgICAgICAgICB0aGlzLnRvb2xzLm5ld0NsaWNrSGFuZGxlci5zZXRMYXRMbmcoZS5sYXRsbmcpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uVG91Y2g6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHRoaXMub25Nb3VzZU1vdmUoZSk7XG4gICAgICAgIGlmICh0aGlzLmRyYXdpbmcpIHRoaXMudG9vbHMubmV3Q2xpY2tIYW5kbGVyLl9maXJlTW91c2VFdmVudChlKTtcbiAgICB9LFxuXG4gICAgb25OZXdDbGlja0hhbmRsZXJDbGlja2VkOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICB0aGlzLmZpcmVBbmRGb3J3YXJkKCdlZGl0YWJsZTpkcmF3aW5nOmNsaWNrJywgZSk7XG4gICAgfSxcblxuICAgIGlzTmV3Q2xpY2tWYWxpZDogZnVuY3Rpb24gKGxhdGxuZykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbn0pO1xuXG5MLkVkaXRhYmxlLk1hcmtlckVkaXRvciA9IEwuRWRpdGFibGUuQmFzZUVkaXRvci5leHRlbmQoe1xuXG4gICAgZW5hYmxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLl9lbmFibGVkKSByZXR1cm4gdGhpcztcbiAgICAgICAgTC5FZGl0YWJsZS5CYXNlRWRpdG9yLnByb3RvdHlwZS5lbmFibGUuY2FsbCh0aGlzKTtcbiAgICAgICAgdGhpcy5mZWF0dXJlLmRyYWdnaW5nLmVuYWJsZSgpO1xuICAgICAgICB0aGlzLmZlYXR1cmUub24oJ2RyYWdzdGFydCcsIHRoaXMub25FZGl0aW5nLCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGRpc2FibGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgTC5FZGl0YWJsZS5CYXNlRWRpdG9yLnByb3RvdHlwZS5kaXNhYmxlLmNhbGwodGhpcyk7XG4gICAgICAgIHRoaXMuZmVhdHVyZS5kcmFnZ2luZy5kaXNhYmxlKCk7XG4gICAgICAgIHRoaXMuZmVhdHVyZS5vZmYoJ2RyYWdzdGFydCcsIHRoaXMub25FZGl0aW5nLCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIG9uTW91c2VNb3ZlOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAodGhpcy5kcmF3aW5nKSB7XG4gICAgICAgICAgICBMLkVkaXRhYmxlLkJhc2VFZGl0b3IucHJvdG90eXBlLm9uTW91c2VNb3ZlLmNhbGwodGhpcywgZSk7XG4gICAgICAgICAgICB0aGlzLmZlYXR1cmUuc2V0TGF0TG5nKGUubGF0bG5nKTtcbiAgICAgICAgICAgIHRoaXMudG9vbHMubmV3Q2xpY2tIYW5kbGVyLl9icmluZ1RvRnJvbnQoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvbk5ld0NsaWNrSGFuZGxlckNsaWNrZWQ6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmICghdGhpcy5pc05ld0NsaWNrVmFsaWQoZS5sYXRsbmcpKSByZXR1cm47XG4gICAgICAgIC8vIFNlbmQgZXZlbnQgYmVmb3JlIGZpbmlzaGluZyBkcmF3aW5nXG4gICAgICAgIEwuRWRpdGFibGUuQmFzZUVkaXRvci5wcm90b3R5cGUub25OZXdDbGlja0hhbmRsZXJDbGlja2VkLmNhbGwodGhpcywgZSk7XG4gICAgICAgIHRoaXMuY29tbWl0RHJhd2luZygpO1xuICAgIH1cblxufSk7XG5cbkwuRWRpdGFibGUuUGF0aEVkaXRvciA9IEwuRWRpdGFibGUuQmFzZUVkaXRvci5leHRlbmQoe1xuXG4gICAgQ0xPU0VEOiBmYWxzZSxcbiAgICBNSU5fVkVSVEVYOiAyLFxuXG4gICAgZW5hYmxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLl9lbmFibGVkKSByZXR1cm4gdGhpcztcbiAgICAgICAgTC5FZGl0YWJsZS5CYXNlRWRpdG9yLnByb3RvdHlwZS5lbmFibGUuY2FsbCh0aGlzKTtcbiAgICAgICAgaWYgKHRoaXMuZmVhdHVyZSkge1xuICAgICAgICAgICAgdGhpcy5pbml0VmVydGV4TWFya2VycygpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBkaXNhYmxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBMLkVkaXRhYmxlLkJhc2VFZGl0b3IucHJvdG90eXBlLmRpc2FibGUuY2FsbCh0aGlzKTtcbiAgICB9LFxuXG4gICAgaW5pdFZlcnRleE1hcmtlcnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gZ3JvdXBzIGNhbiBiZSBvbmx5IGxhdGxuZ3MgKGZvciBwb2x5bGluZSBvciBzeW1wbGUgcG9seWdvbixcbiAgICAgICAgLy8gb3IgbGF0bG5ncyBwbHVzIG1hbnkgaG9sZXMsIGluIGNhc2Ugb2YgYSBjb21wbGV4IHBvbHlnb24pXG4gICAgICAgIHZhciBsYXRMbmdHcm91cHMgPSB0aGlzLmdldExhdExuZ3NHcm91cHMoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYXRMbmdHcm91cHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuYWRkVmVydGV4TWFya2VycyhsYXRMbmdHcm91cHNbaV0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGdldExhdExuZ3NHcm91cHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFt0aGlzLmdldExhdExuZ3MoKV07XG4gICAgfSxcblxuICAgIGdldExhdExuZ3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmVhdHVyZS5nZXRMYXRMbmdzKCk7XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZWRpdExheWVyLmNsZWFyTGF5ZXJzKCk7XG4gICAgICAgIHRoaXMuaW5pdFZlcnRleE1hcmtlcnMoKTtcbiAgICB9LFxuXG4gICAgYWRkVmVydGV4TWFya2VyOiBmdW5jdGlvbiAobGF0bG5nLCBsYXRsbmdzKSB7XG4gICAgICAgIHJldHVybiBuZXcgdGhpcy50b29scy5vcHRpb25zLnZlcnRleE1hcmtlckNsYXNzKGxhdGxuZywgbGF0bG5ncywgdGhpcyk7XG4gICAgfSxcblxuICAgIGFkZFZlcnRleE1hcmtlcnM6IGZ1bmN0aW9uIChsYXRsbmdzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGF0bG5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5hZGRWZXJ0ZXhNYXJrZXIobGF0bG5nc1tpXSwgbGF0bG5ncyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgYWRkTWlkZGxlTWFya2VyOiBmdW5jdGlvbiAobGVmdCwgcmlnaHQsIGxhdGxuZ3MpIHtcbiAgICAgICAgcmV0dXJuIG5ldyB0aGlzLnRvb2xzLm9wdGlvbnMubWlkZGxlTWFya2VyQ2xhc3MobGVmdCwgcmlnaHQsIGxhdGxuZ3MsIHRoaXMpO1xuICAgIH0sXG5cbiAgICBvblZlcnRleE1hcmtlckNsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgaW5kZXggPSBlLnZlcnRleC5nZXRJbmRleCgpO1xuICAgICAgICBpZiAoZS5vcmlnaW5hbEV2ZW50LmN0cmxLZXkpIHtcbiAgICAgICAgICAgIHRoaXMub25WZXJ0ZXhNYXJrZXJDdHJsQ2xpY2soZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoZS5vcmlnaW5hbEV2ZW50LmFsdEtleSkge1xuICAgICAgICAgICAgdGhpcy5vblZlcnRleE1hcmtlckFsdENsaWNrKGUpO1xuICAgICAgICB9IGVsc2UgaWYgKGUub3JpZ2luYWxFdmVudC5zaGlmdEtleSkge1xuICAgICAgICAgICAgdGhpcy5vblZlcnRleE1hcmtlclNoaWZ0Q2xpY2soZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5kZXggPj0gdGhpcy5NSU5fVkVSVEVYIC0gMSAmJiBpbmRleCA9PT0gZS52ZXJ0ZXguZ2V0TGFzdEluZGV4KCkgJiYgdGhpcy5kcmF3aW5nID09PSBMLkVkaXRhYmxlLkZPUldBUkQpIHtcbiAgICAgICAgICAgIHRoaXMuY29tbWl0RHJhd2luZygpO1xuICAgICAgICB9IGVsc2UgaWYgKGluZGV4ID09PSAwICYmIHRoaXMuZHJhd2luZyA9PT0gTC5FZGl0YWJsZS5CQUNLV0FSRCAmJiB0aGlzLl9kcmF3bkxhdExuZ3MubGVuZ3RoID49IHRoaXMuTUlOX1ZFUlRFWCkge1xuICAgICAgICAgICAgdGhpcy5jb21taXREcmF3aW5nKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5kZXggPT09IDAgJiYgdGhpcy5kcmF3aW5nID09PSBMLkVkaXRhYmxlLkZPUldBUkQgJiYgdGhpcy5fZHJhd25MYXRMbmdzLmxlbmd0aCA+PSB0aGlzLk1JTl9WRVJURVggJiYgdGhpcy5DTE9TRUQpIHtcbiAgICAgICAgICAgIHRoaXMuY29tbWl0RHJhd2luZygpOyAgLy8gQWxsb3cgdG8gY2xvc2Ugb24gZmlyc3QgcG9pbnQgYWxzbyBmb3IgcG9seWdvbnNcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMub25WZXJ0ZXhSYXdNYXJrZXJDbGljayhlKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvblZlcnRleFJhd01hcmtlckNsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAoIXRoaXMudmVydGV4Q2FuQmVEZWxldGVkKGUudmVydGV4KSkgcmV0dXJuO1xuICAgICAgICBlLnZlcnRleC5kZWxldGUoKTtcbiAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgfSxcblxuICAgIHZlcnRleENhbkJlRGVsZXRlZDogZnVuY3Rpb24gKHZlcnRleCkge1xuICAgICAgICByZXR1cm4gdmVydGV4LmxhdGxuZ3MubGVuZ3RoID4gdGhpcy5NSU5fVkVSVEVYO1xuICAgIH0sXG5cbiAgICBvblZlcnRleERlbGV0ZWQ6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHRoaXMuZmlyZUFuZEZvcndhcmQoJ2VkaXRhYmxlOnZlcnRleDpkZWxldGVkJywgZSk7XG4gICAgfSxcblxuICAgIG9uVmVydGV4TWFya2VyQ3RybENsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICB0aGlzLmZpcmVBbmRGb3J3YXJkKCdlZGl0YWJsZTp2ZXJ0ZXg6Y3RybGNsaWNrJywgZSk7XG4gICAgfSxcblxuICAgIG9uVmVydGV4TWFya2VyU2hpZnRDbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdGhpcy5maXJlQW5kRm9yd2FyZCgnZWRpdGFibGU6dmVydGV4OnNoaWZ0Y2xpY2snLCBlKTtcbiAgICB9LFxuXG4gICAgb25WZXJ0ZXhNYXJrZXJBbHRDbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdGhpcy5maXJlQW5kRm9yd2FyZCgnZWRpdGFibGU6dmVydGV4OmFsdGNsaWNrJywgZSk7XG4gICAgfSxcblxuICAgIG9uVmVydGV4TWFya2VyQ29udGV4dE1lbnU6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHRoaXMuZmlyZUFuZEZvcndhcmQoJ2VkaXRhYmxlOnZlcnRleDpjb250ZXh0bWVudScsIGUpO1xuICAgIH0sXG5cbiAgICBvblZlcnRleE1hcmtlck1vdXNlRG93bjogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdGhpcy5maXJlQW5kRm9yd2FyZCgnZWRpdGFibGU6dmVydGV4Om1vdXNlZG93bicsIGUpO1xuICAgIH0sXG5cbiAgICBvbk1pZGRsZU1hcmtlck1vdXNlRG93bjogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdGhpcy5maXJlQW5kRm9yd2FyZCgnZWRpdGFibGU6bWlkZGxlbWFya2VyOm1vdXNlZG93bicsIGUpO1xuICAgIH0sXG5cbiAgICBvblZlcnRleE1hcmtlckRyYWc6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHRoaXMuZmlyZUFuZEZvcndhcmQoJ2VkaXRhYmxlOnZlcnRleDpkcmFnJywgZSk7XG4gICAgfSxcblxuICAgIG9uVmVydGV4TWFya2VyRHJhZ1N0YXJ0OiBmdW5jdGlvbiAoZSkge1xuICAgICAgICB0aGlzLmZpcmVBbmRGb3J3YXJkKCdlZGl0YWJsZTp2ZXJ0ZXg6ZHJhZ3N0YXJ0JywgZSk7XG4gICAgfSxcblxuICAgIG9uVmVydGV4TWFya2VyRHJhZ0VuZDogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdGhpcy5maXJlQW5kRm9yd2FyZCgnZWRpdGFibGU6dmVydGV4OmRyYWdlbmQnLCBlKTtcbiAgICB9LFxuXG4gICAgc3RhcnREcmF3aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghdGhpcy5fZHJhd25MYXRMbmdzKSB0aGlzLl9kcmF3bkxhdExuZ3MgPSB0aGlzLmdldExhdExuZ3MoKTtcbiAgICAgICAgTC5FZGl0YWJsZS5CYXNlRWRpdG9yLnByb3RvdHlwZS5zdGFydERyYXdpbmcuY2FsbCh0aGlzKTtcbiAgICB9LFxuXG4gICAgc3RhcnREcmF3aW5nRm9yd2FyZDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnN0YXJ0RHJhd2luZygpO1xuICAgICAgICB0aGlzLnRvb2xzLmF0dGFjaEZvcndhcmRMaW5lR3VpZGUoKTtcbiAgICB9LFxuXG4gICAgZW5kRHJhd2luZzogZnVuY3Rpb24gKCkge1xuICAgICAgICBMLkVkaXRhYmxlLkJhc2VFZGl0b3IucHJvdG90eXBlLmVuZERyYXdpbmcuY2FsbCh0aGlzKTtcbiAgICAgICAgdGhpcy50b29scy5kZXRhY2hGb3J3YXJkTGluZUd1aWRlKCk7XG4gICAgICAgIHRoaXMudG9vbHMuZGV0YWNoQmFja3dhcmRMaW5lR3VpZGUoKTtcbiAgICAgICAgZGVsZXRlIHRoaXMuX2RyYXduTGF0TG5ncztcbiAgICB9LFxuXG4gICAgYWRkTGF0TG5nOiBmdW5jdGlvbiAobGF0bG5nKSB7XG4gICAgICAgIGlmICh0aGlzLmRyYXdpbmcgPT09IEwuRWRpdGFibGUuRk9SV0FSRCkgdGhpcy5fZHJhd25MYXRMbmdzLnB1c2gobGF0bG5nKTtcbiAgICAgICAgZWxzZSB0aGlzLl9kcmF3bkxhdExuZ3MudW5zaGlmdChsYXRsbmcpO1xuICAgICAgICB0aGlzLnJlZnJlc2goKTtcbiAgICAgICAgdGhpcy5hZGRWZXJ0ZXhNYXJrZXIobGF0bG5nLCB0aGlzLl9kcmF3bkxhdExuZ3MpO1xuICAgIH0sXG5cbiAgICBuZXdQb2ludEZvcndhcmQ6IGZ1bmN0aW9uIChsYXRsbmcpIHtcbiAgICAgICAgdGhpcy5hZGRMYXRMbmcobGF0bG5nKTtcbiAgICAgICAgdGhpcy50b29scy5hbmNob3JGb3J3YXJkTGluZUd1aWRlKGxhdGxuZyk7XG4gICAgICAgIGlmICghdGhpcy50b29scy5iYWNrd2FyZExpbmVHdWlkZS5fbGF0bG5nc1swXSkge1xuICAgICAgICAgICAgdGhpcy50b29scy5hbmNob3JCYWNrd2FyZExpbmVHdWlkZShsYXRsbmcpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG5ld1BvaW50QmFja3dhcmQ6IGZ1bmN0aW9uIChsYXRsbmcpIHtcbiAgICAgICAgdGhpcy5hZGRMYXRMbmcobGF0bG5nKTtcbiAgICAgICAgdGhpcy50b29scy5hbmNob3JCYWNrd2FyZExpbmVHdWlkZShsYXRsbmcpO1xuICAgIH0sXG5cbiAgICBvbk5ld0NsaWNrSGFuZGxlckNsaWNrZWQ6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmICghdGhpcy5pc05ld0NsaWNrVmFsaWQoZS5sYXRsbmcpKSByZXR1cm47XG4gICAgICAgIGlmICh0aGlzLmRyYXdpbmcgPT09IEwuRWRpdGFibGUuRk9SV0FSRCkgdGhpcy5uZXdQb2ludEZvcndhcmQoZS5sYXRsbmcpO1xuICAgICAgICBlbHNlIHRoaXMubmV3UG9pbnRCYWNrd2FyZChlLmxhdGxuZyk7XG4gICAgICAgIEwuRWRpdGFibGUuQmFzZUVkaXRvci5wcm90b3R5cGUub25OZXdDbGlja0hhbmRsZXJDbGlja2VkLmNhbGwodGhpcywgZSk7XG4gICAgfSxcblxuICAgIG9uTW91c2VNb3ZlOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAodGhpcy5kcmF3aW5nKSB7XG4gICAgICAgICAgICBMLkVkaXRhYmxlLkJhc2VFZGl0b3IucHJvdG90eXBlLm9uTW91c2VNb3ZlLmNhbGwodGhpcywgZSk7XG4gICAgICAgICAgICB0aGlzLnRvb2xzLm1vdmVGb3J3YXJkTGluZUd1aWRlKGUubGF0bG5nKTtcbiAgICAgICAgICAgIHRoaXMudG9vbHMubW92ZUJhY2t3YXJkTGluZUd1aWRlKGUubGF0bG5nKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZWZyZXNoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZmVhdHVyZS5yZWRyYXcoKTtcbiAgICAgICAgdGhpcy5vbkVkaXRpbmcoKTtcbiAgICB9XG5cbn0pO1xuXG5MLkVkaXRhYmxlLlBvbHlsaW5lRWRpdG9yID0gTC5FZGl0YWJsZS5QYXRoRWRpdG9yLmV4dGVuZCh7XG5cbiAgICBzdGFydERyYXdpbmdCYWNrd2FyZDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmRyYXdpbmcgPSBMLkVkaXRhYmxlLkJBQ0tXQVJEO1xuICAgICAgICB0aGlzLnN0YXJ0RHJhd2luZygpO1xuICAgICAgICB0aGlzLnRvb2xzLmF0dGFjaEJhY2t3YXJkTGluZUd1aWRlKCk7XG4gICAgfSxcblxuICAgIGNvbnRpbnVlQmFja3dhcmQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy50b29scy5hbmNob3JCYWNrd2FyZExpbmVHdWlkZSh0aGlzLmdldEZpcnN0TGF0TG5nKCkpO1xuICAgICAgICB0aGlzLnN0YXJ0RHJhd2luZ0JhY2t3YXJkKCk7XG4gICAgfSxcblxuICAgIGNvbnRpbnVlRm9yd2FyZDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnRvb2xzLmFuY2hvckZvcndhcmRMaW5lR3VpZGUodGhpcy5nZXRMYXN0TGF0TG5nKCkpO1xuICAgICAgICB0aGlzLnN0YXJ0RHJhd2luZ0ZvcndhcmQoKTtcbiAgICB9LFxuXG4gICAgZ2V0TGFzdExhdExuZzogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRMYXRMbmdzKClbdGhpcy5nZXRMYXRMbmdzKCkubGVuZ3RoIC0gMV07XG4gICAgfSxcblxuICAgIGdldEZpcnN0TGF0TG5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldExhdExuZ3MoKVswXTtcbiAgICB9XG5cbn0pO1xuXG5MLkVkaXRhYmxlLlBvbHlnb25FZGl0b3IgPSBMLkVkaXRhYmxlLlBhdGhFZGl0b3IuZXh0ZW5kKHtcblxuICAgIENMT1NFRDogdHJ1ZSxcbiAgICBNSU5fVkVSVEVYOiAzLFxuXG4gICAgZ2V0TGF0TG5nc0dyb3VwczogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZ3JvdXBzID0gTC5FZGl0YWJsZS5QYXRoRWRpdG9yLnByb3RvdHlwZS5nZXRMYXRMbmdzR3JvdXBzLmNhbGwodGhpcyk7XG4gICAgICAgIGlmICh0aGlzLmZlYXR1cmUuX2hvbGVzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZmVhdHVyZS5faG9sZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBncm91cHMucHVzaCh0aGlzLmZlYXR1cmUuX2hvbGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZ3JvdXBzO1xuICAgIH0sXG5cbiAgICBzdGFydERyYXdpbmdGb3J3YXJkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIEwuRWRpdGFibGUuUGF0aEVkaXRvci5wcm90b3R5cGUuc3RhcnREcmF3aW5nRm9yd2FyZC5jYWxsKHRoaXMpO1xuICAgICAgICB0aGlzLnRvb2xzLmF0dGFjaEJhY2t3YXJkTGluZUd1aWRlKCk7XG4gICAgfSxcblxuICAgIGFkZE5ld0VtcHR5SG9sZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaG9sZXMgPSBBcnJheSgpO1xuICAgICAgICBpZiAoIXRoaXMuZmVhdHVyZS5faG9sZXMpIHtcbiAgICAgICAgICAgIHRoaXMuZmVhdHVyZS5faG9sZXMgPSBbXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZlYXR1cmUuX2hvbGVzLnB1c2goaG9sZXMpO1xuICAgICAgICByZXR1cm4gaG9sZXM7XG4gICAgfSxcblxuICAgIG5ld0hvbGU6IGZ1bmN0aW9uIChsYXRsbmcpIHtcbiAgICAgICAgdGhpcy5fZHJhd25MYXRMbmdzID0gdGhpcy5hZGROZXdFbXB0eUhvbGUoKTtcbiAgICAgICAgdGhpcy5zdGFydERyYXdpbmdGb3J3YXJkKCk7XG4gICAgICAgIGlmIChsYXRsbmcpIHRoaXMubmV3UG9pbnRGb3J3YXJkKGxhdGxuZyk7XG4gICAgfSxcblxuICAgIGNoZWNrQ29udGFpbnM6IGZ1bmN0aW9uIChsYXRsbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmVhdHVyZS5fY29udGFpbnNQb2ludCh0aGlzLm1hcC5sYXRMbmdUb0xheWVyUG9pbnQobGF0bG5nKSk7XG4gICAgfSxcblxuICAgIHZlcnRleENhbkJlRGVsZXRlZDogZnVuY3Rpb24gKHZlcnRleCkge1xuICAgICAgICBpZiAodmVydGV4LmxhdGxuZ3MgPT09IHRoaXMuZ2V0TGF0TG5ncygpKSByZXR1cm4gTC5FZGl0YWJsZS5QYXRoRWRpdG9yLnByb3RvdHlwZS52ZXJ0ZXhDYW5CZURlbGV0ZWQuY2FsbCh0aGlzLCB2ZXJ0ZXgpO1xuICAgICAgICBlbHNlIHJldHVybiB0cnVlOyAgLy8gSG9sZXMgY2FuIGJlIHRvdGFsbHkgZGVsZXRlZCB3aXRob3V0IHJlbW92aW5nIHRoZSBsYXllciBpdHNlbGZcbiAgICB9LFxuXG4gICAgaXNOZXdDbGlja1ZhbGlkOiBmdW5jdGlvbiAobGF0bG5nKSB7XG4gICAgICAgIGlmICh0aGlzLl9kcmF3bkxhdExuZ3MgIT09IHRoaXMuZ2V0TGF0TG5ncygpKSByZXR1cm4gdGhpcy5jaGVja0NvbnRhaW5zKGxhdGxuZyk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG5cbiAgICBvblZlcnRleERlbGV0ZWQ6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIEwuRWRpdGFibGUuUGF0aEVkaXRvci5wcm90b3R5cGUub25WZXJ0ZXhEZWxldGVkLmNhbGwodGhpcywgZSk7XG4gICAgICAgIGlmICghZS52ZXJ0ZXgubGF0bG5ncy5sZW5ndGggJiYgZS52ZXJ0ZXgubGF0bG5ncyAhPT0gdGhpcy5nZXRMYXRMbmdzKCkpIHtcbiAgICAgICAgICAgIHRoaXMuZmVhdHVyZS5faG9sZXMuc3BsaWNlKHRoaXMuZmVhdHVyZS5faG9sZXMuaW5kZXhPZihlLnZlcnRleC5sYXRsbmdzKSwgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbn0pO1xuXG5MLk1hcC5tZXJnZU9wdGlvbnMoe1xuICAgIHBvbHlsaW5lRWRpdG9yQ2xhc3M6IEwuRWRpdGFibGUuUG9seWxpbmVFZGl0b3Jcbn0pO1xuXG5MLk1hcC5tZXJnZU9wdGlvbnMoe1xuICAgIHBvbHlnb25FZGl0b3JDbGFzczogTC5FZGl0YWJsZS5Qb2x5Z29uRWRpdG9yXG59KTtcblxuTC5NYXAubWVyZ2VPcHRpb25zKHtcbiAgICBtYXJrZXJFZGl0b3JDbGFzczogTC5FZGl0YWJsZS5NYXJrZXJFZGl0b3Jcbn0pO1xuXG52YXIgRWRpdGFibGVNaXhpbiA9IHtcblxuICAgIGNyZWF0ZUVkaXRvcjogZnVuY3Rpb24gKG1hcCkge1xuICAgICAgICBtYXAgPSBtYXAgfHzCoHRoaXMuX21hcDtcbiAgICAgICAgdmFyIEtsYXNzID0gdGhpcy5vcHRpb25zLmVkaXRvckNsYXNzIHx8wqB0aGlzLmdldEVkaXRvckNsYXNzKG1hcCk7XG4gICAgICAgIHJldHVybiBuZXcgS2xhc3MobWFwLCB0aGlzLCB0aGlzLm9wdGlvbnMuZWRpdE9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICBlbmFibGVFZGl0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghdGhpcy5lZGl0b3IpIHRoaXMuY3JlYXRlRWRpdG9yKCk7XG4gICAgICAgIGlmICh0aGlzLm11bHRpKSB0aGlzLm11bHRpLm9uRWRpdEVuYWJsZWQoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWRpdG9yLmVuYWJsZSgpO1xuICAgIH0sXG5cbiAgICBlZGl0RW5hYmxlZDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lZGl0b3IgJiYgdGhpcy5lZGl0b3IuX2VuYWJsZWQ7XG4gICAgfSxcblxuICAgIGRpc2FibGVFZGl0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvcikge1xuICAgICAgICAgICAgaWYgKHRoaXMubXVsdGkpIHRoaXMubXVsdGkub25FZGl0RGlzYWJsZWQoKTtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yLmRpc2FibGUoKTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmVkaXRvcjtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICB0b2dnbGVFZGl0OiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5lZGl0RW5hYmxlZCgpKSB7XG4gICAgICAgIHRoaXMuZGlzYWJsZUVkaXQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZW5hYmxlRWRpdCgpO1xuICAgICAgfVxuICAgIH1cblxufTtcblxuTC5Qb2x5bGluZS5pbmNsdWRlKEVkaXRhYmxlTWl4aW4pO1xuTC5Qb2x5Z29uLmluY2x1ZGUoRWRpdGFibGVNaXhpbik7XG5MLk1hcmtlci5pbmNsdWRlKEVkaXRhYmxlTWl4aW4pO1xuXG5MLlBvbHlsaW5lLmluY2x1ZGUoe1xuXG4gICAgX2NvbnRhaW5zUG9pbnQ6IGZ1bmN0aW9uIChwLCBjbG9zZWQpIHsgIC8vIENvcHktcGFzdGVkIGZyb20gTGVhZmxldFxuICAgICAgICB2YXIgaSwgaiwgaywgbGVuLCBsZW4yLCBkaXN0LCBwYXJ0LFxuICAgICAgICAgICAgdyA9IHRoaXMub3B0aW9ucy53ZWlnaHQgLyAyO1xuXG4gICAgICAgIGlmIChMLkJyb3dzZXIudG91Y2gpIHtcbiAgICAgICAgICAgIHcgKz0gMTA7IC8vIHBvbHlsaW5lIGNsaWNrIHRvbGVyYW5jZSBvbiB0b3VjaCBkZXZpY2VzXG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLl9wYXJ0cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgcGFydCA9IHRoaXMuX3BhcnRzW2ldO1xuICAgICAgICAgICAgZm9yIChqID0gMCwgbGVuMiA9IHBhcnQubGVuZ3RoLCBrID0gbGVuMiAtIDE7IGogPCBsZW4yOyBrID0gaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjbG9zZWQgJiYgKGogPT09IDApKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGRpc3QgPSBMLkxpbmVVdGlsLnBvaW50VG9TZWdtZW50RGlzdGFuY2UocCwgcGFydFtrXSwgcGFydFtqXSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoZGlzdCA8PSB3KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIGdldEVkaXRvckNsYXNzOiBmdW5jdGlvbiAobWFwKSB7XG4gICAgICAgIHJldHVybiBtYXAub3B0aW9ucy5wb2x5bGluZUVkaXRvckNsYXNzO1xuICAgIH1cblxufSk7XG5MLlBvbHlnb24uaW5jbHVkZSh7XG5cbiAgICBfY29udGFpbnNQb2ludDogZnVuY3Rpb24gKHApIHsgIC8vIENvcHktcGFzdGVkIGZyb20gTGVhZmxldFxuICAgICAgICB2YXIgaW5zaWRlID0gZmFsc2UsXG4gICAgICAgICAgICBwYXJ0LCBwMSwgcDIsXG4gICAgICAgICAgICBpLCBqLCBrLFxuICAgICAgICAgICAgbGVuLCBsZW4yO1xuXG4gICAgICAgIC8vIFRPRE8gb3B0aW1pemF0aW9uOiBjaGVjayBpZiB3aXRoaW4gYm91bmRzIGZpcnN0XG5cbiAgICAgICAgaWYgKEwuUG9seWxpbmUucHJvdG90eXBlLl9jb250YWluc1BvaW50LmNhbGwodGhpcywgcCwgdHJ1ZSkpIHtcbiAgICAgICAgICAgIC8vIGNsaWNrIG9uIHBvbHlnb24gYm9yZGVyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJheSBjYXN0aW5nIGFsZ29yaXRobSBmb3IgZGV0ZWN0aW5nIGlmIHBvaW50IGlzIGluIHBvbHlnb25cblxuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLl9wYXJ0cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgcGFydCA9IHRoaXMuX3BhcnRzW2ldO1xuXG4gICAgICAgICAgICBmb3IgKGogPSAwLCBsZW4yID0gcGFydC5sZW5ndGgsIGsgPSBsZW4yIC0gMTsgaiA8IGxlbjI7IGsgPSBqKyspIHtcbiAgICAgICAgICAgICAgICBwMSA9IHBhcnRbal07XG4gICAgICAgICAgICAgICAgcDIgPSBwYXJ0W2tdO1xuXG4gICAgICAgICAgICAgICAgaWYgKCgocDEueSA+IHAueSkgIT09IChwMi55ID4gcC55KSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIChwLnggPCAocDIueCAtIHAxLngpICogKHAueSAtIHAxLnkpIC8gKHAyLnkgLSBwMS55KSArIHAxLngpKSB7XG4gICAgICAgICAgICAgICAgICAgIGluc2lkZSA9ICFpbnNpZGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGluc2lkZTtcbiAgICB9LFxuXG4gICAgZ2V0RWRpdG9yQ2xhc3M6IGZ1bmN0aW9uIChtYXApIHtcbiAgICAgICAgcmV0dXJuIG1hcC5vcHRpb25zLnBvbHlnb25FZGl0b3JDbGFzcztcbiAgICB9XG5cbn0pO1xuXG5MLk1hcmtlci5pbmNsdWRlKHtcblxuICAgIGdldEVkaXRvckNsYXNzOiBmdW5jdGlvbiAobWFwKSB7XG4gICAgICAgIHJldHVybiBtYXAub3B0aW9ucy5tYXJrZXJFZGl0b3JDbGFzcztcbiAgICB9XG5cbn0pO1xuXG52YXIgTXVsdGlFZGl0YWJsZU1peGluID0ge1xuXG4gICAgZW5hYmxlRWRpdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmVhY2hMYXllcihmdW5jdGlvbihsYXllcikge1xuICAgICAgICAgICAgbGF5ZXIubXVsdGkgPSB0aGlzO1xuICAgICAgICAgICAgbGF5ZXIuZW5hYmxlRWRpdCgpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgZGlzYWJsZUVkaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5lYWNoTGF5ZXIoZnVuY3Rpb24obGF5ZXIpIHtcbiAgICAgICAgICAgIGxheWVyLmRpc2FibGVFZGl0KCk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICB0b2dnbGVFZGl0OiBmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAoIWUubGF5ZXIuZWRpdG9yKSB7XG4gICAgICAgICAgICB0aGlzLmVuYWJsZUVkaXQoZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmRpc2FibGVFZGl0KCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25FZGl0RW5hYmxlZDogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXRoaXMuX2VkaXRFbmFibGVkKSB7XG4gICAgICAgICAgICB0aGlzLl9lZGl0RW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ2VkaXRhYmxlOm11bHRpOmVkaXQ6ZW5hYmxlZCcpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uRWRpdERpc2FibGVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLl9lZGl0RW5hYmxlZCkge1xuICAgICAgICAgICAgdGhpcy5fZWRpdEVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgnZWRpdGFibGU6bXVsdGk6ZWRpdDpkaXNhYmxlZCcpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGVkaXRFbmFibGVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuX2VkaXRFbmFibGVkO1xuICAgIH1cblxufTtcbkwuTXVsdGlQb2x5Z29uLmluY2x1ZGUoTXVsdGlFZGl0YWJsZU1peGluKTtcbkwuTXVsdGlQb2x5bGluZS5pbmNsdWRlKE11bHRpRWRpdGFibGVNaXhpbik7XG4iLCJyZXF1aXJlKCcuL3NyYy9QYXRoLlRyYW5zZm9ybScpO1xucmVxdWlyZSgnLi9zcmMvUGF0aC5EcmFnJyk7XG5yZXF1aXJlKCcuL3NyYy9NdWx0aVBvbHkuRHJhZycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEwuUGF0aC5EcmFnO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gIC8vIGxpc3RlbiBhbmQgcHJvcGFnYXRlIGRyYWdzdGFydCBvbiBzdWItbGF5ZXJzXG4gIEwuRmVhdHVyZUdyb3VwLkVWRU5UUyArPSAnIGRyYWdzdGFydCc7XG5cbiAgZnVuY3Rpb24gd3JhcE1ldGhvZChrbGFzc2VzLCBtZXRob2ROYW1lLCBtZXRob2QpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0ga2xhc3Nlcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgdmFyIGtsYXNzID0ga2xhc3Nlc1tpXTtcbiAgICAgIGtsYXNzLnByb3RvdHlwZVsnXycgKyBtZXRob2ROYW1lXSA9IGtsYXNzLnByb3RvdHlwZVttZXRob2ROYW1lXTtcbiAgICAgIGtsYXNzLnByb3RvdHlwZVttZXRob2ROYW1lXSA9IG1ldGhvZDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtMLlBvbHlnb258TC5Qb2x5bGluZX0gbGF5ZXJcbiAgICogQHJldHVybiB7TC5NdWx0aVBvbHlnb258TC5NdWx0aVBvbHlsaW5lfVxuICAgKi9cbiAgZnVuY3Rpb24gYWRkTGF5ZXIobGF5ZXIpIHtcbiAgICBpZiAodGhpcy5oYXNMYXllcihsYXllcikpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBsYXllclxuICAgICAgLm9uKCdkcmFnJywgdGhpcy5fb25EcmFnLCB0aGlzKVxuICAgICAgLm9uKCdkcmFnZW5kJywgdGhpcy5fb25EcmFnRW5kLCB0aGlzKTtcbiAgICByZXR1cm4gdGhpcy5fYWRkTGF5ZXIuY2FsbCh0aGlzLCBsYXllcik7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtICB7TC5Qb2x5Z29ufEwuUG9seWxpbmV9IGxheWVyXG4gICAqIEByZXR1cm4ge0wuTXVsdGlQb2x5Z29ufEwuTXVsdGlQb2x5bGluZX1cbiAgICovXG4gIGZ1bmN0aW9uIHJlbW92ZUxheWVyKGxheWVyKSB7XG4gICAgaWYgKCF0aGlzLmhhc0xheWVyKGxheWVyKSkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGxheWVyXG4gICAgICAub2ZmKCdkcmFnJywgdGhpcy5fb25EcmFnLCB0aGlzKVxuICAgICAgLm9mZignZHJhZ2VuZCcsIHRoaXMuX29uRHJhZ0VuZCwgdGhpcyk7XG4gICAgcmV0dXJuIHRoaXMuX3JlbW92ZUxheWVyLmNhbGwodGhpcywgbGF5ZXIpO1xuICB9XG5cbiAgLy8gZHVjay10eXBlIG1ldGhvZHMgdG8gbGlzdGVuIHRvIHRoZSBkcmFnIGV2ZW50c1xuICB3cmFwTWV0aG9kKFtMLk11bHRpUG9seWdvbiwgTC5NdWx0aVBvbHlsaW5lXSwgJ2FkZExheWVyJywgYWRkTGF5ZXIpO1xuICB3cmFwTWV0aG9kKFtMLk11bHRpUG9seWdvbiwgTC5NdWx0aVBvbHlsaW5lXSwgJ3JlbW92ZUxheWVyJywgcmVtb3ZlTGF5ZXIpO1xuXG4gIHZhciBkcmFnTWV0aG9kcyA9IHtcbiAgICBfb25EcmFnOiBmdW5jdGlvbihldnQpIHtcbiAgICAgIHZhciBsYXllciA9IGV2dC50YXJnZXQ7XG4gICAgICB0aGlzLmVhY2hMYXllcihmdW5jdGlvbihvdGhlckxheWVyKSB7XG4gICAgICAgIGlmIChvdGhlckxheWVyICE9PSBsYXllcikge1xuICAgICAgICAgIG90aGVyTGF5ZXIuX2FwcGx5VHJhbnNmb3JtKGxheWVyLmRyYWdnaW5nLl9tYXRyaXgpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5fcHJvcGFnYXRlRXZlbnQoZXZ0KTtcbiAgICB9LFxuXG4gICAgX29uRHJhZ0VuZDogZnVuY3Rpb24oZXZ0KSB7XG4gICAgICB2YXIgbGF5ZXIgPSBldnQudGFyZ2V0O1xuXG4gICAgICB0aGlzLmVhY2hMYXllcihmdW5jdGlvbihvdGhlckxheWVyKSB7XG4gICAgICAgIGlmIChvdGhlckxheWVyICE9PSBsYXllcikge1xuICAgICAgICAgIG90aGVyTGF5ZXIuX3Jlc2V0VHJhbnNmb3JtKCk7XG4gICAgICAgICAgb3RoZXJMYXllci5kcmFnZ2luZy5fdHJhbnNmb3JtUG9pbnRzKGxheWVyLmRyYWdnaW5nLl9tYXRyaXgpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5fcHJvcGFnYXRlRXZlbnQoZXZ0KTtcbiAgICB9XG4gIH07XG5cbiAgTC5NdWx0aVBvbHlnb24uaW5jbHVkZShkcmFnTWV0aG9kcyk7XG4gIEwuTXVsdGlQb2x5bGluZS5pbmNsdWRlKGRyYWdNZXRob2RzKTtcblxufSkoKTtcbiIsIi8qKlxuICogTGVhZmxldCB2ZWN0b3IgZmVhdHVyZXMgZHJhZyBmdW5jdGlvbmFsaXR5XG4gKiBAcHJlc2VydmVcbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBEcmFnIGhhbmRsZXJcbiAqIEBjbGFzcyBMLlBhdGguRHJhZ1xuICogQGV4dGVuZHMge0wuSGFuZGxlcn1cbiAqL1xuTC5IYW5kbGVyLlBhdGhEcmFnID0gTC5IYW5kbGVyLmV4dGVuZCggLyoqIEBsZW5kcyAgTC5QYXRoLkRyYWcucHJvdG90eXBlICovIHtcblxuICBzdGF0aWNzOiB7XG4gICAgRFJBR0dBQkxFX0NMUzogJ2xlYWZsZXQtcGF0aC1kcmFnZ2FibGUnXG4gIH0sXG5cbiAgLyoqXG4gICAqIEBwYXJhbSAge0wuUGF0aH0gcGF0aFxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uKHBhdGgpIHtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtMLlBhdGh9XG4gICAgICovXG4gICAgdGhpcy5fcGF0aCA9IHBhdGg7XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7QXJyYXkuPE51bWJlcj59XG4gICAgICovXG4gICAgdGhpcy5fbWF0cml4ID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtMLlBvaW50fVxuICAgICAqL1xuICAgIHRoaXMuX3N0YXJ0UG9pbnQgPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0wuUG9pbnR9XG4gICAgICovXG4gICAgdGhpcy5fZHJhZ1N0YXJ0UG9pbnQgPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICovXG4gICAgdGhpcy5fZHJhZ0luUHJvZ3Jlc3MgPSBmYWxzZTtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqL1xuICAgIHRoaXMuX2RyYWdNb3ZlZCA9IGZhbHNlO1xuXG4gIH0sXG5cblxuICAvKipcbiAgICogRW5hYmxlIGRyYWdnaW5nXG4gICAqL1xuICBhZGRIb29rczogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNsYXNzTmFtZSA9IEwuSGFuZGxlci5QYXRoRHJhZy5EUkFHR0FCTEVfQ0xTO1xuICAgIHZhciBwYXRoICAgICAgPSB0aGlzLl9wYXRoLl9wYXRoO1xuXG4gICAgdGhpcy5fcGF0aC5vbignbW91c2Vkb3duJywgdGhpcy5fb25EcmFnU3RhcnQsIHRoaXMpO1xuICAgIHRoaXMuX3BhdGgub3B0aW9ucy5jbGFzc05hbWUgPVxuICAgICAgKHRoaXMuX3BhdGgub3B0aW9ucy5jbGFzc05hbWUgfHwgJycpICsgJyAnICsgY2xhc3NOYW1lO1xuXG4gICAgaWYgKCFMLlBhdGguQ0FOVkFTICYmIHBhdGgpIHtcbiAgICAgIEwuRG9tVXRpbC5hZGRDbGFzcyhwYXRoLCBjbGFzc05hbWUpO1xuICAgIH1cbiAgfSxcblxuXG4gIC8qKlxuICAgKiBEaXNhYmxlIGRyYWdnaW5nXG4gICAqL1xuICByZW1vdmVIb29rczogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNsYXNzTmFtZSA9IEwuSGFuZGxlci5QYXRoRHJhZy5EUkFHR0FCTEVfQ0xTO1xuICAgIHZhciBwYXRoICAgICAgPSB0aGlzLl9wYXRoLl9wYXRoO1xuXG4gICAgdGhpcy5fcGF0aC5vZmYoJ21vdXNlZG93bicsIHRoaXMuX29uRHJhZ1N0YXJ0LCB0aGlzKTtcbiAgICB0aGlzLl9wYXRoLm9wdGlvbnMuY2xhc3NOYW1lID1cbiAgICAgICh0aGlzLl9wYXRoLm9wdGlvbnMuY2xhc3NOYW1lIHx8ICcnKS5yZXBsYWNlKGNsYXNzTmFtZSwgJycpO1xuXG4gICAgaWYgKCFMLlBhdGguQ0FOVkFTICYmIHBhdGgpIHtcbiAgICAgIEwuRG9tVXRpbC5yZW1vdmVDbGFzcyhwYXRoLCBjbGFzc05hbWUpO1xuICAgIH1cbiAgICB0aGlzLl9kcmFnTW92ZWQgPSBmYWxzZTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgKi9cbiAgbW92ZWQ6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9kcmFnTW92ZWQ7XG4gIH0sXG5cblxuICAvKipcbiAgICogSWYgZHJhZ2dpbmcgY3VycmVudGx5IGluIHByb2dyZXNzLlxuICAgKlxuICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgKi9cbiAgaW5Qcm9ncmVzczogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RyYWdJblByb2dyZXNzO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIFN0YXJ0IGRyYWdcbiAgICogQHBhcmFtICB7TC5Nb3VzZUV2ZW50fSBldnRcbiAgICovXG4gIF9vbkRyYWdTdGFydDogZnVuY3Rpb24oZXZ0KSB7XG4gICAgdGhpcy5fZHJhZ0luUHJvZ3Jlc3MgPSB0cnVlO1xuICAgIHRoaXMuX3N0YXJ0UG9pbnQgPSBldnQuY29udGFpbmVyUG9pbnQuY2xvbmUoKTtcbiAgICB0aGlzLl9kcmFnU3RhcnRQb2ludCA9IGV2dC5jb250YWluZXJQb2ludC5jbG9uZSgpO1xuICAgIHRoaXMuX21hdHJpeCA9IFsxLCAwLCAwLCAxLCAwLCAwXTtcblxuICAgIGlmKHRoaXMuX3BhdGguX3BvaW50KSB7XG4gICAgICB0aGlzLl9wb2ludCA9IHRoaXMuX3BhdGguX3BvaW50LmNsb25lKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fcGF0aC5fbWFwXG4gICAgICAub24oJ21vdXNlbW92ZScsIHRoaXMuX29uRHJhZywgdGhpcylcbiAgICAgIC5vbignbW91c2V1cCcsIHRoaXMuX29uRHJhZ0VuZCwgdGhpcylcbiAgICB0aGlzLl9kcmFnTW92ZWQgPSBmYWxzZTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBEcmFnZ2luZ1xuICAgKiBAcGFyYW0gIHtMLk1vdXNlRXZlbnR9IGV2dFxuICAgKi9cbiAgX29uRHJhZzogZnVuY3Rpb24oZXZ0KSB7XG4gICAgdmFyIHggPSBldnQuY29udGFpbmVyUG9pbnQueDtcbiAgICB2YXIgeSA9IGV2dC5jb250YWluZXJQb2ludC55O1xuXG4gICAgdmFyIG1hdHJpeCAgICAgPSB0aGlzLl9tYXRyaXg7XG4gICAgdmFyIHBhdGggICAgICAgPSB0aGlzLl9wYXRoO1xuICAgIHZhciBzdGFydFBvaW50ID0gdGhpcy5fc3RhcnRQb2ludDtcblxuICAgIHZhciBkeCA9IHggLSBzdGFydFBvaW50Lng7XG4gICAgdmFyIGR5ID0geSAtIHN0YXJ0UG9pbnQueTtcblxuICAgIGlmICghdGhpcy5fZHJhZ01vdmVkICYmIChkeCB8fCBkeSkpIHtcbiAgICAgIHRoaXMuX2RyYWdNb3ZlZCA9IHRydWU7XG4gICAgICBwYXRoLmZpcmUoJ2RyYWdzdGFydCcpO1xuXG4gICAgICBpZiAocGF0aC5fcG9wdXApIHtcbiAgICAgICAgcGF0aC5fcG9wdXAuX2Nsb3NlKCk7XG4gICAgICAgIHBhdGgub2ZmKCdjbGljaycsIHBhdGguX29wZW5Qb3B1cCwgcGF0aCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbWF0cml4WzRdICs9IGR4O1xuICAgIG1hdHJpeFs1XSArPSBkeTtcblxuICAgIHN0YXJ0UG9pbnQueCA9IHg7XG4gICAgc3RhcnRQb2ludC55ID0geTtcblxuICAgIHBhdGguX2FwcGx5VHJhbnNmb3JtKG1hdHJpeCk7XG5cbiAgICBpZiAocGF0aC5fcG9pbnQpIHsgLy8gTC5DaXJjbGUsIEwuQ2lyY2xlTWFya2VyXG4gICAgICBwYXRoLl9wb2ludC54ID0gdGhpcy5fcG9pbnQueCArIG1hdHJpeFs0XTtcbiAgICAgIHBhdGguX3BvaW50LnkgPSB0aGlzLl9wb2ludC55ICsgbWF0cml4WzVdO1xuICAgIH1cblxuICAgIHBhdGguZmlyZSgnZHJhZycpO1xuICAgIEwuRG9tRXZlbnQuc3RvcChldnQub3JpZ2luYWxFdmVudCk7XG4gIH0sXG5cblxuICAvKipcbiAgICogRHJhZ2dpbmcgc3RvcHBlZCwgYXBwbHlcbiAgICogQHBhcmFtICB7TC5Nb3VzZUV2ZW50fSBldnRcbiAgICovXG4gIF9vbkRyYWdFbmQ6IGZ1bmN0aW9uKGV2dCkge1xuICAgIEwuRG9tRXZlbnQuc3RvcChldnQpO1xuICAgIEwuRG9tRXZlbnQuX2Zha2VTdG9wKHsgdHlwZTogJ2NsaWNrJyB9KTtcblxuICAgIHRoaXMuX2RyYWdJblByb2dyZXNzID0gZmFsc2U7XG4gICAgLy8gdW5kbyBjb250YWluZXIgdHJhbnNmb3JtXG4gICAgdGhpcy5fcGF0aC5fcmVzZXRUcmFuc2Zvcm0oKTtcbiAgICAvLyBhcHBseSBtYXRyaXhcbiAgICB0aGlzLl90cmFuc2Zvcm1Qb2ludHModGhpcy5fbWF0cml4KTtcblxuICAgIHRoaXMuX3BhdGguX21hcFxuICAgICAgLm9mZignbW91c2Vtb3ZlJywgdGhpcy5fb25EcmFnLCB0aGlzKVxuICAgICAgLm9mZignbW91c2V1cCcsIHRoaXMuX29uRHJhZ0VuZCwgdGhpcyk7XG5cbiAgICAvLyBjb25zaXN0ZW5jeVxuICAgIHRoaXMuX3BhdGguZmlyZSgnZHJhZ2VuZCcsIHtcbiAgICAgIGRpc3RhbmNlOiBNYXRoLnNxcnQoXG4gICAgICAgIEwuTGluZVV0aWwuX3NxRGlzdCh0aGlzLl9kcmFnU3RhcnRQb2ludCwgZXZ0LmNvbnRhaW5lclBvaW50KVxuICAgICAgKVxuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMuX3BhdGguX3BvcHVwKSB7XG4gICAgICBMLlV0aWwucmVxdWVzdEFuaW1GcmFtZShmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fcGF0aC5vbignY2xpY2snLCB0aGlzLl9wYXRoLl9vcGVuUG9wdXAsIHRoaXMuX3BhdGgpO1xuICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgdGhpcy5fbWF0cml4ID0gbnVsbDtcbiAgICB0aGlzLl9zdGFydFBvaW50ID0gbnVsbDtcbiAgICB0aGlzLl9wb2ludCA9IG51bGw7XG4gICAgdGhpcy5fZHJhZ1N0YXJ0UG9pbnQgPSBudWxsO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybXMgcG9pbnQgYWNjb3JkaW5nIHRvIHRoZSBwcm92aWRlZCB0cmFuc2Zvcm1hdGlvbiBtYXRyaXguXG4gICAqXG4gICAqICBAcGFyYW0ge0FycmF5LjxOdW1iZXI+fSBtYXRyaXhcbiAgICogIEBwYXJhbSB7TC5MYXRMbmd9IHBvaW50XG4gICAqL1xuICBfdHJhbnNmb3JtUG9pbnQ6IGZ1bmN0aW9uKHBvaW50LCBtYXRyaXgpIHtcbiAgICB2YXIgcGF0aCA9IHRoaXMuX3BhdGg7XG5cbiAgICB2YXIgcHggPSBMLnBvaW50KG1hdHJpeFs0XSwgbWF0cml4WzVdKTtcblxuICAgIHZhciBjcnMgPSBwYXRoLl9tYXAub3B0aW9ucy5jcnM7XG4gICAgdmFyIHRyYW5zZm9ybWF0aW9uID0gY3JzLnRyYW5zZm9ybWF0aW9uO1xuICAgIHZhciBzY2FsZSA9IGNycy5zY2FsZShwYXRoLl9tYXAuZ2V0Wm9vbSgpKTtcbiAgICB2YXIgcHJvamVjdGlvbiA9IGNycy5wcm9qZWN0aW9uO1xuXG4gICAgdmFyIGRpZmYgPSB0cmFuc2Zvcm1hdGlvbi51bnRyYW5zZm9ybShweCwgc2NhbGUpXG4gICAgICAuc3VidHJhY3QodHJhbnNmb3JtYXRpb24udW50cmFuc2Zvcm0oTC5wb2ludCgwLCAwKSwgc2NhbGUpKTtcblxuICAgIHJldHVybiBwcm9qZWN0aW9uLnVucHJvamVjdChwcm9qZWN0aW9uLnByb2plY3QocG9pbnQpLl9hZGQoZGlmZikpO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgdHJhbnNmb3JtYXRpb24sIGRvZXMgaXQgaW4gb25lIHN3ZWVwIGZvciBwZXJmb3JtYW5jZSxcbiAgICogc28gZG9uJ3QgYmUgc3VycHJpc2VkIGFib3V0IHRoZSBjb2RlIHJlcGV0aXRpb24uXG4gICAqXG4gICAqIFsgeCBdICAgWyBhICBiICB0eCBdIFsgeCBdICAgWyBhICogeCArIGIgKiB5ICsgdHggXVxuICAgKiBbIHkgXSA9IFsgYyAgZCAgdHkgXSBbIHkgXSA9IFsgYyAqIHggKyBkICogeSArIHR5IF1cbiAgICpcbiAgICogQHBhcmFtIHtBcnJheS48TnVtYmVyPn0gbWF0cml4XG4gICAqL1xuICBfdHJhbnNmb3JtUG9pbnRzOiBmdW5jdGlvbihtYXRyaXgpIHtcbiAgICB2YXIgcGF0aCA9IHRoaXMuX3BhdGg7XG4gICAgdmFyIGksIGxlbiwgbGF0bG5nO1xuXG4gICAgdmFyIHB4ID0gTC5wb2ludChtYXRyaXhbNF0sIG1hdHJpeFs1XSk7XG5cbiAgICB2YXIgY3JzID0gcGF0aC5fbWFwLm9wdGlvbnMuY3JzO1xuICAgIHZhciB0cmFuc2Zvcm1hdGlvbiA9IGNycy50cmFuc2Zvcm1hdGlvbjtcbiAgICB2YXIgc2NhbGUgPSBjcnMuc2NhbGUocGF0aC5fbWFwLmdldFpvb20oKSk7XG4gICAgdmFyIHByb2plY3Rpb24gPSBjcnMucHJvamVjdGlvbjtcblxuICAgIHZhciBkaWZmID0gdHJhbnNmb3JtYXRpb24udW50cmFuc2Zvcm0ocHgsIHNjYWxlKVxuICAgICAgLnN1YnRyYWN0KHRyYW5zZm9ybWF0aW9uLnVudHJhbnNmb3JtKEwucG9pbnQoMCwgMCksIHNjYWxlKSk7XG5cbiAgICAvLyBjb25zb2xlLnRpbWUoJ3RyYW5zZm9ybScpO1xuXG4gICAgLy8gYWxsIHNoaWZ0cyBhcmUgaW4tcGxhY2VcbiAgICBpZiAocGF0aC5fcG9pbnQpIHsgLy8gTC5DaXJjbGVcbiAgICAgIHBhdGguX2xhdGxuZyA9IHByb2plY3Rpb24udW5wcm9qZWN0KFxuICAgICAgICBwcm9qZWN0aW9uLnByb2plY3QocGF0aC5fbGF0bG5nKS5fYWRkKGRpZmYpKTtcbiAgICAgIHBhdGguX3BvaW50ID0gdGhpcy5fcG9pbnQuX2FkZChweCk7XG4gICAgfSBlbHNlIGlmIChwYXRoLl9vcmlnaW5hbFBvaW50cykgeyAvLyBldmVyeXRoaW5nIGVsc2VcbiAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHBhdGguX29yaWdpbmFsUG9pbnRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGxhdGxuZyA9IHBhdGguX2xhdGxuZ3NbaV07XG4gICAgICAgIHBhdGguX2xhdGxuZ3NbaV0gPSBwcm9qZWN0aW9uXG4gICAgICAgICAgLnVucHJvamVjdChwcm9qZWN0aW9uLnByb2plY3QobGF0bG5nKS5fYWRkKGRpZmYpKTtcbiAgICAgICAgcGF0aC5fb3JpZ2luYWxQb2ludHNbaV0uX2FkZChweCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gaG9sZXMgb3BlcmF0aW9uc1xuICAgIGlmIChwYXRoLl9ob2xlcykge1xuICAgICAgZm9yIChpID0gMCwgbGVuID0gcGF0aC5faG9sZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IDAsIGxlbjIgPSBwYXRoLl9ob2xlc1tpXS5sZW5ndGg7IGogPCBsZW4yOyBqKyspIHtcbiAgICAgICAgICBsYXRsbmcgPSBwYXRoLl9ob2xlc1tpXVtqXTtcbiAgICAgICAgICBwYXRoLl9ob2xlc1tpXVtqXSA9IHByb2plY3Rpb25cbiAgICAgICAgICAgIC51bnByb2plY3QocHJvamVjdGlvbi5wcm9qZWN0KGxhdGxuZykuX2FkZChkaWZmKSk7XG4gICAgICAgICAgcGF0aC5faG9sZVBvaW50c1tpXVtqXS5fYWRkKHB4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGNvbnNvbGUudGltZUVuZCgndHJhbnNmb3JtJyk7XG5cbiAgICBwYXRoLl91cGRhdGVQYXRoKCk7XG4gIH1cblxufSk7XG5cblxuLy8gSW5pdCBob29rIGluc3RlYWQgb2YgcmVwbGFjaW5nIHRoZSBgaW5pdEV2ZW50c2BcbkwuUGF0aC5hZGRJbml0SG9vayhmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMub3B0aW9ucy5kcmFnZ2FibGUpIHtcbiAgICBpZiAodGhpcy5kcmFnZ2luZykge1xuICAgICAgdGhpcy5kcmFnZ2luZy5lbmFibGUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kcmFnZ2luZyA9IG5ldyBMLkhhbmRsZXIuUGF0aERyYWcodGhpcyk7XG4gICAgICB0aGlzLmRyYWdnaW5nLmVuYWJsZSgpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0aGlzLmRyYWdnaW5nKSB7XG4gICAgdGhpcy5kcmFnZ2luZy5kaXNhYmxlKCk7XG4gIH1cbn0pO1xuXG4vKlxuICogUmV0dXJuIHRyYW5zZm9ybWVkIHBvaW50cyBpbiBjYXNlIGlmIGRyYWdnaW5nIGlzIGVuYWJsZWQgYW5kIGluIHByb2dyZXNzLFxuICogb3RoZXJ3aXNlIC0gY2FsbCBvcmlnaW5hbCBtZXRob2QuXG4gKlxuICogRm9yIEwuQ2lyY2xlIGFuZCBMLlBvbHlsaW5lXG4gKi9cblxuLy8gZG9uJ3QgbGlrZSB0aGlzPyBtZSBuZWl0aGVyLCBidXQgSSBsaWtlIGl0IGV2ZW4gbGVzc1xuLy8gd2hlbiB0aGUgb3JpZ2luYWwgbWV0aG9kcyBhcmUgbm90IGV4cG9zZWRcbkwuQ2lyY2xlLnByb3RvdHlwZS5fZ2V0TGF0TG5nID0gTC5DaXJjbGUucHJvdG90eXBlLmdldExhdExuZztcbkwuQ2lyY2xlLnByb3RvdHlwZS5nZXRMYXRMbmcgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuZHJhZ2dpbmcgJiYgdGhpcy5kcmFnZ2luZy5pblByb2dyZXNzKCkpIHtcbiAgICByZXR1cm4gdGhpcy5kcmFnZ2luZy5fdHJhbnNmb3JtUG9pbnQodGhpcy5fbGF0bG5nLCB0aGlzLmRyYWdnaW5nLl9tYXRyaXgpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB0aGlzLl9nZXRMYXRMbmcoKTtcbiAgfVxufTtcblxuXG5MLlBvbHlsaW5lLnByb3RvdHlwZS5fZ2V0TGF0TG5ncyA9IEwuUG9seWxpbmUucHJvdG90eXBlLmdldExhdExuZ3M7XG5MLlBvbHlsaW5lLnByb3RvdHlwZS5nZXRMYXRMbmdzID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmRyYWdnaW5nICYmIHRoaXMuZHJhZ2dpbmcuaW5Qcm9ncmVzcygpKSB7XG4gICAgdmFyIG1hdHJpeCA9IHRoaXMuZHJhZ2dpbmcuX21hdHJpeDtcbiAgICB2YXIgcG9pbnRzID0gdGhpcy5fZ2V0TGF0TG5ncygpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBwb2ludHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHBvaW50c1tpXSA9IHRoaXMuZHJhZ2dpbmcuX3RyYW5zZm9ybVBvaW50KHBvaW50c1tpXSwgbWF0cml4KTtcbiAgICB9XG4gICAgcmV0dXJuIHBvaW50cztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0TGF0TG5ncygpO1xuICB9XG59O1xuIiwiLyoqXG4gKiBNYXRyaXggdHJhbnNmb3JtIHBhdGggZm9yIFNWRy9WTUxcbiAqIFRPRE86IGFkYXB0IHRvIExlYWZsZXQgMC44IHVwb24gcmVsZWFzZVxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG5pZiAoTC5Ccm93c2VyLnN2ZykgeyAvLyBTVkcgdHJhbnNmb3JtYXRpb25cblxuICBMLlBhdGguaW5jbHVkZSh7XG5cbiAgICAvKipcbiAgICAgKiBSZXNldCB0cmFuc2Zvcm0gbWF0cml4XG4gICAgICovXG4gICAgX3Jlc2V0VHJhbnNmb3JtOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX2NvbnRhaW5lci5zZXRBdHRyaWJ1dGVOUyhudWxsLCAndHJhbnNmb3JtJywgJycpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBcHBsaWVzIG1hdHJpeCB0cmFuc2Zvcm1hdGlvbiB0byBTVkdcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxOdW1iZXI+fSBtYXRyaXhcbiAgICAgKi9cbiAgICBfYXBwbHlUcmFuc2Zvcm06IGZ1bmN0aW9uKG1hdHJpeCkge1xuICAgICAgdGhpcy5fY29udGFpbmVyLnNldEF0dHJpYnV0ZU5TKG51bGwsIFwidHJhbnNmb3JtXCIsXG4gICAgICAgICdtYXRyaXgoJyArIG1hdHJpeC5qb2luKCcgJykgKyAnKScpO1xuICAgIH1cblxuICB9KTtcblxufSBlbHNlIHsgLy8gVk1MIHRyYW5zZm9ybSByb3V0aW5lc1xuXG4gIEwuUGF0aC5pbmNsdWRlKHtcblxuICAgIC8qKlxuICAgICAqIFJlc2V0IHRyYW5zZm9ybSBtYXRyaXhcbiAgICAgKi9cbiAgICBfcmVzZXRUcmFuc2Zvcm06IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuX3NrZXcpIHtcbiAgICAgICAgLy8gc3VwZXIgaW1wb3J0YW50ISB3b3JrYXJvdW5kIGZvciBhICdqdW1waW5nJyBnbGl0Y2g6XG4gICAgICAgIC8vIGRpc2FibGUgdHJhbnNmb3JtIGJlZm9yZSByZW1vdmluZyBpdFxuICAgICAgICB0aGlzLl9za2V3Lm9uID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2NvbnRhaW5lci5yZW1vdmVDaGlsZCh0aGlzLl9za2V3KTtcbiAgICAgICAgdGhpcy5fc2tldyA9IG51bGw7XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFwcGxpZXMgbWF0cml4IHRyYW5zZm9ybWF0aW9uIHRvIFZNTFxuICAgICAqIEBwYXJhbSB7QXJyYXkuPE51bWJlcj59IG1hdHJpeFxuICAgICAqL1xuICAgIF9hcHBseVRyYW5zZm9ybTogZnVuY3Rpb24obWF0cml4KSB7XG4gICAgICB2YXIgc2tldyA9IHRoaXMuX3NrZXc7XG5cbiAgICAgIGlmICghc2tldykge1xuICAgICAgICBza2V3ID0gdGhpcy5fY3JlYXRlRWxlbWVudCgnc2tldycpO1xuICAgICAgICB0aGlzLl9jb250YWluZXIuYXBwZW5kQ2hpbGQoc2tldyk7XG4gICAgICAgIHNrZXcuc3R5bGUuYmVoYXZpb3IgPSAndXJsKCNkZWZhdWx0I1ZNTCknO1xuICAgICAgICB0aGlzLl9za2V3ID0gc2tldztcbiAgICAgIH1cblxuICAgICAgLy8gaGFuZGxlIHNrZXcvdHJhbnNsYXRlIHNlcGFyYXRlbHksIGNhdXNlIGl0J3MgYnJva2VuXG4gICAgICB2YXIgbXQgPSBtYXRyaXhbMF0udG9GaXhlZCg4KSArIFwiIFwiICsgbWF0cml4WzFdLnRvRml4ZWQoOCkgKyBcIiBcIiArXG4gICAgICAgIG1hdHJpeFsyXS50b0ZpeGVkKDgpICsgXCIgXCIgKyBtYXRyaXhbM10udG9GaXhlZCg4KSArIFwiIDAgMFwiO1xuICAgICAgdmFyIG9mZnNldCA9IE1hdGguZmxvb3IobWF0cml4WzRdKS50b0ZpeGVkKCkgKyBcIiwgXCIgK1xuICAgICAgICBNYXRoLmZsb29yKG1hdHJpeFs1XSkudG9GaXhlZCgpICsgXCJcIjtcblxuICAgICAgdmFyIHMgPSB0aGlzLl9jb250YWluZXIuc3R5bGU7XG4gICAgICB2YXIgbCA9IHBhcnNlRmxvYXQocy5sZWZ0KTtcbiAgICAgIHZhciB0ID0gcGFyc2VGbG9hdChzLnRvcCk7XG4gICAgICB2YXIgdyA9IHBhcnNlRmxvYXQocy53aWR0aCk7XG4gICAgICB2YXIgaCA9IHBhcnNlRmxvYXQocy5oZWlnaHQpO1xuXG4gICAgICBpZiAoaXNOYU4obCkpIGwgPSAwO1xuICAgICAgaWYgKGlzTmFOKHQpKSB0ID0gMDtcbiAgICAgIGlmIChpc05hTih3KSB8fCAhdykgdyA9IDE7XG4gICAgICBpZiAoaXNOYU4oaCkgfHwgIWgpIGggPSAxO1xuXG4gICAgICB2YXIgb3JpZ2luID0gKC1sIC8gdyAtIDAuNSkudG9GaXhlZCg4KSArIFwiIFwiICsgKC10IC8gaCAtIDAuNSkudG9GaXhlZCg4KTtcblxuICAgICAgc2tldy5vbiA9IFwiZlwiO1xuICAgICAgc2tldy5tYXRyaXggPSBtdDtcbiAgICAgIHNrZXcub3JpZ2luID0gb3JpZ2luO1xuICAgICAgc2tldy5vZmZzZXQgPSBvZmZzZXQ7XG4gICAgICBza2V3Lm9uID0gdHJ1ZTtcbiAgICB9XG5cbiAgfSk7XG59XG5cbi8vIFJlbmRlcmVyLWluZGVwZW5kZW50XG5MLlBhdGguaW5jbHVkZSh7XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHRoZSBmZWF0dXJlIHdhcyBkcmFnZ2VkLCB0aGF0J2xsIHN1cHJlc3MgdGhlIGNsaWNrIGV2ZW50XG4gICAqIG9uIG1vdXNldXAuIFRoYXQgZml4ZXMgcG9wdXBzIGZvciBleGFtcGxlXG4gICAqXG4gICAqIEBwYXJhbSAge01vdXNlRXZlbnR9IGVcbiAgICovXG4gIF9vbk1vdXNlQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoKHRoaXMuZHJhZ2dpbmcgJiYgdGhpcy5kcmFnZ2luZy5tb3ZlZCgpKSB8fFxuICAgICAgKHRoaXMuX21hcC5kcmFnZ2luZyAmJiB0aGlzLl9tYXAuZHJhZ2dpbmcubW92ZWQoKSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9maXJlTW91c2VFdmVudChlKTtcbiAgfVxufSk7XG4iLCIvKipcbiAqIExlYWZsZXQuRWRpdGFibGUgZXh0ZW5zaW9uIGZvciBkcmFnZ2luZ1xuICogQGF1dGhvciBBbGV4YW5kZXIgTWlsZXZza2kgPGluZm9AdzhyLm5hbWU+XG4gKiBAcHJlc2VydmVcbiAqL1xuXG5cbkwuRWRpdGFibGUuaW5jbHVkZSh7XG5cblxuICBvcHRpb25zOiBMLlV0aWwuZXh0ZW5kKEwuRWRpdGFibGUucHJvdG90eXBlLm9wdGlvbnMsIHtcbiAgICBkcmFnZ2luZzogdHJ1ZVxuICB9KSxcblxuXG4gIC8qIGVzbGludC1kaXNhYmxlIG5ldy1jYXAgKi9cbiAgY3JlYXRlUG9seWxpbmU6IGZ1bmN0aW9uIChsYXRsbmdzKSB7XG4gICAgdmFyIGxpbmUgPSBuZXcgdGhpcy5vcHRpb25zLnBvbHlsaW5lQ2xhc3MobGF0bG5ncywge1xuICAgICAgZHJhZ2dhYmxlOiB0aGlzLm9wdGlvbnMuZHJhZ2dpbmcsXG4gICAgICBlZGl0T3B0aW9uczoge1xuICAgICAgICBlZGl0VG9vbHM6IHRoaXNcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLmZpcmVBbmRGb3J3YXJkKCdlZGl0YWJsZTpjcmVhdGVkJywge2xheWVyOiBsaW5lfSk7XG4gICAgcmV0dXJuIGxpbmU7XG4gIH0sXG5cblxuICBjcmVhdGVQb2x5Z29uOiBmdW5jdGlvbiAobGF0bG5ncykge1xuICAgIHZhciBwb2x5Z29uID0gbmV3IHRoaXMub3B0aW9ucy5wb2x5Z29uQ2xhc3MobGF0bG5ncywge1xuICAgICAgZHJhZ2dhYmxlOiB0aGlzLm9wdGlvbnMuZHJhZ2dpbmcsXG4gICAgICBlZGl0T3B0aW9uczoge1xuICAgICAgICBlZGl0VG9vbHM6IHRoaXNcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLmZpcmVBbmRGb3J3YXJkKCdlZGl0YWJsZTpjcmVhdGVkJywge2xheWVyOiBwb2x5Z29ufSk7XG4gICAgcmV0dXJuIHBvbHlnb247XG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBuZXctY2FwICovXG5cbn0pO1xuXG5cbkwuRWRpdGFibGUuUGF0aEVkaXRvci5pbmNsdWRlKHtcblxuICBvcHRpb25zOiB7XG4gICAgZHJhZ2dpbmc6IHRydWVcbiAgfSxcblxuICAvKipcbiAgICogSG9va3MgZHJhZ2dpbmcgaW5cbiAgICogQG92ZXJyaWRlXG4gICAqIEByZXR1cm4ge0wuRWRpdGFibGUuUGF0aEVkaXRvcn1cbiAgICovXG4gIGVuYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fZW5hYmxlKCk7XG4gICAgdGhpcy5mZWF0dXJlXG4gICAgICAub24oJ2RyYWdzdGFydCcsIHRoaXMuX29uRmVhdHVyZURyYWdTdGFydCwgdGhpcylcbiAgICAgIC5vbignZHJhZycsICAgICAgdGhpcy5fb25GZWF0dXJlRHJhZywgICAgICB0aGlzKVxuICAgICAgLm9uKCdkcmFnZW5kJywgICB0aGlzLl9vbkZlYXR1cmVEcmFnRW5kLCAgIHRoaXMpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIF9lbmFibGU6IEwuRWRpdGFibGUuUGF0aEVkaXRvci5wcm90b3R5cGUuZW5hYmxlLFxuXG5cbiAgLyoqXG4gICAqIEBvdmVycmlkZVxuICAgKiBAcmV0dXJuIHtMLkVkaXRhYmxlLlBhdGhFZGl0b3J9XG4gICAqL1xuICBkaXNhYmxlOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9kaXNhYmxlKCk7XG4gICAgdGhpcy5mZWF0dXJlXG4gICAgICAub2ZmKCdkcmFnc3RhcnQnLCB0aGlzLl9vbkZlYXR1cmVEcmFnU3RhcnQsIHRoaXMpXG4gICAgICAub2ZmKCdkcmFnJywgICAgICB0aGlzLl9vbkZlYXR1cmVEcmFnLCAgICAgIHRoaXMpXG4gICAgICAub2ZmKCdkcmFnZW5kJywgICB0aGlzLl9vbkZlYXR1cmVEcmFnRW5kLCAgIHRoaXMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBfZGlzYWJsZTogTC5FZGl0YWJsZS5QYXRoRWRpdG9yLnByb3RvdHlwZS5kaXNhYmxlLFxuXG5cbiAgLyoqXG4gICAqIEJhc2ljYWxseSwgcmVtb3ZlIHRoZSB2ZXJ0aWNlc1xuICAgKiBAcGFyYW0gIHtFdmVudH0gZXZ0XG4gICAqL1xuICBfb25GZWF0dXJlRHJhZ1N0YXJ0OiBmdW5jdGlvbihldnQpIHtcbiAgICB0aGlzLmZpcmVBbmRGb3J3YXJkKCdlZGl0YWJsZTpzaGFwZTpkcmFnc3RhcnQnLCBldnQpO1xuICAgIHRoaXMuZWRpdExheWVyLmNsZWFyTGF5ZXJzKCk7XG4gICAgdGhpcy5jb21taXREcmF3aW5nKCk7XG4gIH0sXG5cblxuICAvKipcbiAgICogSnVzdCBwcm9wYWdhdGUgdGhlIGV2ZW50XG4gICAqIEBwYXJhbSAge0V2ZW50fSBldnRcbiAgICovXG4gIF9vbkZlYXR1cmVEcmFnOiBmdW5jdGlvbihldnQpIHtcbiAgICB0aGlzLmZpcmVBbmRGb3J3YXJkKCdlZGl0YWJsZTpzaGFwZTpkcmFnJywgZXZ0KTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBKdXN0IHByb3BhZ2F0ZSB0aGUgZXZlbnRcbiAgICogQHBhcmFtICB7RXZlbnR9IGV2dFxuICAgKi9cbiAgX29uRmVhdHVyZURyYWdFbmQ6IGZ1bmN0aW9uKGV2dCkge1xuICAgIHRoaXMuZmlyZUFuZEZvcndhcmQoJ2VkaXRhYmxlOnNoYXBlOmRyYWdlbmQnLCBldnQpO1xuICAgIHRoaXMuaW5pdFZlcnRleE1hcmtlcnMoKTtcblxuICAgIC8vIGZvciB0aGUgY2lyY2xlXG4gICAgaWYgKHR5cGVvZiB0aGlzLnVwZGF0ZVJlc2l6ZUxhdExuZyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy51cGRhdGVSZXNpemVMYXRMbmcoKTtcbiAgICB9XG4gIH1cblxufSk7XG4iXX0=
