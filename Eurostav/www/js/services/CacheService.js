(function(){
	angular.module('starter')
		.service('cache', [cache]);

	function cache() {
    this.cacheLine = {
      safety: {
        cached: false,
        content: ''
      },
      tables: {
        cached: false,
        content: ''
      },
      news: {
        cached: false,
        content: ''
      },
      map: {
        cached: false,
        content: ''
      }
    }

    this.getLines = function(page) {
      return this.cacheLine[page];
    }

    this.setLines = function(page, content, bool) {
      this.cacheLine[page].cached = bool;
      this.cacheLine[page].content = content;
    }

    this.clear = function() {
      this.cacheLine.news.cashed = false;
      this.cacheLine.map.cashed = false;
      this.cacheLine.tables.cashed = false;
      this.cacheLine.safety.cashed = false;
    }
	}
})();