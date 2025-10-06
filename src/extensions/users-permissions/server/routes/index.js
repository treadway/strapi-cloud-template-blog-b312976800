import auth from "./auth.js";

const routes = {
	"content-api": {
		type: "content-api",
		routes: auth,
	},
};

export default routes;
