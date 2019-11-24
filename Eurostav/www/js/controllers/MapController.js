(function () {
  angular.module('starter')
    .controller('MapController', ['$http', '$cordovaGeolocation', 'localStorageService', 'cache', MapController]);

  function MapController($http, $cordovaGeolocation, localStorageService, cache) {
    var line = cache.getLines('map');
    
    if (!line.cached) {
      $http.get('http://77.240.101.171:3000/building/get?place=' + localStorageService.get('place'))
      .then(function (res) { cache.setLines('map', res.data.addresses, true); initMap(res.data.addresses) })
      .catch(function (err) { return console.error(err) });
    } else {
      initMap(line.content);
    }

    function initMap(addresses) {
      var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        draggable: true,
        disableDefaultUI: true,
        animation: google.maps.Animation.DROP,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      });
      var infoWindow = new google.maps.InfoWindow;
      
      map.setOptions({ styles: [{"featureType":"all","elementType":"labels","stylers":[{"visibility":"on"}]},{"featureType":"all","elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#000000"},{"lightness":40}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#000000"},{"lightness":16}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":17},{"weight":1.2}]},{"featureType":"administrative.country","elementType":"labels.text.fill","stylers":[{"color":"#e5c163"}]},{"featureType":"administrative.locality","elementType":"labels.text.fill","stylers":[{"color":"#c4c4c4"}]},{"featureType":"administrative.neighborhood","elementType":"labels.text.fill","stylers":[{"color":"#e5c163"}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":21},{"visibility":"on"}]},{"featureType":"poi.business","elementType":"geometry","stylers":[{"visibility":"on"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#e5c163"},{"lightness":"0"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"visibility":"off"}]},{"featureType":"road.highway","elementType":"labels.text.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"road.highway","elementType":"labels.text.stroke","stylers":[{"color":"#e5c163"}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":18}]},{"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"color":"#575757"}]},{"featureType":"road.arterial","elementType":"labels.text.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"road.arterial","elementType":"labels.text.stroke","stylers":[{"color":"#2c2c2c"}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":16}]},{"featureType":"road.local","elementType":"labels.text.fill","stylers":[{"color":"#999999"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":19}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":17}]}] });

      for (var i = 0; i < addresses.length; i++) {
        var dbmarker = addresses[i];
        var myLatlng = new google.maps.LatLng(dbmarker.cords[0], dbmarker.cords[1]);
        var marker = new google.maps.Marker({
          position: myLatlng,
          map: map,
          title: dbmarker.title
        });

        (function (marker) {
          google.maps.event.addListener(marker, 'click', function () {
            var lat = marker.getPosition().lat();
            var long = marker.getPosition().lng();

            if ((navigator.platform.indexOf("iPhone") != -1) ||
              (navigator.platform.indexOf("iPad") != -1) ||
              (navigator.platform.indexOf("iPod") != -1))
              window.open("maps://maps.google.com/maps?daddr=" + lat + "," + long + "&amp;ll=");
            else
              window.open("https://maps.google.com/maps?daddr=" + lat + "," + long + "&amp;ll=");
          });
        })(marker);
      }

      $cordovaGeolocation.getCurrentPosition().then(function (resp) {
        var pos = {
          lat: resp.coords.latitude,
          lng: resp.coords.longitude
        };

        infoWindow.setPosition(pos);
        infoWindow.setContent('<p style="color: black">Your location</p>');
        infoWindow.open(map);
        map.setCenter(pos);
      });
    }
  }
})();
