(function() {
  angular.module('starter')
    .controller('NewsController', ['$state', '$scope', '$http', 'localStorageService', 'cache', NewsController]);

    function NewsController($state, $scope, $http, localStorageService, cache) {
      var self = this;
      var count = 0;
      var line = cache.getLines('news');
      
      self.newsTitle = localStorageService.get('newsTitle');
      self.content = localStorageService.get('newsContent');
      self.news = [];
      
      if (line.cached) {
        self.news = line.content;
      } else {
        $http.get('http://77.240.101.171:3000/news/get')
          .then(function(res) {
            var news = res.data.news;
            var isUploadNews = res.data.total_count;

            self.news = news;
            cache.setLines('news', news, true);

            if (isUploadNews <= 10) {
              $('.upload-news').css('display', 'none');
            } else {
              $('.upload-news').css('display', 'block');
            }
          })
          .catch(function(err) {return console.error(err)});
      }

      $scope.openNews = function(title, content) {
        localStorageService.set('newsTitle', title);
        localStorageService.set('newsContent', content);

        $state.go('news-page');
      }

      $scope.uploadNews = function() {
        count += 10;
        $http.post('http://77.240.101.171:3000/news/upload', { count: count })
          .then(function(res) {
            var news = res.data.news;
            var total = res.data.total_elements;
          
            self.news = self.news.concat(news);

            if (total)
              $('.upload-news').css('display', 'none');
          })
          .catch(function(err) {return console.error(err)});
      }

      $scope.formatDate = function(date) {
        var monthNames = [
          "Январь", "Февраль", "Март",
          "Апрель", "Май", "Июнь", "Июль",
          "Август", "Сентябрь", "Октябрь",
          "Ноябрь", "Декабрь"
        ];
        
        var day = new Date(date).getDate();
        var monthIndex = new Date(date).getMonth();
        var year = new Date(date).getFullYear();
      
        return day + ' ' + monthNames[monthIndex] + ' ' + year;
      }
    }
})();