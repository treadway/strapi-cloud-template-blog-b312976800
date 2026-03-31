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
					<div style={{ padding: 20, background: "red" }}>HOURS EDITOR</div>
				);
			})}
		</div>
	);
};

export default HoursEditor;
