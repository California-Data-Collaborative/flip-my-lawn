"use strict";

function addPlaceListener(instance, ref) {
  instance[ref].addListener('place_changed', function () {
    var place = instance[ref].getPlace();
    var lat = place.geometry.location.lat();
    var lng = place.geometry.location.lng();
    selectParcel(lat, lng, instance);
  });
}

function initializeAddressSearch(instance) {
  instance.autocomplete0 = new google.maps.places.Autocomplete(instance.$refs.autocomplete0, {
    types: ['geocode']
  });
  instance.autocomplete1 = new google.maps.places.Autocomplete(instance.$refs.autocomplete1, {
    types: ['geocode']
  });
  instance.autocomplete2 = new google.maps.places.Autocomplete(instance.$refs.autocomplete2, {
    types: ['geocode']
  });
  instance.autocomplete3 = new google.maps.places.Autocomplete(instance.$refs.autocomplete3, {
    types: ['geocode']
  });
  addPlaceListener(instance, 'autocomplete0');
  addPlaceListener(instance, 'autocomplete1');
  addPlaceListener(instance, 'autocomplete2');
  addPlaceListener(instance, 'autocomplete3');
}