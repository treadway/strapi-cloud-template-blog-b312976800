import React from "react";

const days = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday",
];

const defaultHours = {
	Monday: { open: "09:00", close: "17:00", closed: false },
	Tuesday: { open: "09:00", close: "17:00", closed: false },
	Wednesday: { open: "09:00", close: "17:00", closed: false },
	Thursday: { open: "09:00", close: "17:00", closed: false },
	Friday: { open: "09:00", close: "17:00", closed: false },
	Saturday: { open: "10:00", close: "16:00", closed: false },
	Sunday: { open: "", close: "", closed: true },
};

const HoursEditor = ({ value, onChange, name }) => {
	const hours = value && Object.keys(value).length ? value : defaultHours;

	const updateDay = (day, field, val) => {
		const updated = {
			...hours,
			[day]: {
				...hours[day],
				[field]: val,
			},
		};

		onChange({ target: { name, value: updated } });
	};

	return (
		<div style={{ padding: 12 }}>
			{days.map((day) => {
				const data = hours[day];

				return (
					<div key={day} style={{ marginBottom: 12 }}>
						<strong>{day}</strong>

						<div style={{ display: "flex", gap: 8, marginTop: 4 }}>
							<label>
								Closed
								<input
									type="checkbox"
									checked={data.closed}
									onChange={(e) => updateDay(day, "closed", e.target.checked)}
								/>
							</label>

							{!data.closed && (
								<>
									<input
										type="time"
										value={data.open}
										onChange={(e) => updateDay(day, "open", e.target.value)}
									/>
									<input
										type="time"
										value={data.close}
										onChange={(e) => updateDay(day, "close", e.target.value)}
									/>
								</>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default HoursEditor;
