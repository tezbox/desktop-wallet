app.service('Storage', function() {
    
    var r = {};
    
    r.loaded = false;
    r.data = false;
    
    r.keys = {};
    r.settings = {};
    r.password = '';
    r.restored = false;
    r.ico = false;
    
    r.load = function(){
      return new Promise(function(resolve, reject){
        r.loadSetting();
        r.loadStore().then(resolve);
      });
    }
    r.setStore = function(v, k, p){
        localStorage.setItem('tbstore', JSON.stringify(v));
        if (typeof k != 'undefined') r.keys = k;
    };
    r.loadStore = function(){
      return new Promise(function(resolve, reject){
        if (r.loaded) resolve(r.ensk);
        else {
          r.loaded = true;
          console.log("Loaded");
          r.data = JSON.parse(localStorage.getItem('tbstore'));
          resolve(r.ensk);
        }
      });
    };
    r.clearStore = function(){
      r.keys = {};
      var s = r.loadSetting();
      localStorage.clear();
      r.setSetting(s);
    };
    r.setSetting = function(v){
      r.settings = v;
      localStorage.setItem('tbsetting', JSON.stringify(v));
    };
    r.loadSetting = function(){
      r.settings = JSON.parse(localStorage.getItem('tbsetting'));
      return r.settings;
    };
    return r;
});
