var editable = require('../../');
var MAPBOX_TOKEN = 'pk.eyJ1IjoidzhyIiwiYSI6IlF2Nlh6QVkifQ.D7BkmeoMI7GEkMDtg3durw';
var map = global.map = L.map('map', {
  editable: true
}).setView([31.2352, 121.4942], 15);
var osm = new L.TileLayer(
  'https://a.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}.png?access_token=' + MAPBOX_TOKEN);
map.addLayer(osm);

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
        window.LAYER = this.options.callback.call(map.editTools, null, {
          draggable: true
        });
    }, this);

    return container;
  }
});

L.NewLineControl = L.EditControl.extend({
  options: {
    position: 'topleft',
    callback: map.editTools.startPolyline,
    kind: 'line',
    html: '\\/\\'
  }
});

L.NewPolygonControl = L.EditControl.extend({
  options: {
    position: 'topleft',
    callback: map.editTools.startPolygon,
    kind: 'polygon',
    html: '▰'
  }
});

L.NewMarkerControl = L.EditControl.extend({
  options: {
    position: 'topleft',
    callback: map.editTools.startMarker,
    kind: 'marker',
    html: '🖈'
  }
});

L.NewRectangleControl = L.EditControl.extend({
  options: {
    position: 'topleft',
    callback: map.editTools.startRectangle,
    kind: 'rectangle',
    draggable: true,
    html: '⬛'
  }
});

L.NewCircleControl = L.EditControl.extend({
  options: {
    position: 'topleft',
    callback: map.editTools.startCircle,
    kind: 'circle',
    html: '⬤'
  }
});

[
  new L.NewMarkerControl(),
  new L.NewLineControl(), new L.NewPolygonControl(),
  new L.NewRectangleControl(), new L.NewCircleControl()
].forEach(map.addControl, map);
