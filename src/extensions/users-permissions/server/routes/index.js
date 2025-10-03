const auth = require("./auth");

module.exports = {
	"content-api": {
		type: "content-api",
		routes: auth,
	},
};
