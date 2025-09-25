#!/bin/bash

# Create Strapi Content Types and API Infrastructure
# Run this from your Strapi project root directory

echo "Creating Strapi content types and API infrastructure..."

# Create component directories
mkdir -p src/components/content

# Create About Us Content API structure
mkdir -p src/api/about-us-content/content-types/about-us-content
mkdir -p src/api/about-us-content/controllers
mkdir -p src/api/about-us-content/routes
mkdir -p src/api/about-us-content/services

# Create Our Future Content API structure
mkdir -p src/api/our-future-content/content-types/our-future-content
mkdir -p src/api/our-future-content/controllers
mkdir -p src/api/our-future-content/routes
mkdir -p src/api/our-future-content/services

# Create component schema files
cat > src/components/content/text-section.json << 'EOF'
{
	"collectionName": "components_content_text_sections",
	"info": {
		"displayName": "Text Section",
		"description": "A text section with optional image"
	},
	"options": {},
	"attributes": {
		"text": {
			"type": "text",
			"required": true
		},
		"image": {
			"type": "media",
			"multiple": false,
			"required": false,
			"allowedTypes": ["images"]
		}
	}
}
EOF

cat > src/components/content/text-section-with-title.json << 'EOF'
{
	"collectionName": "components_content_text_sections_with_title",
	"info": {
		"displayName": "Text Section with Title",
		"description": "A text section with title and optional image"
	},
	"options": {},
	"attributes": {
		"title": {
			"type": "string",
			"required": true
		},
		"text": {
			"type": "text",
			"required": true
		},
		"image": {
			"type": "media",
			"multiple": false,
			"required": false,
			"allowedTypes": ["images"]
		}
	}
}
EOF

# Create About Us Content schema
cat > src/api/about-us-content/content-types/about-us-content/schema.json << 'EOF'
{
	"kind": "singleType",
	"collectionName": "about_us_content",
	"info": {
		"singularName": "about-us-content",
		"pluralName": "about-us-contents",
		"displayName": "About Us Content",
		"description": "About us page content and sections"
	},
	"options": {
		"draftAndPublish": false
	},
	"attributes": {
		"title": {
			"type": "string",
			"required": true,
			"default": "And, About Us..."
		},
		"sections": {
			"type": "component",
			"repeatable": true,
			"component": "content.text-section"
		},
		"contactTitle": {
			"type": "string",
			"required": true,
			"default": "Contact Us"
		},
		"contactDescription": {
			"type": "text",
			"required": true
		}
	}
}
EOF

# Create Our Future Content schema
cat > src/api/our-future-content/content-types/our-future-content/schema.json << 'EOF'
{
	"kind": "singleType",
	"collectionName": "our_future_content",
	"info": {
		"singularName": "our-future-content",
		"pluralName": "our-future-contents",
		"displayName": "Our Future Content",
		"description": "Our future page content and sections"
	},
	"options": {
		"draftAndPublish": false
	},
	"attributes": {
		"whatsNextTitle": {
			"type": "string",
			"required": true,
			"default": "What's Next!"
		},
		"whatsNextText": {
			"type": "text",
			"required": true
		},
		"whatsNextAdditionalText": {
			"type": "text"
		},
		"whatsNextImage": {
			"type": "media",
			"multiple": false,
			"required": false,
			"allowedTypes": ["images"]
		},
		"sections": {
			"type": "component",
			"repeatable": true,
			"component": "content.text-section-with-title"
		}
	}
}
EOF

# Create About Us API files
cat > src/api/about-us-content/routes/about-us-content.js << 'EOF'
'use strict';

/**
 * about-us-content router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::about-us-content.about-us-content');
EOF

cat > src/api/about-us-content/controllers/about-us-content.js << 'EOF'
'use strict';

/**
 * about-us-content controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::about-us-content.about-us-content');
EOF

cat > src/api/about-us-content/services/about-us-content.js << 'EOF'
'use strict';

/**
 * about-us-content service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::about-us-content.about-us-content');
EOF

# Create Our Future API files
cat > src/api/our-future-content/routes/our-future-content.js << 'EOF'
'use strict';

/**
 * our-future-content router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::our-future-content.our-future-content');
EOF

cat > src/api/our-future-content/controllers/our-future-content.js << 'EOF'
'use strict';

/**
 * our-future-content controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::our-future-content.our-future-content');
EOF

cat > src/api/our-future-content/services/our-future-content.js << 'EOF'
'use strict';

/**
 * our-future-content service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::our-future-content.our-future-content');
EOF

echo "✅ Created all content type files and API infrastructure!"
echo ""
echo "📁 Created:"
echo "  - Component schemas in src/components/content/"
echo "  - About Us Content API in src/api/about-us-content/"
echo "  - Our Future Content API in src/api/our-future-content/"
echo ""
echo "🚀 Next steps:"
echo "  1. git add ."
echo "  2. git commit -m 'Add CMS content types for About Us and Our Future'"
echo "  3. git push origin main"
echo "  4. Wait for Strapi Cloud deployment"
echo "  5. Configure API permissions in admin panel"
