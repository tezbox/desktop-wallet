let Transport = require("@ledgerhq/hw-transport-node-hid").default;
let App = require("./hw-app-xtz").default;
module.exports = {
	getAddress : async (path) => {
	  const transport = await Transport.create(60 * 1000);
	  const xtz = new App(transport);
	  const result = await xtz.getAddress(path, true);
	  return result;
	},
	sign : async (path, data) => {
	  const transport = await Transport.create(60 * 1000);
	  const xtz = new App(transport);
	  const result = await xtz.signOperation(path, data);
	  return result;
	}
};