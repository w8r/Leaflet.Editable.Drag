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
        window.LAYER = this.options.callback(null, {});
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

L.NewRectangleControl = L.EditControl.extend({
  options: {
    position: 'topleft',
    callback: L.Util.bind(map.editTools.startRectangle, map.editTools),
    kind: 'rectangle',
    draggable: true,
    html: '⬛'
  }
});

L.NewCircleControl = L.EditControl.extend({
  options: {
    position: 'topleft',
    callback: L.Util.bind(map.editTools.startCircle, map.editTools),
    kind: 'circle',
    html: '⬤'
  }
});

[
  new L.NewMarkerControl(),
  new L.NewLineControl(), new L.NewPolygonControl(),
  new L.NewRectangleControl(), new L.NewCircleControl()
].forEach(map.addControl, map);


var rect = L.rectangle(map.getBounds().pad(-0.25), {draggable: true}).addTo(map);
rect.enableEdit();
map.on('click', function(evt) { console.log('click', evt); });
