export default {
	register(app) {},
	bootstrap(app) {
		const component = app.getPlugin("content-manager").apis;

		// Patch repeatable component behavior
		const orig = component.addRepeatableComponent;

		component.addRepeatableComponent = (props) => {
			const result = orig(props);

			// Inject duplicate logic
			result.items = result.items.map((item, index, arr) => {
				return {
					...item,
					actions: [
						...(item.actions || []),
						{
							label: "Duplicate",
							onClick: () => {
								const newItem = { ...item.value };
								arr.splice(index + 1, 0, newItem);
								props.onChange(arr);
							},
						},
					],
				};
			});

			return result;
		};
	},
};
