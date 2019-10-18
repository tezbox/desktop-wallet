var Store = require('electron-store');
window.store = new Store();
app.service('Storage', function() {
  var r = {};
  var tempaccount = false, tempkey;
  r.newKey = false;
  r.storageVersion = 3;
  r.loaded = false;
  r.data = false;
  r.settings = {};
  
  r.keys = [];
  r.password = '';
  r.restored = false;
  r.ico = false;
  
  r.load = function(){
    if (!r.loaded){
      r.loadSetting();
      r.loadStore();
      r.updateStore();
      r.loaded = true;
    }
  }
  r.updateStore = function(){
    //V1 update
    if (!r.data) return;
    if (typeof r.data.version == 'undefined'){
      //Test - add storage version
      r.data.version = 1;
      r.setStore();
      console.log("Updated storage to version 1");
    }
    
    //v2 update
    if (r.data.version == 1){
      //Test - increment storage version
      r.data.version = 2;
      r.setStore();
      console.log("Updated storage to version 2");
    }
    
    //v3 update
    if (r.data.version == 2){
      //Actual first version increment
      //Multi-account change - migrate accounts to multiple array
      var tempensk = r.data.ensk;
      delete r.data.ensk;
      var newData = {
        account : 0,
        accounts : [r.data],
        oldEnsk : true,
        ensk : tempensk,
        version : 3,
      };
      r.setStore(newData);
      console.log("Updated storage to version 3");
    }
  }
  r.loadStore = function(){
    r.data = window.store.get('tbstore', false);
    return r.data;
  };
  r.clearNewAccount = function(){
    r.newKey = false;
    tempaccount = '';
    tempkey = '';
  }
  r.checkNewPkh = function(pkh){
    if (!r.newKey) return false;
    return (pkh == tempkey.pkh);
  }
  r.newAccount = function(v, k){
    tempaccount = v;
    tempkey = k;
    r.newKey = true;
  };
  r.addNewAccount = function(v, k){
    if (typeof v != 'undefined') tempaccount = v;
    if (typeof k != 'undefined') tempkey = k;
    if (!r.data) r.data = {
      accounts : [],
      account : 0,
    };
    r.data.accounts.push(tempaccount);
    r.keys.push(tempkey);
    r.data.account = (r.data.accounts.length-1);
    r.newKey = false;
    tempaccount = '';
    tempkey = '';
    r.setStore();
  };
  
  r.setStore = function(v, k, p){
      if (typeof v != 'undefined') r.data = v;
      if (typeof k != 'undefined') r.keys = k;
      if (typeof p != 'undefined') r.password = p;
      if (typeof r.data.version == 'undefined') r.data.version = r.storageVersion;
      localStorage.setItem('tbstore', JSON.stringify(r.data));
  };
  r.clearStore = function(){
    r.keys = [];
    r.password = '';
    r.restored = false;
    r.ico = false;
    r.data = false;
    var s = r.settings;
    window.store.clear();
    r.setSetting(s);
  };
  r.setSetting = function(v){
    r.settings = v;
    window.store.set('tbsetting', v);
  };
  r.loadSetting = function(){
    r.settings = window.store.get('tbsetting', false);
    return r.settings;
  };
  r.load();
  return r;
});
