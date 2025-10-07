async verifyCode(ctx) {
	try {
		const { phoneNumber, code } = ctx.request.body;

		if (!phoneNumber || !code) {
			return ctx.badRequest('Phone number and code are required');
		}

		console.log('Verifying code for:', phoneNumber);

		// Verify code with Twilio
		const verificationCheck = await twilioClient.verify.v2
			.services(verifyServiceSid)
			.verificationChecks.create({
				to: phoneNumber,
				code: code,
			});

		if (verificationCheck.status !== 'approved') {
			return ctx.badRequest('Invalid verification code');
		}

		console.log('Code verified successfully');

		// Find or create participant
		let participant = await strapi.db.query('api::participant.participant').findOne({
			where: { phone: phoneNumber },
		});

		if (!participant) {
			console.log('Creating new participant');
			participant = await strapi.db.query('api::participant.participant').create({
				data: {
					phone: phoneNumber,
					name: 'New Participant',
					totalPoints: 0,
					availablePoints: 0,
					level: 1,
				},
			});
		} else {
			console.log('Found existing participant:', participant.id);
		}

		// NOW find or create a Users & Permissions user
		const pluginStore = await strapi.store({ type: 'plugin', name: 'users-permissions' });
		const settings = await pluginStore.get({ key: 'advanced' });
		const defaultRole = await strapi.db.query('plugin::users-permissions.role').findOne({
			where: { type: settings.default_role },
		});

		let user = await strapi.db.query('plugin::users-permissions.user').findOne({
			where: { username: phoneNumber },
		});

		if (!user) {
			console.log('Creating new Users & Permissions user');
			user = await strapi.db.query('plugin::users-permissions.user').create({
				data: {
					username: phoneNumber,
					email: `${phoneNumber}@placeholder.com`, // Strapi requires email
					phone: phoneNumber,
					confirmed: true,
					blocked: false,
					role: defaultRole.id,
				},
			});
		} else {
			console.log('Found existing user:', user.id);
		}

		// Create JWT token with USER id, not participant id
		const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
			id: user.id, // This must be the user ID
		});

		return ctx.send({
			jwt,
			participant: {
				id: participant.id,
				phone: participant.phone,
				name: participant.name,
				totalPoints: participant.totalPoints,
				availablePoints: participant.availablePoints,
				level: participant.level,
			},
		});
	} catch (error) {
		console.error('Error verifying code:', error);
		return ctx.badRequest(error.message);
	}
}
