var tezledger = require('./ledger.node.xtz.js');
tezledger.getAddress("44'/1729'/0'/0'").then(console.log).catch(console.error);