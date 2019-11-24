(function () {
  angular.module('starter')
    .controller('RoomController', ['$scope', '$stateParams', '$cordovaCamera', '$cordovaFile', '$cordovaFileTransfer', '$cordovaDevice', '$ionicPopup', '$cordovaActionSheet', '$state', '$http', 'localStorageService', 'socket', 'moment', RoomController]);

  function RoomController($scope, $stateParams, $cordovaCamera, $cordovaFile, $cordovaFileTransfer, $cordovaDevice, $ionicPopup, $cordovaActionSheet, $state, $http, localStorageService, socket, moment) {
    var self = this;
    var canUpload = true;
    var currentUser = localStorageService.get('username');
    var userId = localStorageService.get('userId');
    var stateRoomData = {};

    self.current_room = localStorageService.get('room');
    self.roomId = localStorageService.get('roomId');
    self.isAdmin = localStorageService.get('isAdmin');

    self.messages = [];

    if ($stateParams.stateRoom == 'false') { 
      stateRoomData.idSender = userId;
    } else {
      stateRoomData.idSender = userId;
    }

    stateRoomData.idReciever = $stateParams.room;

    $http.post('http://77.240.101.171:3000/archive/get', stateRoomData)
      .then(getMessages)
      .catch(function(err) {
        $('.chat-window').html('<div style="margin-top:65%;left:50%;transform:translate(-50%,-50%);position:absolute;font-size:19px;color:#b7b7b7;">Нет соединения...</div>')
      });

    $scope.uploadMessages = function () {
      self.roomId = localStorageService.get('roomId');

      var roomId = self.roomId == 'all' ? 'all' : self.roomId == 'czech' || self.roomId == 'slovakia' ? self.roomId : generateRoomId(userId, self.roomId)
      var data = { roomId: roomId };

      if (!canUpload) return;
      canUpload = false;

      $http.post('http://77.240.101.171:3000/archive/upload', data)
        .then(function (res) {
          var msgs = res.data.messages;
          var total = res.data.total;

          self.messages = msgs.concat(self.messages);

          if (total) {
            $('.loadmore').fadeOut(200);
          } else {
            $('.loadmore').show();
          }

          canUpload = true;
        })
        .catch(function (err) { return console.error(err) });
    };
 
    $scope.showAlert = function(title, msg) {
      var alertPopup = $ionicPopup.alert({
        title: title,
        template: msg
      });
    };

    $scope.loadImage = function(pub) {
      var options = {
        title: 'Выберите ресурс',
        buttonLabels: ['Галерея', 'Камера'],
        addCancelButtonWithLabel: 'Cancel',
        androidEnableCancelButton : true,
      };

      $cordovaActionSheet.show(options).then(function(btnIndex) {
        var type = null;
        if (btnIndex === 1) {
          type = Camera.PictureSourceType.PHOTOLIBRARY;
        } else if (btnIndex === 2) {
          type = Camera.PictureSourceType.CAMERA;
        }
        if (type !== null) {
          selectPicture(type, pub);
        }
      });
    };

    function uploadFile(image, pub) {
      var url = "http://77.240.101.171:3000/loadImage/chat";
      var targetPath = pathForImage(image);
      var filename = image;;
    
      var options = {
        fileKey: "file",
        fileName: filename,
        chunkedMode: false,
        mimeType: "multipart/form-data",
        params : {'fileName': filename}
      };
    
      $cordovaFileTransfer.upload(url, targetPath, options).then(function(result) {
        var res = JSON.parse(result.response);
        var msg = {
          'salt': Math.random() + '',
          'sender': currentUser,
          'text': res.pathImg,
          'image': true,
          'time': moment().format('LT')
        };

        self.messages.push(msg);
        socket.emit('send:message', pub, msg);
        $(".app-content").animate({ scrollTop: $('.app-content').prop("scrollHeight") }, 1000);
      });
    }

    $scope.isNotCurrentUser = function (user) {
      return currentUser != user ? 'he' : 'you';
    };

    $scope.deleteMessage = function (pub, salt) {
      var index = self.messages.findIndex(function (msg) { return msg.salt === salt });
      
      if (index >= 0)
        self.messages.splice(index, 1);

      socket.emit('remove:message', pub, salt);
    };

    $scope.sendMessage = function (pub) {
      if (!self.text) return;

      var msg = {
        'salt': Math.random() + '',
        'sender': currentUser,
        'text': self.text,
        'image': false,
        'time': moment().format('LT')
      };

      self.messages.push(msg);
      self.text = '';

      $('.sendinp').prop('disabled', true);

      socket.emit('send:message', pub, msg);

      $(".app-content").animate({
        scrollTop: $('.app-content').prop("scrollHeight")
      }, 1000, function () {
        $('.sendinp').prop('disabled', false);
      });
    };

    socket.on('get:message', function (sender, msg) {
      self.roomId = localStorageService.get('roomId');

      if (sender == self.roomId) {
        var appDiv = $('.app-content');
        var isBottom = appDiv.outerHeight() + appDiv.scrollTop() + 10 >= appDiv.prop('scrollHeight');

        self.messages.push(msg);

        if (isBottom) {
          appDiv.animate({
            scrollTop: appDiv.prop('scrollHeight')
          }, 1000);
        }
      }
    });

    socket.on('remove:message', function (sender, salt) {
      self.roomId = localStorageService.get('roomId');
      
      if (sender == self.roomId) {
        var index = self.messages.findIndex(function (msg) { return msg.salt === salt });
        
        if (index >= 0) {
          self.messages.splice(index, 1);
        }
      }
    });

    function selectPicture(sourceType, pub) {
      var options = {
        quality: 100,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: sourceType,
        saveToPhotoAlbum: false
      };
    
      $cordovaCamera.getPicture(options).then(function(imagePath) {
        var currentName = imagePath.replace(/^.*[\\\/]/, '');
        var date = new Date();
        var name = date.getTime();
        var newFileName =  name + ".jpg";
    
        if ($cordovaDevice.getPlatform() == 'Android' && sourceType === Camera.PictureSourceType.PHOTOLIBRARY) {
          window.FilePath.resolveNativePath(imagePath, function(entry) {
            window.resolveLocalFileSystemURL(entry, success, fail);
            function fail(e) {
              console.error('Error: ', e);
            }
    
            function success(fileEntry) {
              var namePath = fileEntry.nativeURL.substr(0, fileEntry.nativeURL.lastIndexOf('/') + 1);
              $cordovaFile.copyFile(namePath, fileEntry.name, cordova.file.dataDirectory, newFileName).then(function(success){
                uploadFile(newFileName, pub);
              }, function(error){
                $scope.showAlert('Error', error.exception);
              });
            };
          }
        );
        } else {
          var namePath = imagePath.substr(0, imagePath.lastIndexOf('/') + 1);
          $cordovaFile.moveFile(namePath, currentName, cordova.file.dataDirectory, newFileName).then(function(success){
            uploadFile(newFileName, pub);
          }, function(error){
            $scope.showAlert('Error', error.exception);
          });
        }
      },
      function(err){
        // Not always an error, maybe cancel was pressed...
      });
    };

    function pathForImage(image) {
      if (image === null) {
        return '';
      } else {
        return cordova.file.dataDirectory + image;
      }
    };

    function getMessages(res) {
      var total = res.data.total;
      var messages = res.data.messages;
      var appDiv = $('.app-content');

      if (messages) {
        if (total) {
          $('.loadmore').hide();
        } else {
          $('.loadmore').show();
        }

        self.messages = messages;
        appDiv.animate({
          scrollTop: appDiv.prop('scrollHeight')
        }, 100);
      } else {
        $('.loadmore').hide();
        self.messages = [];
      }
    }
  }

  function generateRoomId(sender, reciever) {
    return {
      sr: `${sender}&&${reciever}`,
      rs: `${reciever}&&${sender}`
    };
  }
})();
