import HoursEditor from "./components/HoursEditor";

export default {
	register(app) {
		app.customFields.register({
			name: "hours-editor",
			pluginId: "global",
			type: "json",
			intlLabel: {
				id: "hours-editor.label",
				defaultMessage: "Business Hours",
			},
			components: {
				Input: HoursEditor,
			},
		});
	},
};
