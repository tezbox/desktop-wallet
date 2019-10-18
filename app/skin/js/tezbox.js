var TEZBOX_VERSION = "5.0.2";

function showLoader(){
  $('#loadingSpinnerContainer').show();
}
function hideLoader(){
  $('#loadingSpinnerContainer').hide();
}
copyToClipboard = function(text) {
if (window.clipboardData && window.clipboardData.setData) {
    // IE specific code path to prevent textarea being shown while dialog is visible.
    return clipboardData.setData("Text", text); 

} else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
    var textarea = document.createElement("textarea");
    textarea.textContent = text;
    textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
    document.body.appendChild(textarea);
    textarea.select();
    try {
        return document.execCommand("copy");  // Security exception may be thrown by some browsers.
    } catch (ex) {
        console.warn("Copy to clipboard failed.", ex);
        return false;
    } finally {
        document.body.removeChild(textarea);
    }
}}
function isJsonString(str) {
	try {
			j = JSON.parse(str);
	} catch (e) {
			return false;
	}
	return true;
}

var open = true;
function toggleSide(){
  if (open){
    $('.side').toggle();
  } else{
    $('.side-min').fadeOut();
  }
  $( ".mainArea" ).animate({
    left: ( open ? "0" : "300")
  }, 500, function() {
    if (open){
      $('.side').toggle();
    } else
      $('.side-min').fadeIn();
  });
  open = !open;
}

var managerOps = {
  transfer : function(destination, amount, endpoint, parameters){
    if (destination.substr(0,2) == "KT") {
      if (typeof endpoint == 'undefined') endpoint = 'default';
      if (typeof parameters == 'undefined') parameters = 'Unit';
      if (parameters == 'Unit') parameters = false;

      if (!parameters){
        var contract = [{"prim": "unit"}];
        var params = {"prim": "UNIT"};
      } else {
        throw "WIP";
      //var contract = [{"prim": },{"prim": }];
      //var params = {"prim": "UNIT"};                      
      }
      var param = [
      {"prim": "DROP"},
      {"prim": "NIL", "args": [{"prim": "operation"}]},
      {"prim": "PUSH", "args": [{"prim": "address"},{"string": destination}]},
      {"prim": "CONTRACT", "args": contract},
      {"prim": "ASSERT_SOME"},
      {"prim": "PUSH", "args": [{"prim": "mutez"},{"int": eztz.utility.mutez(amount)}]},
      params,
      {"prim": "TRANSFER_TOKENS"},
      {"prim": "CONS"}
      ];
    } else {
      var param = [
       {"prim": "DROP"},
       {"prim": "NIL", "args": [{"prim": "operation"}]},
       {"prim": "PUSH", "args": [{"prim": "key_hash"},{"string": destination}]},
       {"prim": "IMPLICIT_ACCOUNT"},
       {"prim": "PUSH", "args": [{"prim": "mutez"},{"int": eztz.utility.mutez(amount)}]},
       {"prim": "UNIT"},
       {"prim": "TRANSFER_TOKENS"},
       {"prim": "CONS"}
      ];
    }
    return ['do', param];
  },
  delegate : function(delegate){
    return ['do', [
      {"prim": "DROP"},
      {"prim": "NIL", "args": [{"prim": "operation"}]},
      {"prim": "PUSH", "args": [{"prim": "key_hash"}, {"string": delegate}]},
      {"prim": "SOME"},
      {"prim": "SET_DELEGATE"},
      {"prim": "CONS"}
    ]];
  },
  undelegate : function(){
    return ['do', [
      {"prim": "DROP"},
      {"prim": "NIL", "args": [{"prim": "operation"}]},
      {"prim": "NONE", "args": [{"prim": "key_hash"}]},
      {"prim": "SET_DELEGATE"},
      {"prim": "CONS"}
    ]];
  }
}