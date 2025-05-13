const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8766;

// Determine the base directory for OpenAPI files
const baseDir = path.join(__dirname, '../openapi');

try {
  // Load Edge API specification
  const edgeApiSpec = YAML.parse(
    fs.readFileSync(path.join(baseDir, 'edge-api.yaml'), 'utf8')
  );
  
  // Load Domain API specification
  const domainApiSpec = YAML.parse(
    fs.readFileSync(path.join(baseDir, 'domain-api.yaml'), 'utf8')
  );
  
  // Set up Swagger UI for Edge API
  app.use(
    '/docs/edge',
    swaggerUi.serve,
    swaggerUi.setup(edgeApiSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
      },
      customSiteTitle: 'Liminal Type Chat - Edge API Documentation',
    })
  );
  
  // Set up Swagger UI for Domain API
  app.use(
    '/docs/domain',
    swaggerUi.serve,
    swaggerUi.setup(domainApiSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
      },
      customSiteTitle: 'Liminal Type Chat - Domain API Documentation',
    })
  );
  
  // Root path redirects to Edge API docs
  app.get('/', (req, res) => {
    res.redirect('/docs/edge');
  });

  app.listen(PORT, () => {
    console.log(`Swagger UI server running at http://localhost:${PORT}`);
    console.log(`Edge API docs: http://localhost:${PORT}/docs/edge`);
    console.log(`Domain API docs: http://localhost:${PORT}/docs/domain`);
  });
  
} catch (error) {
  console.error('Error setting up Swagger documentation:', error);
}
