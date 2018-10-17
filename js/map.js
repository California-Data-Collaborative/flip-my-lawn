function selectParcel(lat, lng, instance) {
  var latlng = {
    lat: lat,
    lng: lng
  };
  query = "\n  SELECT *\n  FROM ca_parcels_with_turf_data\n  WHERE\n  ST_Within(\n    ST_Transform(\n      ST_SetSRID(\n        ST_MakePoint(".concat(lng, ", ").concat(lat, "),\n        4326),\n        4326),\n        the_geom)\n        ");
  instance.$options.selectedParcelSource.setQuery(query);
  instance.$options.map.panTo(latlng);
  encoded_query = encodeURIComponent(query);
  url = "https://california-data-collaborative.carto.com/api/v2/sql?q=".concat(encoded_query);
  $.getJSON(url, function (data) {
    record = data.rows[0];

    if (record) {
      instance.data_available = true;
      instance.pet = record.pet_spatial_cimis;

      if (record.county != 'Ventura') {
        instance.ventura = false;
        instance.turf_area = record.turf_area_sf_cgu;
      } else {
        instance.ventura = true;
        instance.turf_area = 'No turf area data';
      }
    } else {
      instance.data_available = false;
      instance.turf_area = '';
      instance.pet = '';
      instance.home_address = 'No data for this yard...';
    }

    if (!instance.initialized) {
      instance.initialized = true;
    }
  });
}

function initializeMap(instance) {
  // Create Map
  instance.$options.map = L.map('map', {
    center: [34.0764536, -118.4300],
    zoom: 17,
    scrollWheelZoom: false,
    zoomControl: true // maxZoom: 18,
    // minZoom: 10

  }); // Pull basemap

  L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 23,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    // attribution: 'Powered by <a href="http://www.argolabs.org/">ARGO</a> | Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    attribution: 'Powered by <a href="http://www.argolabs.org/">ARGO</a>'
  }).addTo(instance.$options.map);
  var client = new carto.Client({
    apiKey: 'default_public',
    username: 'california-data-collaborative'
  });
  instance.$options.selectedParcelSource = new carto.source.SQL("\n          SELECT *\n          FROM ca_parcels_with_turf_data\n          LIMIT 0");
  var selectedParcelStyle = new carto.style.CartoCSS("\n            #layer {\n              opacity: 1;\n              polygon-fill: rgba(0,0,0,0);\n              line-color: #17a2b8;\n              line-width: 6;\n              polygon-smooth: 1;\n            }\n            ");
  var selectedParcel = new carto.layer.Layer(instance.$options.selectedParcelSource, selectedParcelStyle);
  client.addLayers([selectedParcel]);
  client.getLeafletLayer().addTo(instance.$options.map);
  instance.$options.map.on('click', function (e) {
    if (instance.map_is_clickable) {
      instance.$options.editableLayers.clearLayers(instance.$options.drawLayer);
      instance.area_is_custom = false;
      var _lat = e.latlng.lat;
      var _lng = e.latlng.lng; // update map and get area data from carto

      selectParcel(_lat, _lng, instance); // update home_address with google geocoder

      var latlng = {
        lat: _lat,
        lng: _lng
      };
      geocoder = new google.maps.Geocoder();
      geocoder.geocode({
        'location': latlng
      }, function (results, status) {
        if (instance.data_available) {
          instance.home_address = results[0].formatted_address;
        }
      });
    }
  });
}

function initializeDrawTool(instance) {
  instance.$options.editableLayers = new L.FeatureGroup();
  instance.$options.map.addLayer(instance.$options.editableLayers); // L.drawLocal.EditToolbar.Edit.disable()

  L.drawLocal.draw.toolbar.buttons.polygon = 'Draw polygons around the parts of your lawn you would like to convert';
  L.drawLocal.draw.handlers.polygon.tooltip.start = 'Click to start drawing your polygon around the part of your lawn you would like to convert';
  L.drawLocal.draw.handlers.polygon.tooltip.cont = 'Click to continue drawing your polygon';
  L.drawLocal.draw.handlers.polygon.tooltip.end = 'When you\'re ready, click the first point to finish and calculate estimates';
  var drawPluginOptions = {
    position: 'topleft',
    draw: {
      polygon: {
        allowIntersection: false,
        showArea: false,
        feet: true,
        metric: false,
        // repeatMode: true,
        drawError: {
          color: '#dc3545',
          message: '<strong>Oh snap!<strong> you can\'t draw that!'
        },
        shapeOptions: {
          color: '#28a745',
          weight: 3,
          opacity: 1,
          fillOpacity: .75
        }
      },
      polyline: false,
      circle: false,
      rectangle: false,
      marker: false,
      circlemarker: false
    }
  };
  var drawControl = new L.Control.Draw(drawPluginOptions);
  instance.$options.map.addControl(drawControl);
  instance.$options.map.on('draw:drawstart', function (e) {
    instance.map_is_clickable = false;
  });
  instance.$options.map.on('draw:drawstop', function (e) {
    instance.map_is_clickable = true;
  });
  instance.$options.map.on('draw:created', function (e) {
    if (!instance.data_available) {
      $('#not_so_fast_modal').modal('show');
      return;
    }

    instance.$options.drawLayer = e.layer;
    instance.$options.editableLayers.addLayer(instance.$options.drawLayer);
    var custom_area = L.GeometryUtil.geodesicArea(instance.$options.drawLayer.getLatLngs()[0]) * 10.7639;

    if (!instance.area_is_custom) {
      instance.turf_area = 0;
      instance.area_is_custom = true;
    }

    instance.turf_area += custom_area;
    lat = instance.$options.drawLayer.getBounds().getCenter().lat;
    lng = instance.$options.drawLayer.getBounds().getCenter().lng;
    custom_area_for_display = "".concat(Math.round(custom_area).toLocaleString(), " sqft");
    instance.$options.drawLayer.bindPopup(custom_area_for_display);
    instance.$options.drawLayer.openPopup([lat, lng]);
  });
}
