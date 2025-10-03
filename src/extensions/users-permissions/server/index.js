const controllers = require("./controllers");
const routes = require("./routes");

module.exports = () => ({
	controllers: require("./controllers"),
	routes: require("./routes"),
});
