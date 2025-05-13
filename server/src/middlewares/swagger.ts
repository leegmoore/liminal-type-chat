import express from 'express';
import swaggerUi from 'swagger-ui-express';
import basicAuth from 'express-basic-auth';
import yaml from 'yaml';
import fs from 'fs';
import path from 'path';
import config from '../config';

/**
 * Creates Express router for serving Swagger UI documentation
 * @returns Express router with configured Swagger UI endpoints
 */
export function createSwaggerRouter(): express.Router {
  const router = express.Router();
  
  // Determine the base directory for OpenAPI files
  const baseDir = path.join(__dirname, '../../openapi');
  
  try {
    // Load Edge API specification
    const edgeApiSpec = yaml.parse(
      fs.readFileSync(path.join(baseDir, 'edge-api.yaml'), 'utf8')
    );
    
    // Load Domain API specification
    const domainApiSpec = yaml.parse(
      fs.readFileSync(path.join(baseDir, 'domain-api.yaml'), 'utf8')
    );
    
    // Set up Swagger UI for Edge API (publicly accessible)
    router.use(
      '/edge',
      swaggerUi.serve,
      swaggerUi.setup(edgeApiSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        swaggerOptions: {
          persistAuthorization: true,
        },
        customSiteTitle: 'Liminal Type Chat - Edge API Documentation',
      })
    );
    
    // Set up Swagger UI for Domain API (protected by basic auth in non-dev environments)
    const domainDocsMiddleware: express.RequestHandler[] = [];
    
    // Add basic authentication in non-development environments
    if (process.env.NODE_ENV !== 'development') {
      const users: Record<string, string> = {};
      const username = config.domainApiDocs?.username || 'admin';
      const password = config.domainApiDocs?.password || 'password';
      users[username] = password;
      
      domainDocsMiddleware.push(
        basicAuth({
          users,
          challenge: true,
          realm: 'Liminal Type Chat Domain API Documentation',
        })
      );
    }
    
    // Set up Domain API Swagger UI with optional authentication
    router.use(
      '/domain',
      domainDocsMiddleware,
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
    router.get('/', (_req, res) => {
      res.redirect('/docs/edge');
    });
    
  } catch (error) {
    console.error('Error setting up Swagger documentation:', error);
    
    // Return a router that serves an error message
    router.use('/', (_req, res) => {
      res.status(500).json({
        error: {
          message: 'Failed to load API documentation',
          details: process.env.NODE_ENV === 'development' 
            ? (error instanceof Error ? error.message : String(error)) 
            : 'Check server logs for details',
        }
      });
    });
  }
  
  return router;
}
