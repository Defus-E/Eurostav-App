$(document).ready(function () {
  let place = $('#map').attr('data-place');

  $.ajax({
    url: '/building/get?place=' + place,
    type: 'GET',
    statusCode: {
      200: addresses => initialize(addresses, place)
    }
  });
});

function initialize({ addresses }, place) {
  let lat = place == 'Чехия' ? '50.0755' : '48.1486';
  let lng = place == 'Чехия' ? '14.4378' : '17.1077';
  let center = new google.maps.LatLng(lat, lng);

  const block = document.getElementById('map');
  const map = new google.maps.Map(block, {
    zoom: 12,
    center: center,
    draggable: true,
    disableDefaultUI: true,
    animation: google.maps.Animation.DROP,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });
  const infoWindow = new google.maps.InfoWindow;
  
  map.setOptions({
    styles: [{ "featureType": "all", "elementType": "labels", "stylers": [{ "visibility": "on" }] }, { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "saturation": 36 }, { "color": "#000000" }, { "lightness": 40 } ] }, { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "visibility": "on" }, { "color": "#000000" }, { "lightness": 16 } ] }, { "featureType": "all", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] }, { "featureType": "administrative", "elementType": "geometry.fill", "stylers": [{ "color": "#000000" }, { "lightness": 20 } ] }, { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#000000" }, { "lightness": 17 }, { "weight": 1.2 } ] }, { "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [{ "color": "#e5c163" }] }, { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#c4c4c4" }] }, { "featureType": "administrative.neighborhood", "elementType": "labels.text.fill", "stylers": [{ "color": "#e5c163" }] }, { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#000000" }, { "lightness": 20 } ] }, { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#000000" }, { "lightness": 21 }, { "visibility": "on" } ] }, { "featureType": "poi.business", "elementType": "geometry", "stylers": [{ "visibility": "on" }] }, { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#e5c163" }, { "lightness": "0" } ] }, { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "visibility": "off" }] }, { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#ffffff" }] }, { "featureType": "road.highway", "elementType": "labels.text.stroke", "stylers": [{ "color": "#e5c163" }] }, { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#000000" }, { "lightness": 18 } ] }, { "featureType": "road.arterial", "elementType": "geometry.fill", "stylers": [{ "color": "#575757" }] }, { "featureType": "road.arterial", "elementType": "labels.text.fill", "stylers": [{ "color": "#ffffff" }] }, { "featureType": "road.arterial", "elementType": "labels.text.stroke", "stylers": [{ "color": "#2c2c2c" }] }, { "featureType": "road.local", "elementType": "geometry", "stylers": [{ "color": "#000000" }, { "lightness": 16 } ] }, { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#999999" }] }, { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#000000" }, { "lightness": 19 } ] }, { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }, { "lightness": 17 } ] } ]
  });

  for (let i = 0; i < addresses.length; i++) {
    let dbmarker = addresses[i];
    let myLatlng = new google.maps.LatLng(dbmarker.cords[0], dbmarker.cords[1]);
    let marker = new google.maps.Marker({
      position: myLatlng,
      map: map,
      title: dbmarker.title
    });

    (function (marker) {
      google.maps.event.addListener(marker, 'click', () => {
        let lat = marker.getPosition().lat();
        let long = marker.getPosition().lng();

        window.open("https://maps.google.com/maps?daddr=" + lat + "," + long + "&amp;ll=");
      });
    })(marker);
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      let pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      infoWindow.setPosition(pos);
      infoWindow.setContent('<span style="color: black">Your location</span>');
      infoWindow.open(map);
      map.setCenter(pos);
    }, function() {
      handleLocationError(true, infoWindow, center);
    });
  } else {
    handleLocationError(false, infoWindow, center);
  }
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
    'Error: The Geolocation service failed.' :
    'Error: Your browser doesn\'t support geolocation.');
  infoWindow.open(map);
}