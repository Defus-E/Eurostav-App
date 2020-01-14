(function () {
  angular.module('starter')
    .controller('HomeController', ['$scope', '$state', '$http', 'localStorageService', 'socket', 'cache', HomeController]);

  function HomeController($scope, $state, $http, localStorageService, socket, cache) {
    var self = this;
    var logo = $('.logo');
    var footer = $('footer');
    var li = $('footer li, ul.menu.tab-m li.tab-li');
    var reconn, count = 0;

    self.userId = localStorageService.get('userId');
    self.username = localStorageService.get('username');
    self.online = localStorageService.get('online');

    self.rooms = [];
    self.letters = [];
			
		li.on('click', function (e) {
      var actv = footer.find('.active');
      var url = $(this).attr('data-nav');

      logo.html('Euro<span>stav</span>');
      $(actv).removeClass('active');
      $('footer li[data-nav="' + url + '"]').addClass('active');
      $('.users').css('display', 'none');

      socket.removeListener('get:messages');
      socket.removeListener('get:message');

      if (url == 'chat') {
        socket.emit('join:room', true, 'public');
        $('.users').css('display', 'block');
      }
      
      $('.menu.panel').css('display', 'block');
      $('.go_back_tables').css('display', 'none');

      localStorageService.set('roomId', 'all');

      localStorageService.remove('newsId');
      localStorageService.remove('newsContent');
      localStorageService.remove('table_data');

      $state.go(url, { stateRoom: false, room: 'all' })
        .then(function () {
          li.css('pointer-events', 'none');
          setTimeout(function() {li.css('pointer-events', 'auto')}, 400)
        })
    });

    if (self.userId && self.username)
      $('.panel-heading').on('click', function() {
        var _this = this;

        $(_this).css('pointer-events', 'none');
        $(_this).next().slideToggle('slow', function() { $(_this).css('pointer-events', 'auto') });
      });

    $scope.getUsers = function() {
      count = 0;
      $http.get('http://77.240.101.171:3000/workers/list')
        .then(function (res) {
          var userId = localStorageService.get('userId');
          var users = res.data.users;
          var total = res.data.total;

          self.rooms = users.filter(function (user) { return user._id != userId });
          self.letters = self.rooms.map(function (el) { return el.username[0] });
          self.letters = self.letters.filter(function (el, pos) { return self.letters.indexOf(el) == pos });
          
          if (total > 10) {
            $('.loadMoreUsers').css('display', 'block');
          } else {
            $('.loadMoreUsers').css('display', 'none');
          }
        })
        .catch(function (err) { return console.error(err) });
    };

    $scope.login = function (login, password) {
      var data = {
        login: login,
        password: password
      };

      $http.post('http://77.240.101.171:3000/login/user', data)
        .then(function (res) {
          var user = res.data;
          var place = $('#place').val();

          $('.error').css('display', 'none');
          $('.name').text(user.username);
          $('input').val('');

          activeHeaders(true);

          localStorageService.set('userId', user.id);
          localStorageService.set('isAdmin', user.isAdmin);
          localStorageService.set('username', user.username);
          localStorageService.set('place', place);
          
          self.username = user.username;
          self.userId = user.id;

          var actv = footer.find('.active');

          $(actv).removeClass('active');
          $('li[data-nav="protect"]').addClass('active');

          socket.emit('auth', user.id, function (isUser) { 
            if (isUser) {
              $state.go('protect');
              $('.panel-heading').on('click', function() { $(this).next().slideToggle() });
            } else {
              activeHeaders(false);
    
              socket.emit('disconn');
              localStorage.clear();
    
              self.username = '';
              self.userId = '';
    
              cache.clear();
              $state.go('login');
            }
          });
        })
        .catch(function (err) {
          var error = err.data;
          var err_block = $('.error');

          err_block.css('display', 'block');
          err_block.text(error.reason);
        });
    };

    $scope.logout = function () {
      activeHeaders(false);

      socket.emit('disconn');
      localStorage.clear();

      self.username = '';
      self.userId = '';

      $('.panel-heading').off('click');

      cache.clear();
      socket.emit('logout');
      $state.go('login');
    }

    $scope.checkOnline = function (online, id) {
      if (!online) return;

      var isOnline = online.find(function (onl) { return onl == id });
      return isOnline ? 'online' : '';
    };

    $scope.uploadUsers = function() {
      count += 10;
      $http.post('http://77.240.101.171:3000/workers/upload', { count: count })
        .then(function (res) {
          var userId = localStorageService.get('userId');
          var users = res.data.workers;
          var total = res.data.total;
          var rooms = users.filter(function (user) { return user._id != userId });
          var letters = rooms.map(function (el) { return el.username[0] });
          
          self.online = localStorageService.get('online');

          letters = letters.filter(function (el, pos) { return letters.indexOf(el) == pos });
          letters = self.letters.concat(letters);
          letters = letters.filter(function (item, pos) {return letters.indexOf(item) == pos});

          self.letters = letters;
          self.rooms = self.rooms.concat(rooms);

          if (total)
            $('.loadMoreUsers').css('display', 'none');
        })
        .catch(function (err) { return console.error(err) });
    }

    $scope.openRoom = function (id, room) {
      $('.logo').text(room);

      self.current_room = room;
      self.roomId = id;

      localStorageService.set('roomId', id);
      localStorageService.set('room', room);

      socket.emit('join:room', false, id);
      $state.go('room', {
        stateRoom: true,
        room: id
      });
    };

    $scope.openGeneralRoomFor = function(roomId, psswd) {
      var data = {
        roomId: roomId,
        psswd: psswd
      };

      $http.post('http://77.240.101.171:3000/login/chat', data)
        .then(function (res) {
          $(footer.find('.active')).removeClass('active');
          logo.html(roomId);
    
          $('.users').css('display', 'block');
          $('.menu.panel').css('display', 'block');
          $('.go_back_tables').css('display', 'none');
          $('footer li[data-nav="chat"]').addClass('active');
    
          localStorageService.set('roomId', roomId);
          socket.emit('join:room', true, roomId);
    
          $('.panel-heading').next().slideToggle();
          $('#acc').removeClass('uk-offcanvas-overlay uk-open');
          
          setTimeout(function() {
            $('#acc uk-offcanvas-bar').removeClass('uk-offcanvas-bar-animation uk-offcanvas-slide');
            $('#acc').css('display', 'none');
          }, 500)
          $state.go('chat', { stateRoom: false, room: roomId })
        })
        .catch(function (err) { console.error(err) });
    }

    socket.on('conn', function (connectedSockets) {
      var list = connectedSockets.filter(function (socket) {
        return socket != self.userId
      });

      localStorageService.set('online', list);

      list.forEach(function (id) {
        var let_user = $('.let_users[data-let-id="' + id + '"]');
        $('span.online-mark', $(let_user)).removeClass('offline');
        $('span.online-mark', $(let_user)).addClass('online');
      });
    });

    socket.on('disconn', function (id) {
      if (!localStorageService.get('online')) return;

      var let_user = $('.let_users[data-let-id="' + id + '"]');
      var online = localStorageService.get('online');
      var index = online.indexOf(id);

      $('span.online-mark', $(let_user)).addClass('offline');
      $('span.online-mark', $(let_user)).removeClass('online');

      if (index >= 0)
        online.splice(index, 1);
      
      localStorageService.set('online', online);
		});

		socket.on('connect', function() {
      var userId = localStorageService.get('userId');

      $('.sendinp').prop('disabled', false);

      cache.setLines('safety', '', false);
      cache.setLines('tables', '', false);
      cache.setLines('news', '', false);
      cache.setLines('map', '', false);

      if (reconn) clearInterval(reconn);

      socket.emit('auth', userId, function (isUser) {
        if (!isUser) {
          activeHeaders(false);

          socket.emit('disconn');
          localStorage.clear();

          self.username = '';
          self.userId = '';

          $state.go('login');
        }
      });
		});

		socket.on('disconnect', function() {
      $('.sendinp').prop('disabled', true);

      cache.setLines('safety', '<h2><img src="/img/_WKJRwS0VEQ.jpg"><img src="/img/3B5b2cLV4wE.jpg"></h2><p><img src="/img/91TP99X9OrM.jpg"><img src="/img/6fJqDKZb0cs.jpg"></p><p><img src="/img/cNyuk-9HM6Q.jpg"><img src="/img/bCg8Gwm45R0.jpg"></p><p><img src="/img/cs4FuOKLz1s.jpg"></p><p><br></p><p><img src="/img/DZNUi5NH7kM.jpg"></p><p><img src="/img/eiwBHTMLO00.jpg"></p><p><br></p><p><img src="/img/HcjouCvIBGI.jpg"></p><p><img src="/img/j2-l0jSoqFY.jpg"><img src="/img/eymjt39tZ4M.jpg"></p><p><img src="/img/lsAy3heg6nE.jpg"></p><p><br></p><p><img src="/img/N9Ii6p6YdzY.jpg"></p><p><img src="/img/NPM_bBObef0.jpg"></p><p><img src="/img/SDhRH2DDpnA.jpg"></p>', true);

			reconn = setInterval(function() {
				socket.connect();
			}, 500);
    });

		function activeHeaders(bool) {
			var hides = $('.hf');

      if (bool) 
        return hides.removeClass('hide');
        
			hides.addClass('hide');
    }
  }
})();