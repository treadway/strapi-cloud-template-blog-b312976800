#!/bin/bash

echo "Adding CMS features for beta release..."

# Create Welcome Message content type (single type)
cat > src/api/welcome-message/content-types/welcome-message/schema.json << 'EOF'
{
	"kind": "singleType",
	"collectionName": "welcome_message",
	"info": {
		"singularName": "welcome-message",
		"pluralName": "welcome-messages",
		"displayName": "Welcome Message",
		"description": "Login screen welcome message"
	},
	"options": {
		"draftAndPublish": false
	},
	"attributes": {
		"title": {
			"type": "string",
			"required": true,
			"default": "Welcome to Points4Earth"
		},
		"subtitle": {
			"type": "text",
			"required": true
		},
		"isActive": {
			"type": "boolean",
			"default": true
		}
	}
}
EOF

# Create Card Descriptions content type (single type)
cat > src/api/card-descriptions/content-types/card-descriptions/schema.json << 'EOF'
{
	"kind": "singleType",
	"collectionName": "card_descriptions",
	"info": {
		"singularName": "card-descriptions",
		"pluralName": "card-descriptions",
		"displayName": "Card Descriptions",
		"description": "Subtexts for various cards throughout the app"
	},
	"options": {
		"draftAndPublish": false
	},
	"attributes": {
		"transportationMethodsSubtext": {
			"type": "text",
			"required": true,
			"default": "Choose your eco-friendly transportation method to start earning points."
		},
		"mapSubtext": {
			"type": "text",
			"required": true,
			"default": "Track your journey and see your environmental impact in real-time."
		},
		"rewardsSubtext": {
			"type": "text",
			"required": true,
			"default": "Redeem your earned points for exciting rewards from local businesses."
		}
	}
}
EOF

# Create Level System content type (collection)
cat > src/api/level/content-types/level/schema.json << 'EOF'
{
	"kind": "collectionType",
	"collectionName": "levels",
	"info": {
		"singularName": "level",
		"pluralName": "levels",
		"displayName": "Level",
		"description": "User levels and achievement thresholds"
	},
	"options": {
		"draftAndPublish": false
	},
	"attributes": {
		"levelNumber": {
			"type": "integer",
			"required": true,
			"unique": true
		},
		"title": {
			"type": "string",
			"required": true
		},
		"pointsRequired": {
			"type": "biginteger",
			"required": true
		},
		"description": {
			"type": "text"
		},
		"isActive": {
			"type": "boolean",
			"default": true
		}
	}
}
EOF

# Create directories for API files
mkdir -p src/api/welcome-message/{controllers,routes,services}
mkdir -p src/api/card-descriptions/{controllers,routes,services}
mkdir -p src/api/level/{controllers,routes,services}

# Create Welcome Message API files
cat > src/api/welcome-message/routes/welcome-message.js << 'EOF'
'use strict';
const { createCoreRouter } = require('@strapi/strapi').factories;
module.exports = createCoreRouter('api::welcome-message.welcome-message');
EOF

cat > src/api/welcome-message/controllers/welcome-message.js << 'EOF'
'use strict';
const { createCoreController } = require('@strapi/strapi').factories;
module.exports = createCoreController('api::welcome-message.welcome-message');
EOF

cat > src/api/welcome-message/services/welcome-message.js << 'EOF'
'use strict';
const { createCoreService } = require('@strapi/strapi').factories;
module.exports = createCoreService('api::welcome-message.welcome-message');
EOF

# Create Card Descriptions API files
cat > src/api/card-descriptions/routes/card-descriptions.js << 'EOF'
'use strict';
const { createCoreRouter } = require('@strapi/strapi').factories;
module.exports = createCoreRouter('api::card-descriptions.card-descriptions');
EOF

cat > src/api/card-descriptions/controllers/card-descriptions.js << 'EOF'
'use strict';
const { createCoreController } = require('@strapi/strapi').factories;
module.exports = createCoreController('api::card-descriptions.card-descriptions');
EOF

cat > src/api/card-descriptions/services/card-descriptions.js << 'EOF'
'use strict';
const { createCoreService } = require('@strapi/strapi').factories;
module.exports = createCoreService('api::card-descriptions.card-descriptions');
EOF

# Create Level API files
cat > src/api/level/routes/level.js << 'EOF'
'use strict';
const { createCoreRouter } = require('@strapi/strapi').factories;
module.exports = createCoreRouter('api::level.level');
EOF

cat > src/api/level/controllers/level.js << 'EOF'
'use strict';
const { createCoreController } = require('@strapi/strapi').factories;
module.exports = createCoreController('api::level.level');
EOF

cat > src/api/level/services/level.js << 'EOF'
'use strict';
const { createCoreService } = require('@strapi/strapi').factories;
module.exports = createCoreService('api::level.level');
EOF

echo "✅ Created CMS content types for beta features!"
echo ""
echo "🚀 Next steps:"
echo "  1. git add ."
echo "  2. git commit -m 'Add CMS content types for beta features'"
echo "  3. git push origin main"
echo "  4. Update Reward schema for image placement"
echo "  5. Configure API permissions in admin panel"
EOF
