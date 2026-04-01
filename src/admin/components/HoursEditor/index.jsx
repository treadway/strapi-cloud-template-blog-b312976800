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

const HoursEditor = ({ value = {}, onChange, name }) => {
	const updateDay = (day, field, val) => {
		const updated = {
			...value,
			[day]: {
				...value[day],
				[field]: val,
			},
		};

		onChange({ target: { name, value: updated } });
	};

	return (
		<div>
			{days.map((day) => {
				const data = value[day] || {};

				return (
					<div key={day} style={{ marginBottom: 12 }}>
						<strong>{day}</strong>

						<div style={{ display: "flex", gap: 8 }}>
							<label>
								Closed
								<input
									type="checkbox"
									checked={data.closed || false}
									onChange={(e) => updateDay(day, "closed", e.target.checked)}
								/>
							</label>

							{!data.closed && (
								<>
									<input
										type="time"
										value={data.open || ""}
										onChange={(e) => updateDay(day, "open", e.target.value)}
									/>
									<input
										type="time"
										value={data.close || ""}
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
