# Leaflet.Editable.Drag [![npm version](https://badge.fury.io/js/leaflet-editable-drag.svg)](http://badge.fury.io/js/leaflet-editable-drag)

Feature dragging functionality for [Leaflet.Editable](https://github.com/Leaflet/Leaflet.Editable)

#### Usage

1. Include:
```js
require('leaflet-editable');
require('leaflet-path-drag');
require('leaflet-editable-drag');
```

or

```html
<script type="text/javascript" src="path/to/Leaflet.Editable.js"></script>
<!-- packed together with L.Path.Drag -->
<script type="text/javascript" src="path/to/dist/L.Editable.Drag.js"></script>
```
**Beware of the versions:** Rectangle editing and drawing support is only on `gh-pages`
branch of `Leaflet.Editable`

2. Ensure your features are draggable:

```js
// this will be passed to the constructor
map.editTools.startPolygon(null, { draggable: true });
```

#### Contributing

`leaflet-0.7` branch is for the older version of `leaflet` and `leaflet-editable`

```sh
git clone https://github.com/w8r/Leaflet.Editable.Drag.git
cd Leaflet.Editable.Drag
npm i
npm start
...
npm run build
```

#### Thanks
Thanks to @yohanboniface for the wonderful and configurable `Leaflet.Editable`.

#### License

`Leaflet.Editable.Drag` is released under the **WTFPL** licence.
