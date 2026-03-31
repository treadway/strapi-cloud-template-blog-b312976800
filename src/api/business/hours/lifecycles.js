const formatTime = (time) => {
	if (!time) return "";
	const [h, m] = time.split(":");
	const hour = parseInt(h, 10);
	const ampm = hour >= 12 ? "PM" : "AM";
	const formattedHour = ((hour + 11) % 12) + 1;
	return `${formattedHour}:${m} ${ampm}`;
};

const buildLabel = (data) => {
	if (!data.day) return "";

	if (data.isClosed) {
		return `${data.day} — Closed`;
	}

	return `${data.day} — ${formatTime(data.open)}–${formatTime(data.close)}`;
};

module.exports = {
	beforeCreate(event) {
		event.params.data.label = buildLabel(event.params.data);
	},
	beforeUpdate(event) {
		event.params.data.label = buildLabel(event.params.data);
	},
};
