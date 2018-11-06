app
.controller('NewController', ['$scope', '$location', 'Storage', 'Lang', function($scope, $location, Storage, Lang) {
  
  var routeUser = function(){
    if (Storage.loaded && typeof Storage.keys.sk != 'undefined'){
        return $location.path('/main');
    } else if (Storage.loaded && typeof Storage.data.ensk != 'undefined'){
        return $location.path('/unlock');
    }
  };
  
  $scope.setting = Storage.settings;
  if (!$scope.setting) {
    $scope.setting = {
      rpc : "https://rpc.tezrpc.me",
      language : "english",
      disclaimer : false
    };
    Storage.setSetting($scope.setting);
  } else {
    //Patch settings
    var change = false;
    if (typeof $scope.setting.language == 'undefined'){
      $scope.setting.language = "english";
      change = true;
    }
    Storage.setSetting($scope.setting);
  }
  window.eztz.node.setProvider($scope.setting.rpc);
  Lang.setLang($scope.setting.language);
  if ($scope.setting.disclaimer) {
    routeUser();
  }
  $scope.acceptDisclaimer = function(){
    $scope.setting.disclaimer = true;
    Storage.setSetting($scope.setting);
    routeUser();
  };
  $scope.unacceptDisclaimer = function(){
    $scope.setting.disclaimer = false;
    Storage.setSetting($scope.setting);
  };
  $scope.restore = function(){
    return $location.path('/restore');
  };
  $scope.link = function(){
    return $location.path('/link');
  };
  $scope.create = function(){
    return $location.path('/create');
  };
}])
.controller('CreateController', ['$scope', '$location', 'Storage', '$sce', function($scope, $location, Storage, $sce) {
  $scope.passphrase = '';
  $scope.mnemonic = '';
  
  $scope.cancel = function(){
    return $location.path('/new');
  };
  $scope.newMnemonic = function(){
   $scope.mnemonic = window.eztz.crypto.generateMnemonic();
  }
  $scope.showSeed = function(m){
    var mm = m.split(" ");
    return $sce.trustAsHtml("<span>"+mm.join("</span> <span>")+"</span>");
  }
  $scope.create = function(){
    var keys = window.eztz.crypto.generateKeys($scope.mnemonic, $scope.passphrase);
    keys = {sk : keys.sk, pk : keys.pk, pkh : keys.pkh, type : "encrypted"};
    var identity = {
      pkh : keys.pkh,
      accounts : [{title: "Main", address : keys.pkh, public_key : keys.pk}],
      account : 0
    };
    Storage.setStore(identity, keys);
    return $location.path("/validate");
  };
  
  $scope.newMnemonic();
}])
.controller('ValidateController', ['$scope', '$location', 'Storage', '$sce', 'SweetAlert', 'Lang', function($scope, $location, Storage, $sce, SweetAlert, Lang) {
  var ss = Storage.data;
  if (Storage.data.ensk && typeof Storage.keys.sk != 'undefined'){
    return $location.path('/main');
  }  else if (Storage.data.ensk){
    return $location.path('/unlock');
  }

  $scope.passphrase = '';
  $scope.mnemonic = '';
  
  $scope.cancel = function(){
    Storage.clearStore();
    return $location.path('/new');
  };  
  $scope.validate = function(){
    var keys = window.eztz.crypto.generateKeys($scope.mnemonic, $scope.passphrase);
    if (keys.pkh != ss.pkh) {
      SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('details_dont_match'), 'error');
    } else {        
      return $location.path("/encrypt");
    }
  };
}])
.controller('MainController', ['$scope', '$location', '$http', 'Storage', 'SweetAlert', 'Lang', function($scope, $location, $http, Storage, SweetAlert, Lang) {
  var ss = Storage.data;
  if (!ss || !ss.ensk || typeof Storage.keys.sk == 'undefined'){
     return $location.path('/new');
  }
  if (typeof ss.temp != 'undefined') delete ss.temp;
  $scope.type = "encrypted";
  if (typeof Storage.keys.link != 'undefined' && Storage.keys.link) $scope.type = "ledger";
  var protos = {
    "PtCJ7pwoxe8JasnHY8YonnLYjcVHmhiARPJvqcC6VfHT5s8k8sY" : "Betanet_v1",
    "ProtoALphaALphaALphaALphaALphaALphaALphaALphaDdp3zK" : "Zeronet",
    "PsYLVpVvgbLhAhoqAkMFUo6gudkJ9weNXhUYCiLDzcUpFpkk8Wt" : "Mainnet"
  }
  $scope.setting = Storage.loadSetting();
  $scope.accounts = ss.accounts;
  $scope.account = ss.account;
  $scope.accountLive = true;
  $scope.accountDetails = {};
  $scope.tt = $scope.accounts[$scope.account].title;
  $scope.transactions = [];
  $scope.amount = 0;
  $scope.fee = 0;
  $scope.customFee = 0;
  $scope.advancedOptions = false;
  $scope.gas_limit = 200;
  $scope.storage_limit = 0;
  $scope.parameters = '';
  $scope.delegateType = 'undelegated';
  $scope.advancedOptions = false;
  $scope.showCustom = false;
  $scope.showAccounts = false;
  $scope.dd = '';
  $scope.moreTxs = false;
  $scope.block = {
    net : "Loading..",
    level : "N/A",
    proto : "Loading",
  };
  $scope.kt1 = '';
  $scope.delegates = {
    keys : [
    'false',
    'tz1iZEKy4LaAjnTmn2RuGDf2iqdAQKnRi8kY',
    'tz1TDSmoZXwVevLTEvKCTHWpomG76oC9S2fJ',
    'tz1WCd2jm4uSt4vntk4vSuUWoZQGhLcDuR9q',
    'tz1Tnjaxk6tbAeC2TmMApPh8UsrEVQvhHvx5',
    ],
    names : [
      'Undelegated',
      'Tezzigator',
      'Tezos.Community',
      'HappyTezos',
      'CryptoDelegate',
    ]
  };
  
  $scope.privateKey = '';
  $scope.password = '';
  $scope.showPrivatekey = function(){
    if (!$scope.password) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('please_enter_password'), 'error');
    if ($scope.password == Storage.password) {
      $scope.privateKey = Storage.keys.sk;
    } else { 
      SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('incorrect_password'), 'error');
    }
		$scope.password = '';
  }
  setBalance = function(r){
    var rb = parseInt(r);
    var bal = $scope.toTez(rb); 
    $scope.accountDetails.raw_balance = rb;
    $scope.accountDetails.balance = window.eztz.utility.formatMoney(bal, 2, '.', ',')+"ꜩ";
    //TODO: integrate with currencies
    var usdbal = bal * 1.37;
    $scope.accountDetails.usd = "$"+window.eztz.utility.formatMoney(usdbal, 2, '.', ',')+"USD";
  }
  var maxTxs = 20;
  refreshTransactions = function(){
    $http.get("https://api4.tzscan.io/v1/operations/"+$scope.accounts[$scope.account].address+"?type=Transaction&p=0&number="+ (maxTxs+1)).then(function(r){
      if (r.status == 200 && r.data.length > 0){
        if (r.data.length > maxTxs) {
          r.data.splice(0,1);
          $scope.moreTxs = true;
        } else {
          $scope.moreTxs = false;
        }
        var txs = [];
        for(var i = r.data.length-1; i >= 0; i--){
          for(var j = 0; j < r.data[i].type.operations.length; j++){
            if (r.data[i].type.operations[j].kind != 'transaction' || r.data[i].type.operations[j].failed) continue;
            txs.push({
              "amount" : r.data[i].type.operations[j].amount,
              "fee" : r.data[i].type.operations[j].fee,
              "destination" : r.data[i].type.operations[j].destination.tz,
              "hash" : r.data[i].hash,
              "source" : r.data[i].type.operations[j].src.tz,
              "time" : r.data[i].type.operations[j].timestamp,
              "operationHash" : r.data[i].hash,
            });
          }
        }
        $scope.transactions = txs;
      }
    });
  };
  refreshHash = function(){
    window.eztz.rpc.getHead().then(function(r){
      $scope.$apply(function(){
        $scope.block = {
          net : r.chain_id,
          level : r.header.level,
          proto : Lang.translate("connected_to") + " " + (typeof protos[r.protocol] != 'undefined' ? protos[r.protocol] : r.protocol.substring(0,7) + "..."),
        };
      });
    }).catch(function(e){
      $scope.$apply(function(){
        $scope.block = {
          net : "Error",
          level : "N/A",
          proto : Lang.translate("not_connected"),
        };
      });
    });
  }
  refreshAll = function(){
    refreshHash();
    refreshTransactions();
		refreshBalance();
  }
  $scope.nextAddress = function(){
    if ($scope.accounts.length === 1) return $scope.accounts[0].address;
    else return ($scope.account === 0 ? $scope.accounts[1].address : $scope.accounts[0].address);
  }
  $scope.max = function(){
    var max = $scope.accountDetails.raw_balance;
    var fee = ($scope.showCustom ? $scope.customFee : $scope.fee);
    if ($scope.account === 0) max -= 1;
    return Math.max($scope.toTez(max - fee), 0);
  }
  $scope.toDate = function(d){
    var myDate = new Date(d), date = myDate.getDate(), month = myDate.getMonth(), year = myDate.getFullYear(), hours = myDate.getHours(), minutes = myDate.getMinutes();
    function pad(n) {
      return n<10 ? '0'+n : n
    }
    return pad(date) + "-" + pad(month + 1) + "-" + year + " " + pad(hours) + ":" + pad(minutes);
  }
  $scope.toTez = function(m){
    return window.eztz.utility.totez(parseInt(m));
  }
  $scope.viewSettings = function(){
      clearInterval(ct);
      return $location.path('/setting');
  }
  $scope.lock = function(){
      clearInterval(ct);
      Storage.keys = {};
      return $location.path('/unlock');
  } 
  $scope.saveTitle = function(){
    if (!$scope.tt){
        SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_new_title'), 'error');
        return;
    }
    $scope.accounts[$scope.account].title = $scope.tt;
    ss.accounts = $scope.accounts;
    Storage.setStore(ss);
    $scope.refresh();
  };   
  $scope.import = function(){
    if (!$scope.kt1) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_kt1_address'), 'error');
    for(var i = 0; i < $scope.accounts.length; i++){
      if ($scope.accounts[i].address == $scope.kt1) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_kt1_linked'), 'error');
    }
    window.showLoader();
    
    window.eztz.node.query("/chains/main/blocks/head/context/contracts/"+$scope.kt1+"/manager").then(function(r){
      if (r != $scope.accounts[0].address) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_kt1_manager'), 'error');
      $scope.$apply(function(){
        $scope.accounts.push(
          {
            title : "Account " + ($scope.accounts.length),
            address : $scope.kt1
          }
        );
        $scope.account = ($scope.accounts.length-1);
        ss.accounts = $scope.accounts;
        ss.account = $scope.account;
        Storage.setStore(ss);
        $scope.refresh();
        $scope.kt1 = '';
        window.hideLoader();
      })
    }).catch(function(r){
      window.hideLoader();
      SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_importing'), 'error');
    });
  };   
  $scope.remove = function(){
    if ($scope.account === 0) return;
    SweetAlert.swal({
      title: Lang.translate('are_you_sure'),
      text: Lang.translate('remove_account_warning'),
      type : "warning",
      showCancelButton: true,
      confirmButtonText: Lang.translate('yes_remove_it'),
      closeOnConfirm: true
    },
    function(isConfirm){
      if (isConfirm){
        $scope.accounts.splice($scope.account, 1);
        $scope.account = 0;
        ss.accounts = $scope.accounts;
        ss.account = $scope.account;
        Storage.setStore(ss);
        $scope.refresh();
      }
    });
  };
  
  $scope.add = function(){
    SweetAlert.swal({
      title: Lang.translate('are_you_sure'),
      text: Lang.translate('originate_warning'),
      type : "warning",
      showCancelButton: true,
      confirmButtonText: Lang.translate('yes_continue'),
      closeOnConfirm: true
    },
    function(isConfirm){
      if (isConfirm){
        window.showLoader();
        if ($scope.type == "encrypted"){
          var keys = {
            sk : Storage.keys.sk,
            pk : Storage.keys.pk,
            pkh : $scope.accounts[0].address,
          };
        } else {
          var keys = {
            sk : false,
            pk : Storage.keys.pk,
            pkh : $scope.accounts[0].address,
          };
        }
        var op = window.eztz.rpc.account(keys, 0, true, true, null, 0)
        if (!keys.sk){
          switch($scope.type){
            case "ledger":
              var cancelled = false;
              op = op.then(function(r){
                SweetAlert.swal({
                  title: '',
									imageUrl: "skin/images/ledger-logo.svg",
                  text: Lang.translate('ledger_confirm_transaction'),
                  showCancelButton: true,
                  showConfirmButton: false,
                }, function(c){
                  if (!c) {
										window.hideLoader();
										cancelled = true;
									}
                });
                return window.tezledger.sign(Storage.keys.sk, "03"+r.opbytes).then(function(rr){
                  r.opOb.signature = window.eztz.utility.b58cencode(window.eztz.utility.hex2buf(rr.signature), window.eztz.prefix.edsig);
                  return window.eztz.rpc.inject(r.opOb, r.opbytes + rr.signature);
                });
              }).catch(function(e){
                window.hideLoader();
                if (cancelled) return;
                SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('ledger_error_signing'), 'error')
              });
            break;
            case "trezor":
            case "offline":
            default:
              window.hideLoader();
              SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_undeveloped'), 'error')
              return;
            break;
          }
        }
        op.then(function(r){
          $scope.$apply(function(){
            var address = window.eztz.contract.hash(r.hash, 0);
            if ($scope.accounts[$scope.accounts.length-1].address != address){
              $scope.accounts.push(
                {
                  title : "Account " + ($scope.accounts.length),
                  address : address
                }
              );
              $scope.account = ($scope.accounts.length-1);
              ss.accounts = $scope.accounts;
              ss.account = $scope.account;
              Storage.setStore(ss);
              SweetAlert.swal(Lang.translate('awesome'), Lang.translate('new_account_originated'), "success");
            } else {
              SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_origination_awaiting'), 'error');
            }
            $scope.refresh();
            window.hideLoader();
          });
        }).catch(function(r){
          window.hideLoader();
          if (typeof r.errors !== 'undefined'){
            ee = r.errors[0].id.split(".").pop();
            SweetAlert.swal(Lang.translate('uh_oh'), r.error + ": Error (" + ee + ")", 'error');
          } else SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('origination_error'), 'error');
        });
      }
    });
  };
  var refreshBalance = function(){
		window.eztz.rpc.getBalance($scope.accounts[$scope.account].address).then(function(r){
      $scope.$apply(function(){
        $scope.accountLive = true;
        setBalance(r);
      });
    }).catch(function(e){
      $scope.$apply(function(){
        $scope.accountLive = false;
        setBalance(0);
      });
    });
	}
	
	$scope.loadAccount = function(a){
    $scope.account = a;
    $scope.transactions = [];
    ss.account = $scope.account
    $scope.tt = $scope.accounts[$scope.account].title;;
    Storage.setStore(ss);
    $scope.accountDetails = {
        balance : Lang.translate('loading'),
        usd : Lang.translate('loading'),
        raw_balance : Lang.translate('loading'),
    };
    if ($scope.account !== 0){
      window.eztz.rpc.getDelegate($scope.accounts[$scope.account].address).then(function(r){
        $scope.$apply(function(){
          $scope.dd = r;
          if ($scope.delegates.keys.indexOf($scope.dd) >= 0){
            $scope.delegateType = $scope.dd;
          } else if (!$scope.dd){
            $scope.delegateType = 'undelegated';
            $scope.dd = '';
          } else
            $scope.delegateType = '';
        });
      });
    }
    refreshTransactions();
    refreshBalance();
  }
  $scope.refresh = function(){
      $scope.loadAccount($scope.account);
  };
  $scope.copy = function(){
    SweetAlert.swal(Lang.translate('awesome'), Lang.translate('copy_clipboard'), "success");
    window.copyToClipboard($scope.accounts[$scope.account].address);
  };
  $scope.send = function(){
    var fee = ($scope.showCustom ? $scope.customFee : $scope.fee);
    if (!$scope.toaddress || ($scope.toaddress.substring(0, 2) !=  "tz" && $scope.toaddress.substring(0, 3) !=  "KT1")) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_valid_destinaton'), 'error');
    if ($scope.toaddress == $scope.accounts[$scope.account].address) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_send_self'));
    if ($scope.amount < 0) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_positive_amount'), 'error');
    if ($scope.amount > $scope.max()) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_amount_exceeds'), 'error');
    if (fee < 0) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_positive_fee'));
    if ($scope.amount != parseFloat($scope.amount)) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_invalid_amount'), 'error');
    if (fee != parseInt(fee)) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_invalid_fee'), 'error');
    SweetAlert.swal({
      title: Lang.translate('are_you_sure'),
      text: Lang.translate('transaction_confirm_info', [$scope.amount, $scope.toaddress]),
      type : "warning",
      showCancelButton: true,
      confirmButtonText: Lang.translate('yes_send_it'),
      closeOnConfirm: true
    },
    function(isConfirm){
      if (isConfirm){
        window.showLoader();
        if ($scope.type == "encrypted"){
          var keys = {
            sk : Storage.keys.sk,
            pk : Storage.keys.pk,
            pkh : $scope.accounts[$scope.account].address,
          };
        } else {
          var keys = {
            sk : false,
            pk : Storage.keys.pk,
            pkh : $scope.accounts[$scope.account].address,
          };
        }
        if ($scope.parameters){
          var op = window.eztz.contract.send($scope.toaddress, $scope.accounts[$scope.account].address, keys, $scope.amount, $scope.parameters, fee, $scope.gas_limit, $scope.storage_limit);
        } else {
          var op = window.eztz.rpc.transfer($scope.accounts[$scope.account].address, keys, $scope.toaddress, $scope.amount, fee, false, $scope.gas_limit, $scope.storage_limit);
        }
        if (!keys.sk){
          switch($scope.type){
            case "ledger":
              var cancelled = false;
              op = op.then(function(r){
                SweetAlert.swal({
									title: '',
									imageUrl: "skin/images/ledger-logo.svg",
                  text: Lang.translate('ledger_confirm_transaction'),
                  showCancelButton: true,
                  showConfirmButton: false,
                }, function(c){
                  if (!c) cancelled = true;
                });
                return window.tezledger.sign(Storage.keys.sk, "03"+r.opbytes).then(function(rr){
                  r.opOb.signature = window.eztz.utility.b58cencode(window.eztz.utility.hex2buf(rr.signature), window.eztz.prefix.edsig);
                  return window.eztz.rpc.inject(r.opOb, r.opbytes + rr.signature);
                }).catch(function(e){
                if (cancelled) return;
                  window.hideLoader();
                  SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('ledger_error_signing'), 'error')
                });
              }).catch(function(e){
                if (cancelled) return;
                window.hideLoader();
                SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('ledger_error_signing'), 'error')
              });
            break;
            case "trezor":
            case "offline":
            default:
              window.hideLoader();
              SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_undeveloped'), 'error')
              return;
            break;
          }
        }
        op.then(function(r){
          $scope.$apply(function(){
            window.hideLoader();
            SweetAlert.swal(Lang.translate('awesome'), Lang.translate('transaction_sent'), "success");
            refreshTransactions();
            $scope.clear();
          });
        }).catch(function(r){
          $scope.$apply(function(){
            window.hideLoader();
            if (typeof r.errors !== 'undefined'){
              ee = r.errors[0].id.split(".").pop();
              SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('operation_failed') + " " + r.error + ": Error (" + ee + ")", 'error');
            } else {
              SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('operation_failed2'), 'error');
            }
          });
        });
      }
    });
  };
  $scope.clear = function(){
    $scope.amount = 0;
    $scope.customFee = 0;
    $scope.fee = 0;
    $scope.toaddress = '';
    $scope.parameters = '';
    $scope.showAccounts = false;
  }
  $scope.updateDelegate = function(){
      var fee = ($scope.showCustom ? $scope.customFee : $scope.fee);
      if (fee < 0) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_positive_fee'), 'error');
      if (fee != parseInt(fee)) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_invalid_fee'), 'error');
      var delegate;
      if ($scope.delegateType == "undelegated") delegate = "";
      else {
        if ($scope.delegateType) $scope.dd = $scope.delegateType;
        if (!$scope.dd) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_valid_delegate'), 'error');
        delegate = $scope.dd;
      }
      window.showLoader();
      if ($scope.type == "encrypted"){
        var keys = {
          sk : Storage.keys.sk,
          pk : Storage.keys.pk,
          pkh : $scope.accounts[$scope.account].address,
        };
      } else {
        var keys = {
          sk : false,
          pk : Storage.keys.pk,
          pkh : $scope.accounts[$scope.account].address,
        };
      }
      var op = window.eztz.rpc.setDelegate($scope.accounts[$scope.account].address, keys, delegate, fee)
      if (!keys.sk){
        switch($scope.type){
          case "ledger":
            var cancelled = false;
            op = op.then(function(r){
              SweetAlert.swal({
								title: '',
								imageUrl: "skin/images/ledger-logo.svg",
                text: Lang.translate('ledger_confirm_transaction'),
                showCancelButton: true,
                showConfirmButton: false,
              }, function(c){
                if (!c) cancelled = true;
              });
              return window.tezledger.sign(Storage.keys.sk, "03"+r.opbytes).then(function(rr){
                r.opOb.signature = window.eztz.utility.b58cencode(window.eztz.utility.hex2buf(rr.signature), window.eztz.prefix.edsig);
                return window.eztz.rpc.inject(r.opOb, r.opbytes + rr.signature);
              });
            })
          break;
          case "trezor":
          case "offline":
          default:
            window.hideLoader();
            SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_undeveloped'), 'error')
            return;
          break;
        }
      }
      op.then(function(r){
        $scope.$apply(function(){
          SweetAlert.swal(Lang.translate('awesome'), Lang.translate('delegation_success'), "success");
          $scope.fee = 0;
          window.hideLoader();
        });
      }).catch(function(r){
        $scope.$apply(function(){
          SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('delegation_failed'), 'error');
          window.hideLoader();
        });
      });
  }
  
  if (Storage.restored){
    window.showLoader();
    $http.get("https://api4.tzscan.io/v1/operations/"+$scope.accounts[0].address+"?type=Origination").then(function(r){
      window.hideLoader();
      if (r.status == 200 && r.data.length > 0){
        SweetAlert.swal({
          title: Lang.translate('import_kt_address'),
          text: Lang.translate('import_kt_address_info', [r.data.length]),
          type : "info",
          showCancelButton: true,
          confirmButtonText: Lang.translate('yes_import_them'),
          closeOnConfirm: true
        },
        function(isConfirm){
          if (isConfirm){
            for(var i = 0; i < r.data.length; i++){
              for(var j = 0; j < r.data[i].type.operations.length; j++){
                $scope.accounts.push(
                  {
                    title : "Account " + ($scope.accounts.length),
                    address : r.data[i].type.operations[j].tz1.tz
                  }
                );
              }
            }
            ss.accounts = $scope.accounts;
            Storage.setStore(ss);
            $scope.refresh();
          }
        });
      }
    });
    
    if (Storage.ico) SweetAlert.swal(Lang.translate('awesome'), Lang.translate('ico_restore_success'), 'success');
    Storage.restored = false;
    Storage.ico = false;
  } else {
    window.hideLoader();
  }
  $scope.refresh();
  refreshAll();
  var ct = setInterval(function(){
		$scope.$apply(function(){
			refreshAll();
		});
	}, 20000);
}])
.controller('SettingController', ['$scope', '$location', 'Storage', 'SweetAlert', 'Lang', function($scope, $location, Storage, SweetAlert, Lang) {
  $scope.setting = Storage.settings;
  
  $scope.save = function(){
    Storage.setSetting($scope.setting);
    window.eztz.node.setProvider($scope.setting.rpc);
    return $location.path('/main');
  }
  
}])
.controller('UnlockController', ['$scope', '$location', 'Storage', 'SweetAlert', 'Lang', function($scope, $location, Storage, SweetAlert, Lang) {
  var ss = Storage.data;
  $scope.password = '';
  $scope.clear = function(){
    SweetAlert.swal({
      title: Lang.translate('are_you_sure'),
      text: Lang.translate('clear_tezbox_warning'),
      type : "warning",
      showCancelButton: true,
      confirmButtonText: Lang.translate('yes_clear_it'),
      closeOnConfirm: true
    },
    function(isConfirm){
      if (isConfirm){
        Storage.clearStore();
        return $location.path('/new');
      }
    });
  }
  $scope.unlock = function(){
    if (!$scope.password) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('please_enter_password'), 'error');
    window.showLoader();
    setTimeout(function(){
      $scope.$apply(function(){
        try {
          var sk = sjcl.decrypt(window.eztz.library.pbkdf2.pbkdf2Sync($scope.password, ss.pkh, 30000, 512, 'sha512').toString(), ss.ensk);
          var type = sk.substr(0,4);
					if (type == "edsk") { 
						var c = window.eztz.crypto.extractKeys(sk);			
						c.type = "encrypted";		
          } else {
						var c = {
							pk : ss.accounts[0].public_key,
							pkh : ss.pkh,
							sk : sk.substr(4),
						};
						if (type == "ledg"){
							c.type = "ledger";
						} else if (type == "trez"){
							c.type = "trezor";
						} else if (type == "offl"){
							c.type = "offline";
						} else {
							//Legacy
							c.type = "ledger";
							c.sk = sk;
						}
          }
        } catch(err){
          window.hideLoader();
          SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('incorrect_password'), 'error');
          return;
        }
        Storage.keys = c;
        Storage.password = $scope.password;
        return $location.path('/main');
      });
    }, 100);
  };
}])
.controller('EncryptController', ['$scope', '$location', 'Storage', 'SweetAlert', 'Lang', function($scope, $location, Storage, SweetAlert, Lang) {
  var ss = Storage.data;
  if (typeof Storage.keys.sk == 'undefined') return $location.path('/new');
  $scope.password = '';
  $scope.password2 = '';
  
  $scope.encrypt = function(){
    if (!$scope.password || !$scope.password2) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_enter_password'), 'error');
    if ($scope.password.length < 8) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_password_short'), 'error');
    if ($scope.password != $scope.password2) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_password_dont_match'), 'error');
    var spaces = $scope.password.match(/\s+/g),
    numbers = $scope.password.match(/\d+/g),
    uppers  = $scope.password.match(/[A-Z]/),
    lowers  = $scope.password.match(/[a-z]/),
    special = $scope.password.match(/[!@#$%\^&*\+]/);

    if (spaces !== null) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_password_spaces'), 'error');
    if (uppers === null || lowers === null) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_password_upper_lower'), 'error');
    if (special === null && numbers === null) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_password_special'), 'error');
    
    window.showLoader();
    setTimeout(function(){
      $scope.$apply(function(){
        var identity = {
          ensk : sjcl.encrypt(window.eztz.library.pbkdf2.pbkdf2Sync($scope.password, Storage.keys.pkh, 30000, 512, 'sha512').toString(), (Storage.keys.type == "encrypted" ? Storage.keys.sk : Storage.keys.type.substr(0,4) + Storage.keys.sk)),
          pkh : ss.pkh,
          accounts : ss.accounts,
          account : ss.account
        };
        Storage.setStore(identity);
        Storage.password = $scope.password;            
        return $location.path("/main");
      });
    }, 100);
  }
  $scope.cancel = function(){
    Storage.clearStore();
    return $location.path('/new');
  };
  
}])
.controller('LinkController', ['$scope', '$location', 'Storage', 'SweetAlert', 'Lang', function($scope, $location, Storage, SweetAlert, Lang) {
  $scope.type = 'ledger'; //ledger/trezor/offline
  $scope.address = '';
  $scope.data = "44'/1729'/0'/0'";
  
  $scope.cancel = function(){
      return $location.path('/new');
  };
  $scope.link = function(){

    if ($scope.type == 'ledger' && !$scope.data) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_path_ledger'), 'error');
    if ($scope.type == 'trezor' && !$scope.data) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_path_trezor'), 'error');
    if ($scope.type == 'offline' && !$scope.address) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_offline_address'), 'error');
        
    $scope.text = Lang.translate('linking');
    var cancelled = false;
    if ($scope.type == 'ledger'){
      SweetAlert.swal({
        title: '',
        imageUrl: "skin/images/ledger-logo.svg",
        text: Lang.translate('ledger_verify_address'),
        showCancelButton: true,
        showConfirmButton: false,
      }, function(c){
        if (!c){
          cancelled = true;
          window.hideLoader();              
        }
      });
      window.showLoader();
      var pp = window.tezledger.getAddress($scope.data).then(function(r){
        return window.eztz.utility.b58cencode(window.eztz.utility.hex2buf(r.publicKey.substr(2)), window.eztz.prefix.edpk)
      })
    } else if ($scope.type == 'trezor'){
      SweetAlert.swal({
        title: '',
        imageUrl: "skin/images/trezor-logo.svg",
        text: Lang.translate('ledger_verify_address'),
        showCancelButton: true,
        showConfirmButton: false,
      }, function(c){
        if (!c){
          cancelled = true;
          window.hideLoader();              
        }
      });
      window.showLoader();
      var pp = window.teztrezor.getAddress($scope.data).then(function(r){
        return window.eztz.utility.b58cencode(window.eztz.utility.hex2buf(r..payload.publicKey.substr(2)), window.eztz.prefix.edpk)
      })
    }
    pp.then(function(pk){
      $scope.$apply(function(){
        address = window.eztz.utility.b58cencode(window.eztz.library.sodium.crypto_generichash(20, window.eztz.utility.b58cdecode(pk, window.eztz.prefix.edpk)), window.eztz.prefix.tz1)
        SweetAlert.swal(Lang.translate('awesome'), Lang.translate('ledger_retreived_address') + ": "+address+"!", "success");
        var identity = {
            pkh : address,
            accounts : [{title: "Main", address :address, public_key : pk}],
            account : 0
        };
        Storage.setStore(identity, {
          pk : pk,
          pkh : address,
          sk : $scope.data,
          type : $scope.type
        });   
        window.hideLoader();
        return $location.path("/encrypt");
      });
    }).catch(function(e){
      if (cancelled) return;
      window.hideLoader();
      SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('ledger_error_connect'), 'error');
    });    
  };
}])
.controller('RestoreController', ['$scope', '$location', 'Storage', 'SweetAlert', 'Lang', function($scope, $location, Storage, SweetAlert, Lang) {
  $scope.type = 'ico';
  $scope.seed = '';
  $scope.passphrase = '';
  $scope.private_key = '';
  $scope.encryption_password = '';
  $scope.email = '';
  $scope.ico_password = '';
  $scope.activation_code = '';
  
  $scope.cancel = function(){
      return $location.path('/new');
  };
  $scope.isEdesk = function(){
    return ($scope.private_key.substring(0, 5) == "edesk");
  };
  var restoreEnd = function(keys){
    var keys = {sk : keys.sk, pk : keys.pk, pkh : keys.pkh, type : "encrypted"};
    var identity = {
      pkh : keys.pkh,
      accounts : [{title: "Main", address : keys.pkh, public_key : keys.pk}],
      account : 0
    };
    if ($scope.type == 'ico' && $scope.activation_code){
      window.showLoader(); 
      window.eztz.rpc.activate(keys.pkh, $scope.activation_code).then(function(){
        $scope.$apply(function(){
          window.hideLoader();    
          Storage.setStore(identity, keys);          
          SweetAlert.swal(Lang.translate('awesome'), Lang.translate('activation_successful'), "success");
          Storage.ico = true;
          Storage.restored = true;
          return $location.path("/encrypt");
        });
      }).catch(function(e){
        $scope.$apply(function(){
          window.hideLoader();    
          return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('activation_unsuccessful'), 'error');
        });
      });
    } else {
      Storage.setStore(identity, keys);   
      Storage.restored = true;
      return $location.path("/encrypt");
    }
  }
  $scope.restore = function(){
    if (['seed', 'ico'].indexOf($scope.type) >= 0 && !$scope.seed) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_please_enter_your_seed_words'), 'error');
    if (['seed', 'ico'].indexOf($scope.type) >= 0 && !window.eztz.library.bip39.validateMnemonic($scope.seed)) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_seed_words_not_valid'), 'error');

    if ($scope.type == 'ico' && !$scope.ico_password) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_enter_passphrase'), 'error');
    if ($scope.type == 'ico' && !$scope.email) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_enter_email'), 'error');
    if ($scope.type == 'ico' && !$scope.address) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_enter_address'), 'error');
    if ($scope.type == 'private' && !$scope.private_key) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_enter_private_key'), 'error');
    if ($scope.type == 'private' && $scope.isEdesk() && !$scope.encryption_password) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_enter_encryption_password'), 'error');
    $scope.text = Lang.translate('restoring');
    if ($scope.type == 'seed'){
      var keys = window.eztz.crypto.generateKeys($scope.seed, $scope.passphrase);          
    } else if ($scope.type == 'ico'){
      var keys = window.eztz.crypto.generateKeys($scope.seed, $scope.email + $scope.ico_password);       
      if ($scope.address != keys.pkh) return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_fundraiser_details_dont_mach'), 'error');
    } else if ($scope.type == 'private'){
      if ($scope.isEdesk()){
        return window.eztz.crypto.extractEncryptedKeys($scope.private_key, $scope.encryption_password).then(function(k){
          $scope.$apply(function(){
            restoreEnd(k);
          });
        }).catch(function(e){
          return SweetAlert.swal(Lang.translate('uh_oh'), Lang.translate('error_import_encrypted'), 'error');
        });
      } else {        
        var keys = window.eztz.crypto.extractKeys($scope.private_key);          
      }
    }
    restoreEnd(keys);
  };
}])
;
