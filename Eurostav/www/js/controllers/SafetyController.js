(function() {
  angular.module('starter')
    .controller('SafetyController', ['$http', 'cache', SafetyController]);

    function SafetyController($http, cache) {
      var self = this;
      var line = cache.getLines('safety');
      
      if (line.cached) {
        self.content = line.content;
        return;
      }

      $http.get('http://77.240.101.171:3000/safety/content')
        .then(function(res) {
          var content = res.data.content;
          self.content = content;
          
          cache.setLines('safety', content, true);
        })
        .catch(function(err) {return console.error(err)});
    }
})();