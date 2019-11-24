(function() {
  angular.module('starter')
    .controller('TablesController', ['$scope', '$stateParams', '$state', '$http', 'localStorageService', 'cache', TablesController]);

    function TablesController($scope, $stateParams, $state, $http, localStorageService, cache) {
      var self = this;
      var line = cache.getLines('tables');
      
      self.current_user = localStorageService.get('username');
      self.addr_date = localStorageService.get('addr_date');
      self.userId = localStorageService.get('userId');
      self.date = localStorageService.get('date');
      $scope.info = $stateParams;

      self.tables = [];
      self.addresses = [];

      if ($stateParams.table) {
        $http.get('http://77.240.101.171:3000/building/get?place=' + localStorageService.get('place'))
          .then(function(res) {
            var data = res.data;
            self.addresses = data.addresses;
            setTimeout(() => {
              selectCrane($stateParams.address);
              self.title = $stateParams.address;
              $('select#address').val($stateParams.address);
              $('select#cranes').val($stateParams.crane);
            }, 500);
          })
          .catch(function(err) {return console.error(err)});
      } else if (!line.cached) {
        $http.get('http://77.240.101.171:3000/tables/list')
          .then(function(res) {
            var tables = res.data.tables;
            self.tables = tables;
            cache.setLines('tables', tables, true);
          })
          .catch(function(err) {return console.error(err)});
      } else {
        self.tables = line.content;
      }
      
      $scope.addTable = addTable;
      $scope.selectCrane = selectCrane;
      $scope.formatDate = formatDate;
      $scope.openTableForm = openTableForm;

      function addTable(date, phone, title) {
        var type = $('.cranes_types').val();
        var coming = $('.coming').val();
        var leaving = $('.leaving').val();
        var lunch = $('.lunch').val();
        
        if (!phone || !title || !type || !coming || !leaving) {
          $('.success').text('');
          $('.error').text('Данные введены некорректно.');
          return;
        }

        if (lunch !== '' && typeof lunch !== 'string') {
          var time_l = new Date(lunch);
          var hours = time_l.getHours();
          var minutes = time_l.getMinutes;

          lunch = hours + ':' + minutes + ':00';
        }
          
        var data = {
          date: date,
          table_d: {
            _id: self.userId,
            username: self.current_user,
            phone: phone, 
            address: title, 
            crane: type,
            coming: coming, 
            leaving: leaving, 
            lunch: lunch
          }
        }

        $http.post('http://77.240.101.171:3000/tables/add', data)
          .then(function() {
            $('.success').text('Добавлено!');
            $('.error').text('');
          })
          .catch(function(err) {return console.error(err)});

        setTimeout(() => {
          $('.success').text('');
          $('.error').text('');
        }, 3000);
      }

      function formatDate(date) {
        var monthNames = [
          "Январь", "Февраль", "Март",
          "Апрель", "Май", "Июнь", "Июль",
          "Август", "Сентябрь", "Октябрь",
          "Ноябрь", "Декабрь"
        ];
        
        var day = new Date(date).getDate();
        var monthIndex = new Date(date).getMonth();

        day = day < 10 ? '0' + day : day;
      
        return day + ' ' + monthNames[monthIndex];
      }

      function openTableForm(addr_date, date) {
        var id = localStorageService.get('userId');

        localStorageService.set('addr_date', addr_date);
        localStorageService.set('date', date);

        $http.post('http://77.240.101.171:3000/tables/info', { id: id, date: date })
          .then(function(res) {
            var info = res.data.info;
            if (!info) {
              $state.go('table', { table: true });
            } else {
              info.table = true;
              $state.go('table', info);
            }
          })
          .catch(function(err) {return console.error(err)});
      }

      function selectCrane(title) {
        var address = self.addresses.find(function(addr) {return addr.title === title});
        
        if (!address) return false;

        $('.cranes_types').attr('disabled', false);
        $('.cranes_types').empty();
        
        address.cranes.marks.forEach(function(mark, idx) {
          $('.cranes_types').append(`<option value="${mark} - ${address.cranes.series[idx]}">${mark} - ${address.cranes.series[idx]}</option>`);
        });
      }
    }
})();