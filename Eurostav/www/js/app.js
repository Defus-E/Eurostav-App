angular.module('starter', ['ionic', 'ngCordova', 'LocalStorageModule', 'btford.socket-io', 'angularMoment', 'ui'])
  .run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
      $ionicPlatform.onHardwareBackButton(function (e) {
        navigator.app.exitApp();
      });

      if (window.cordova && window.Keyboard) {
        window.Keyboard.hideKeyboardAccessoryBar(true);
      }

      if (window.StatusBar) {
        StatusBar.styleBlackTranslucent();
      }
    });
  })
  .config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('login', {
        url: '/login',
        cache: false,
        templateUrl: 'templates/login.html'
      })
      .state('protect', {
        url: '/protect',
        cache: true,
        templateUrl: 'templates/protect.html'
      })
      .state('news', {
        url: '/news',
        cache: false,
        templateUrl: 'templates/news.html'
      })
      .state('news-page', {
        url: '/news-page',
        cache: false,
        templateUrl: 'templates/news-page.html'
      })
      .state('tables', {
        url: '/tables',
        cache: false,
        templateUrl: 'templates/tables.html'
      })
      .state('table', {
        url: '/table/:address/:coming/:leaving/:login/:crane/:day/:lunch/:_id/:phone/:username/:table',
        cache: false,
        templateUrl: 'templates/table.html'
      })
      .state('chat', {
        url: '/chat/:stateRoom/:room',
        cache: false,
        templateUrl: 'templates/chat.html'
      })
      .state('room', {
        url: '/room/:stateRoom/:room',
        cache: false,
        templateUrl: 'templates/room.html'
      })
      .state('map', {
        url: '/map',
        cache: true,
        templateUrl: 'templates/map.html'
      });
      
    if (localStorage.getItem('ls.username')) {
      $('.hf').removeClass('hide');
      $urlRouterProvider.otherwise('/protect');
    } else {
      $urlRouterProvider.otherwise('/login');
    }
  });