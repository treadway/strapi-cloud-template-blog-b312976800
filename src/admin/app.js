import HoursEditor from "./components/HoursEditor";

export default {
	register(app) {
		console.log("✅ ADMIN LOADED");

		app.customFields.register({
			name: "hours-editor",
			pluginId: "app", // ✅ FIXED

			type: "json",

			intlLabel: {
				id: "hours-editor.label",
				defaultMessage: "Business Hours",
			},

			intlDescription: {
				id: "hours-editor.description",
				defaultMessage: "Set weekly business hours",
			},

			components: {
				Input: HoursEditor,
			},
		});
	},
};
