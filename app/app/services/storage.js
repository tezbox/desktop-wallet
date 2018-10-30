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
        r.data = v;
        if (typeof k != 'undefined') r.keys = k;
        return window.keytar.setPassword("tezbox", "tbstore", JSON.stringify(v));
    };
    r.loadStore = function(){
      return new Promise(function(resolve, reject){
        if (r.loaded) resolve(r.data.ensk);
        else {
          window.keytar.getPassword("tezbox", "tbstore").then(function(dd){
            r.loaded = true;
            var dd = JSON.parse(dd);
            if (dd){
              r.data = dd;            
              resolve(r.data.ensk);
            } else {
              resolve(false);
            }
          });
        }
      });
    };
    r.clearStore = function(){
      r.keys = {};
      r.data = false;
      return window.keytar.deletePassword("tezbox", "tbstore");
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
