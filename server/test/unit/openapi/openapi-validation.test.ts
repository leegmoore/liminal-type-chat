import * as path from 'path';
import * as fs from 'fs';
import { OpenAPIV3 } from 'openapi-types';
import * as yaml from 'yaml';
import * as SwaggerParser from '@apidevtools/swagger-parser';

// Ensure the openapi directory exists
const openapiDir = path.resolve(__dirname, '../../../openapi');
if (!fs.existsSync(openapiDir)) {
  fs.mkdirSync(openapiDir, { recursive: true });
}

describe('OpenAPI Specifications', () => {
  describe('Edge API Specification', () => {
    const edgeApiPath = path.resolve(__dirname, '../../../openapi/edge-api.yaml');
    
    // Skip test if file doesn't exist
    const testFn = fs.existsSync(edgeApiPath) ? it : it.skip;
    
    testFn('should be a valid OpenAPI 3.0 document', async () => {
      const api = yaml.parse(fs.readFileSync(edgeApiPath, 'utf8')) as OpenAPIV3.Document;
      
      // Basic structure validation
      expect(api.openapi).toMatch(/^3\.\d+\.\d+$/);
      expect(api.info).toBeDefined();
      expect(api.info.title).toBeDefined();
      expect(api.info.version).toBeDefined();
      expect(api.paths).toBeDefined();
      
      // Full validation using Swagger Parser
      const validationResult = await SwaggerParser.validate(edgeApiPath);
      expect(validationResult).toBeTruthy();
    });
    
    testFn('should include conversation endpoints', async () => {
      const api = yaml.parse(fs.readFileSync(edgeApiPath, 'utf8')) as OpenAPIV3.Document;
      
      // Check for conversation endpoints
      expect(api.paths['/api/v1/conversations']).toBeDefined();
      expect(api.paths['/api/v1/conversations/{conversationId}']).toBeDefined();
      expect(api.paths['/api/v1/conversations/{conversationId}/messages']).toBeDefined();
    });
    
    testFn('should reference schema components', async () => {
      const api = yaml.parse(fs.readFileSync(edgeApiPath, 'utf8')) as OpenAPIV3.Document;
      
      // Check for schema components
      expect(api.components).toBeDefined();
      expect(api.components?.schemas).toBeDefined();
      expect(api.components?.schemas?.ConversationResponse).toBeDefined();
      expect(api.components?.schemas?.MessageResponse).toBeDefined();
      expect(api.components?.schemas?.CreateConversationRequest).toBeDefined();
      expect(api.components?.schemas?.ErrorResponse).toBeDefined();
    });
  });
  
  describe('Domain API Specification', () => {
    const domainApiPath = path.resolve(__dirname, '../../../openapi/domain-api.yaml');
    
    // Skip test if file doesn't exist
    const testFn = fs.existsSync(domainApiPath) ? it : it.skip;
    
    testFn('should be a valid OpenAPI 3.0 document', async () => {
      const api = yaml.parse(fs.readFileSync(domainApiPath, 'utf8')) as OpenAPIV3.Document;
      
      // Basic structure validation
      expect(api.openapi).toMatch(/^3\.\d+\.\d+$/);
      expect(api.info).toBeDefined();
      expect(api.info.title).toBeDefined();
      expect(api.info.version).toBeDefined();
      expect(api.paths).toBeDefined();
      
      // Full validation using Swagger Parser
      const validationResult = await SwaggerParser.validate(domainApiPath);
      expect(validationResult).toBeTruthy();
    });
    
    testFn('should include thread endpoints', async () => {
      const api = yaml.parse(fs.readFileSync(domainApiPath, 'utf8')) as OpenAPIV3.Document;
      
      // Check for thread endpoints
      expect(api.paths['/domain/threads']).toBeDefined();
      expect(api.paths['/domain/threads/{id}']).toBeDefined();
      expect(api.paths['/domain/threads/{id}/messages']).toBeDefined();
    });
    
    testFn('should reference schema components', async () => {
      const api = yaml.parse(fs.readFileSync(domainApiPath, 'utf8')) as OpenAPIV3.Document;
      
      // Check for schema components
      expect(api.components).toBeDefined();
      expect(api.components?.schemas).toBeDefined();
      expect(api.components?.schemas?.ContextThread).toBeDefined();
      expect(api.components?.schemas?.Message).toBeDefined();
    });
  });
});
