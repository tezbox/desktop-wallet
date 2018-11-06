var protobuf = require("protobufjs");
var usb = require('usb');
var device;
var interface ;
var inep;
var outep;
var pbroot;
var currentMessageData;
var currentMessageId;
var currentMessageLength;
var currentMessageHandler;
var currentMessageErrorHandler;
var isLoaded;
var isLoadedFunction;
var pbError;
var isLoadedErrorFunction;

var isReading;

function openDevice(){
	return new Promise(function(resolve, reject){
		device = usb.findByIds(4617, 21441);
    reject = function(e){throw e};
    if (!device) reject("No device found");
		device.open();
    
    //Find interface - we want to connect to the first one hopefully
    if (device.interfaces.length <= 0) reject("No interface found");
    interface = device.interface(device.interfaces[0].id);
		interface.claim();
    
    for(var i = 0; i < interface.endpoints.length; i++){
      if (interface.endpoints[i].direction == 'in' && !inep) inep = interface.endpoint(interface.endpoints[i].address);
      if (interface.endpoints[i].direction == 'out' && !outep) outep = interface.endpoint(interface.endpoints[i].address);
      if (inep && outep) break;
    }
    if (!inep || !outep)  reject("Not enough endpoints found");
    //Set up polling
		inep.on("data", function(d){
			if (d[0] != 63) return;
			d = d.slice(1);
			if (d[0] == 35 && d[1] == 35) {
				currentMessageId = buf2int(d.slice(2, 4));
				currentMessageLength = buf2int(d.slice(4, 8));
				d = d.slice(8);
				currentMessageData = new Buffer.alloc(0);
			}
			if (currentMessageId){
				currentMessageData = Buffer.concat([currentMessageData, d]);
				
				if (currentMessageData.length >= currentMessageLength){
					currentMessageData = currentMessageData.slice(0, currentMessageLength);
					if (currentMessageHandler) {
						currentMessageHandler(decodeProtobugMessage(currentMessageId, currentMessageData));
					}
					currentMessageData = false;
					currentMessageId = false;
					currentMessageLength = false;
					currentMessageHandler = false;
					currentMessageErrorHandler = false;
				}
			}
		});
		inep.on("error", function(e){
			if (currentMessageErrorHandler) currentMessageErrorHandler(e)
		});
    try{
      inep.startPoll();
    } catch(e){console.log(e)}
		resolve();
	});
}

function closeDevice(){
  inep.stopPoll(function(){
    interface.release(true, function(){
      device.close();
      device = false;
      interface = false;
      inep = false;
      outep = false;
      currentMessageData = false;
      currentMessageId = false;
      currentMessageLength = false;
      currentMessageHandler = false;
      currentMessageErrorHandler = false;
    });
  });
}

function load(){
	return new Promise(function(resolve, reject){
		if (isLoaded){
			if (pbError){
				reject(pbError);
			} else {
				resolve();
			}
		} else {
			protobuf.load("lib/trezor-tezos/protob/trezor.tezos.proto", function(err, root) {
				if (err){
					pbError = err;
					isLoaded = true;
					reject(err);
				} else {
					pbroot = root;
					isLoaded = true;
					resolve();
				}
			});
		}
	});
}

function recursiveAck(d){
	if (typeof d.code != 'undefined' && d.code == 8){
		return trezorQuery('acknowledge').then(recursiveAck);
	} else {
    closeDevice();
		return d;
	}
}

