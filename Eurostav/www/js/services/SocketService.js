(function(){
	angular.module('starter')
		.service('socket', ['socketFactory', socket]);

	function socket(socketFactory){
		 return socketFactory({
			  ioSocket: io.connect('http://77.240.101.171:3000', {
					reconnect: false
				})
		 });
	}
})();