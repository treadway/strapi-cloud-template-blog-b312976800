module.exports = {
	async beforeCreate(event) {
		const { data } = event.params;

		// If hours already provided, do nothing
		if (data.hours && data.hours.length) return;

		data.hours = [
			{
				day: "Monday",
				open: "09:00:00.000",
				close: "17:00:00.000",
				isClosed: false,
			},
			{
				day: "Tuesday",
				open: "09:00:00.000",
				close: "17:00:00.000",
				isClosed: false,
			},
			{
				day: "Wednesday",
				open: "09:00:00.000",
				close: "17:00:00.000",
				isClosed: false,
			},
			{
				day: "Thursday",
				open: "09:00:00.000",
				close: "17:00:00.000",
				isClosed: false,
			},
			{
				day: "Friday",
				open: "09:00:00.000",
				close: "17:00:00.000",
				isClosed: false,
			},
			{
				day: "Saturday",
				open: "10:00:00.000",
				close: "16:00:00.000",
				isClosed: false,
			},
			{ day: "Sunday", open: null, close: null, isClosed: true },
		];
	},
};