module.exports = {
	sign : function(path, branch, operation, revealOp){
		return new Promise(function(resolve, reject){
			openDevice().then(function(){
				load().then(function(){
					var tx = {
						addressN : convertPath(path),
						branch : branch
					};
					if (revealOp ) tx.reveal = revealOp;
					var type = operation.type;
					delete operation.type;
					tx[type] = operation;
					trezorQuery('tezosSignTx', tx).then(function(d){
						recursiveAck(d).then(resolve);
					}).catch(reject);
				}).catch(reject);
			}).catch(reject);
		});
	},
  getAddress: function(path){
		return new Promise(function(resolve, reject){
			openDevice().then(function(){
				load().then(function(){
					trezorQuery('tezosGetAddress', {
						addressN : convertPath(path),
						showDisplay : true,
					}).then(function(d){
						trezorQuery('acknowledge').then(function(d1){	
							trezorQuery('tezosGetPublicKey', {
								addressN : convertPath(path),
								showDisplay : false,
							}).then(function(d2){
								closeDevice();
								resolve({
									address : d1.address,
									publicKey : d2.publicKey
								});
							}).catch(reject);
						}).catch(reject);
					}).catch(reject);
				}).catch(reject);
			}).catch(reject);
		});
	}
}

//helper
var trezToMsgid = {
  "tezosGetAddress" : 150,
  "tezosGetPublicKey" : 154,
  "tezosSignTx" : 152,	
  "acknowledge" : 27,
};
var msgidToPb = {
  2 : "hw.trezor.messages.common.Success",
  3 : "hw.trezor.messages.common.Failure",
  26 : "hw.trezor.messages.common.ButtonRequest",
  27 : "hw.trezor.messages.common.ButtonAck",
  
  150 : "hw.trezor.messages.tezos.TezosGetAddress",
  151 : "hw.trezor.messages.tezos.TezosAddress",
  152 : "hw.trezor.messages.tezos.TezosSignTx",
  153 : "hw.trezor.messages.tezos.TezosSignedTx",
  154 : "hw.trezor.messages.tezos.TezosGetPublicKey",
  155 : "hw.trezor.messages.tezos.TezosPublicKey",
};

function convertPath(p){
	var ps = p.split('/');
	var r = [];
	for(var i = 0; i < ps.length; i++){
		r.push((ps[i].indexOf("'") >= 0 ? (parseInt(ps[i]) | 0x80000000) >>> 0 : parseInt(ps[i])));
	}
	return r;
}
function trezorQuery(id, data){
  return new Promise(function(resolve, reject){
    currentMessageHandler = resolve;
    currentMessageErrorHandler = reject;
    var packets = buildPackets(trezToMsgid[id], data || false);
    for(var i = 0; i < packets.length; i++){
      outep.transfer([63].concat(packets[i]), function(e){if (e) console.log("err", e)});
    }
  });
}
function buildPackets(id, data){
  data = encodeProtobugMessage(id, data || {});	
  data = Array.prototype.slice.call(data, 0);
	var header = [35, 35];
	header = header.concat([id >> 8, id % 255]);
	header = header.concat(toBytesInt32(data.length));
  data = header.concat(data);
  var pak = [];
  var packets = [];
  for (var i = 0; i < Math.ceil((data.length)/63); i++){
    pak = data.slice(i * 63, (i * 63) + 63);
    pak = pad_array(pak, 63, 0);
    packets.push(pak);
  }
	return packets;
}
function pad_array(arr,len,fill) {
  return arr.concat(Array(len).fill(fill)).slice(0,len);
}
function encodeProtobugMessage(messageId, message){
  var pbm = pbroot.lookupType(msgidToPb[messageId]);
  // var err = pbm.verify(message);
  // if (err)
    // throw Error(err);
	return pbm.encode(message).finish();
}
function decodeProtobugMessage(messageId, message){
  var pbm = pbroot.lookupType(msgidToPb[messageId]);
  return pbm.toObject(pbm.decode(message));
}
function buf2int(b){
  var count = 0;
  for(var i = 0; i < b.length; i++){
    count = (count << 8) + b[i];
  }
  return count;
}
function toBytesInt32 (num) {
  return [
    (num & 0xff000000) >> 24,
    (num & 0x00ff0000) >> 16,
    (num & 0x0000ff00) >> 8,
    (num & 0x000000ff)
  ];
}