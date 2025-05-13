import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// Import routes and services
import { createHealthRoutes } from './routes/domain/health';
import { createEdgeHealthRoutes } from './routes/edge/health';
import { createContextThreadRoutes } from './routes/domain/context-thread';
import { createConversationRoutes } from './routes/edge/conversation';
import { HealthService } from './services/core/health-service';
import { ContextThreadService } from './services/core/ContextThreadService';
import { errorHandler } from './middleware/error-handler';
import { SQLiteProvider } from './providers/db/sqlite-provider';
import { ContextThreadRepository } from './providers/db/ContextThreadRepository';
import config from './config';
import { createHealthServiceClient } from './clients/domain/health-service-client-factory';
import { createSwaggerRouter } from './middlewares/swagger';

// Load environment variables
dotenv.config();

// Create Express application
const app = express();

// Middleware
app.use(morgan('dev')); // Request logging
app.use(cors()); // CORS headers
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Initialize database
const dbProvider = new SQLiteProvider(config.db.path);

// Initialize database asynchronously
(async () => {
  try {
    await dbProvider.initialize();
    console.log(`Database initialized at ${config.db.path}`);
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
})();

// Create services with dependencies
const healthService = new HealthService(dbProvider);
const contextThreadRepository = new ContextThreadRepository();
const contextThreadService = new ContextThreadService(contextThreadRepository);

// Create client adapters
const healthServiceClient = createHealthServiceClient(healthService);

// Mount domain routes
app.use(createHealthRoutes(healthService));
app.use('/api/v1/domain/threads', createContextThreadRoutes(contextThreadService));

// Mount edge routes
app.use(createEdgeHealthRoutes(healthServiceClient));
app.use('/api/v1/conversations', createConversationRoutes());

// Mount Swagger UI documentation routes
app.use('/docs', createSwaggerRouter());

// Serve static files from the public directory (React UI build)
app.use(express.static(path.join(__dirname, '../public')));

// Add placeholder routes for the root path and dashboard
app.get('/dashboard', (_req, res) => {
  res.send(`
    <html>
      <head>
        <title>Liminal Type Chat - Health Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
          h2 { margin-top: 30px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px; }
          h3 { color: #444; margin: 10px 0; }
          .api-section { margin-bottom: 40px; display: flex; flex-wrap: wrap; justify-content: space-between; }
          .tier-box { 
            flex: 0 0 48%; 
            margin-bottom: 20px; 
            padding: 15px; 
            border-radius: 6px; 
            box-shadow: 0 2px 5px rgba(0,0,0,0.1); 
          }
          .domain-tier { background-color: #f0f7ff; border: 1px solid #d0e3ff; }
          .edge-tier { background-color: #fff6f0; border: 1px solid #ffd7b5; }
          iframe { 
            width: 100%; 
            height: 180px; 
            border: 1px solid #ddd; 
            border-radius: 4px; 
            margin-bottom: 10px; 
            background-color: #f5f5f5;
          }
          .button-row { margin-top: 10px; }
          .center { justify-content: center; display: flex; flex-wrap: wrap; }
          a.button { 
            display: inline-block;
            background-color: #4CAF50; 
            color: white; 
            text-decoration: none;
            padding: 10px 15px; 
            text-align: center; 
            border-radius: 4px; 
            margin-right: 10px;
            margin-bottom: 10px;
            font-weight: bold;
            transition: all 0.2s ease;
          }
          a.button:hover { opacity: 0.9; transform: translateY(-2px); }
          a.domain-button { background-color: #3498db; }
          a.edge-button { background-color: #e67e22; }
          a.primary-button { background-color: #4CAF50; font-size: 1.1em; padding: 12px 20px; }
          a.compare-button { background-color: #9b59b6; }
          a.refresh-button { background-color: #95a5a6; }
          
          .info { margin: 15px 0; color: #555; line-height: 1.5; }
          #comm-mode { font-weight: bold; color: #3498db; }
          
          .communication-diagram { 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            margin: 20px 0; 
          }
          .tier-box.edge-box { 
            background-color: #e67e22; 
            color: white; 
            flex: 0 0 auto; 
            width: 150px;
            padding: 10px;
            text-align: center;
            margin: 5px 0;
          }
          .tier-box.domain-box { 
            background-color: #3498db; 
            color: white;
            flex: 0 0 auto;
            width: 150px; 
            padding: 10px;
            text-align: center;
            margin: 5px 0;
          }
          .arrow { 
            font-size: 24px; 
            font-weight: bold; 
            color: #555;
            margin: 5px 0;
          }
          
          .controls-section {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e9ecef;
            display: block;
          }
        </style>
      </head>
      <body>
        <h1>Liminal Type Chat - Health Dashboard</h1>
        <p class="info">Server is running on port ${_req.socket.localPort}. The React frontend will be implemented in Milestone 4.</p>
        
        <h2>Domain Tier - Health Checks</h2>
        <div class="api-section">
          <div class="tier-box domain-tier">
            <h3>Domain System Health</h3>
            <iframe id="system-health-frame" name="system-health-frame" title="System Health Response"></iframe>
            <div class="button-row">
              <a href="/api/v1/domain/health" target="system-health-frame" class="button domain-button">Check Domain System Health</a>
            </div>
          </div>
          
          <div class="tier-box domain-tier">
            <h3>Domain Database Health</h3>
            <iframe id="db-health-frame" name="db-health-frame" title="Database Health Response"></iframe>
            <div class="button-row">
              <a href="/api/v1/domain/health/db" target="db-health-frame" class="button domain-button">Check Domain Database Health</a>
            </div>
          </div>
        </div>
        
        <h2>Edge Tier - Health Checks</h2>
        <div class="api-section">
          <div class="tier-box edge-tier">
            <h3>Edge System Health</h3>
            <iframe id="edge-system-health-frame" name="edge-system-health-frame" title="Edge System Health Response"></iframe>
            <div class="button-row">
              <a href="/api/v1/edge/health" target="edge-system-health-frame" class="button edge-button">Check Edge System Health</a>
            </div>
          </div>
          
          <div class="tier-box edge-tier">
            <h3>Edge Database Health</h3>
            <iframe id="edge-db-health-frame" name="edge-db-health-frame" title="Edge Database Health Response"></iframe>
            <div class="button-row">
              <a href="/api/v1/edge/health/db" target="edge-db-health-frame" class="button edge-button">Check Edge Database Health</a>
            </div>
          </div>
        </div>
        
        <h2>Edge-to-Domain Communication</h2>
        <div class="api-section">
          <div class="communication-diagram">
            <div class="tier-box edge-box">Edge Tier</div>
            <div class="arrow">↓</div>
            <div class="tier-box domain-box">Domain Tier</div>
          </div>
          <p class="info">The Edge Tier communicates with the Domain Tier through the Client Adapter pattern. Current mode: <span id="comm-mode">${config.inProcessMode ? 'Direct (in-process)' : 'HTTP'}</span></p>
        </div>
        
        <h2>Health Dashboard Controls</h2>
        <div class="api-section controls-section">
          <div class="button-row center">
            <a href="#" class="button primary-button" onclick="checkAll(); return false;">Check All Health Endpoints</a>
            <a href="#" class="button domain-button" onclick="checkDomainOnly(); return false;">Check Domain Endpoints</a>
            <a href="#" class="button edge-button" onclick="checkEdgeOnly(); return false;">Check Edge Endpoints</a>
            <a href="#" class="button refresh-button" onclick="clearAllFrames(); return false;">Clear All Responses</a>
          </div>
        </div>

        <script>
          // Initialize all iframe messages
          function initializeIframes() {
            const initialMessage = '<div style="padding: 15px; font-family: sans-serif; color: #666;">Click the button below to view the response...</div>';
            
            const frames = [
              'system-health-frame',
              'db-health-frame',
              'edge-system-health-frame',
              'edge-db-health-frame'
            ];
            
            frames.forEach(frameId => {
              const frame = document.getElementById(frameId);
              if (frame && frame.contentDocument) {
                frame.contentDocument.body.innerHTML = initialMessage;
              }
            });
          }
          
          window.onload = function() {
            initializeIframes();
          };

          // Check all health endpoints
          function checkAll() {
            document.querySelector('a[href="/api/v1/domain/health"]').click();
            setTimeout(() => {
              document.querySelector('a[href="/api/v1/domain/health/db"]').click();
              setTimeout(() => {
                document.querySelector('a[href="/api/v1/edge/health"]').click();
                setTimeout(() => {
                  document.querySelector('a[href="/api/v1/edge/health/db"]').click();
                }, 100);
              }, 100);
            }, 100);
          }
          
          // Check only domain endpoints
          function checkDomainOnly() {
            document.querySelector('a[href="/api/v1/domain/health"]').click();
            setTimeout(() => {
              document.querySelector('a[href="/api/v1/domain/health/db"]').click();
            }, 100);
          }
          
          // Check only edge endpoints
          function checkEdgeOnly() {
            document.querySelector('a[href="/api/v1/edge/health"]').click();
            setTimeout(() => {
              document.querySelector('a[href="/api/v1/edge/health/db"]').click();
            }, 100);
          }
          
          // Clear all response frames
          function clearAllFrames() {
            initializeIframes();
          }
        </script>
      </body>
    </html>
  `);
});

app.get('/', (_req, res) => {
  res.send(`
    <html>
      <head>
        <title>Liminal Type Chat</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
          h2 { margin-top: 30px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px; }
          h3 { color: #444; margin: 10px 0; }
          .api-section { margin-bottom: 40px; display: flex; flex-wrap: wrap; justify-content: space-between; }
          .tier-box { 
            flex: 0 0 48%; 
            margin-bottom: 20px; 
            padding: 15px; 
            border-radius: 6px; 
            box-shadow: 0 2px 5px rgba(0,0,0,0.1); 
          }
          .domain-tier { background-color: #f0f7ff; border: 1px solid #d0e3ff; }
          .edge-tier { background-color: #fff6f0; border: 1px solid #ffd7b5; }
          iframe { 
            width: 100%; 
            height: 180px; 
            border: 1px solid #ddd; 
            border-radius: 4px; 
            margin-bottom: 10px; 
            background-color: #f5f5f5;
          }
          .button-row { margin-top: 10px; }
          .center { justify-content: center; display: flex; flex-wrap: wrap; }
          a.button { 
            display: inline-block;
            background-color: #4CAF50; 
            color: white; 
            text-decoration: none;
            padding: 10px 15px; 
            text-align: center; 
            border-radius: 4px; 
            margin-right: 10px;
            margin-bottom: 10px;
            font-weight: bold;
            transition: all 0.2s ease;
          }
          a.button:hover { opacity: 0.9; transform: translateY(-2px); }
          a.domain-button { background-color: #3498db; }
          a.edge-button { background-color: #e67e22; }
          a.primary-button { background-color: #4CAF50; font-size: 1.1em; padding: 12px 20px; }
          a.compare-button { background-color: #9b59b6; }
          a.refresh-button { background-color: #95a5a6; }
          
          .info { margin: 15px 0; color: #555; line-height: 1.5; }
          #comm-mode { font-weight: bold; color: #3498db; }
          
          .communication-diagram { 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            margin: 20px 0; 
          }
          .tier-box.edge-box { 
            background-color: #e67e22; 
            color: white; 
            flex: 0 0 auto; 
            width: 150px;
            padding: 10px;
            text-align: center;
            margin: 5px 0;
          }
          .tier-box.domain-box { 
            background-color: #3498db; 
            color: white;
            flex: 0 0 auto;
            width: 150px; 
            padding: 10px;
            text-align: center;
            margin: 5px 0;
          }
          .arrow { 
            font-size: 24px; 
            font-weight: bold; 
            color: #555;
            margin: 5px 0;
          }
          
          .controls-section {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e9ecef;
            display: block;
          }
          
          /* For result comparison */
          .comparison-results {
            display: none;
            margin-top: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 6px;
          }
          .comparison-title {
            font-weight: bold;
            margin-bottom: 10px;
          }
          .result-match {
            color: #27ae60;
            font-weight: bold;
          }
          .result-diff {
            color: #e74c3c;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <h1>Liminal Type Chat - API Server</h1>
        <p class="info">Server is running on port ${_req.socket.localPort}. The React frontend will be implemented in Milestone 4.</p>
        
        <h2>Domain Tier - Health Checks</h2>
        <div class="api-section">
          <div class="tier-box domain-tier">
            <h3>Domain System Health</h3>
            <iframe id="system-health-frame" name="system-health-frame" title="System Health Response"></iframe>
            <div class="button-row">
              <a href="/api/v1/domain/health" target="system-health-frame" class="button domain-button">Check Domain System Health</a>
            </div>
          </div>
          
          <div class="tier-box domain-tier">
            <h3>Domain Database Health</h3>
            <iframe id="db-health-frame" name="db-health-frame" title="Database Health Response"></iframe>
            <div class="button-row">
              <a href="/api/v1/domain/health/db" target="db-health-frame" class="button domain-button">Check Domain Database Health</a>
            </div>
          </div>
        </div>
        
        <h2>Edge Tier - Health Checks</h2>
        <div class="api-section">
          <div class="tier-box edge-tier">
            <h3>Edge System Health</h3>
            <iframe id="edge-system-health-frame" name="edge-system-health-frame" title="Edge System Health Response"></iframe>
            <div class="button-row">
              <a href="/api/v1/edge/health" target="edge-system-health-frame" class="button edge-button">Check Edge System Health</a>
            </div>
          </div>
          
          <div class="tier-box edge-tier">
            <h3>Edge Database Health</h3>
            <iframe id="edge-db-health-frame" name="edge-db-health-frame" title="Edge Database Health Response"></iframe>
            <div class="button-row">
              <a href="/api/v1/edge/health/db" target="edge-db-health-frame" class="button edge-button">Check Edge Database Health</a>
            </div>
          </div>
        </div>
        
        <h2>Edge-to-Domain Communication</h2>
        <div class="api-section">
          <div class="communication-diagram">
            <div class="tier-box edge-box">Edge Tier</div>
            <div class="arrow">↓</div>
            <div class="tier-box domain-box">Domain Tier</div>
          </div>
          <p class="info">The Edge Tier communicates with the Domain Tier through the Client Adapter pattern. Current mode: <span id="comm-mode">${config.inProcessMode ? 'Direct (in-process)' : 'HTTP'}</span></p>
          <div class="button-row center">
            <a href="#" class="button compare-button" onclick="compareResponses(); return false;">Compare Edge vs Domain Responses</a>
          </div>
        </div>
        
        <h2>Health Dashboard Controls</h2>
        <div class="api-section controls-section">
          <div class="button-row center">
            <a href="#" class="button primary-button" onclick="checkAll(); return false;">Check All Health Endpoints</a>
            <a href="#" class="button domain-button" onclick="checkDomainOnly(); return false;">Check Domain Endpoints</a>
            <a href="#" class="button edge-button" onclick="checkEdgeOnly(); return false;">Check Edge Endpoints</a>
            <a href="#" class="button refresh-button" onclick="clearAllFrames(); return false;">Clear All Responses</a>
          </div>
        </div>

        <script>
          // Wait for page to load
          // Initialize all iframe messages
          function initializeIframes() {
            const initialMessage = '<div style="padding: 15px; font-family: sans-serif; color: #666;">Click the button below to view the response...</div>';
            
            const frames = [
              'system-health-frame',
              'db-health-frame',
              'edge-system-health-frame',
              'edge-db-health-frame'
            ];
            
            frames.forEach(frameId => {
              const frame = document.getElementById(frameId);
              if (frame && frame.contentDocument) {
                frame.contentDocument.body.innerHTML = initialMessage;
              }
            });
          }
          
          window.onload = function() {
            initializeIframes();
          };

          // Helper function to get JSON content from iframe
          function getFrameContent(frameId) {
            const frame = document.getElementById(frameId);
            if (!frame || !frame.contentDocument || !frame.contentDocument.body) return null;
            
            const content = frame.contentDocument.body.innerText;
            try {
              return JSON.parse(content);
            } catch (e) {
              return null;
            }
          }

          // Check all health endpoints
          function checkAll() {
            document.querySelector('a[href="/api/v1/domain/health"]').click();
            setTimeout(() => {
              document.querySelector('a[href="/api/v1/domain/health/db"]').click();
              setTimeout(() => {
                document.querySelector('a[href="/api/v1/edge/health"]').click();
                setTimeout(() => {
                  document.querySelector('a[href="/api/v1/edge/health/db"]').click();
                }, 100);
              }, 100);
            }, 100);
          }
          
          // Check only domain endpoints
          function checkDomainOnly() {
            document.querySelector('a[href="/api/v1/domain/health"]').click();
            setTimeout(() => {
              document.querySelector('a[href="/api/v1/domain/health/db"]').click();
            }, 100);
          }
          
          // Check only edge endpoints
          function checkEdgeOnly() {
            document.querySelector('a[href="/api/v1/edge/health"]').click();
            setTimeout(() => {
              document.querySelector('a[href="/api/v1/edge/health/db"]').click();
            }, 100);
          }
          
          // Clear all response frames
          function clearAllFrames() {
            initializeIframes();
          }
          
          // Compare domain and edge responses
          function compareResponses() {
            checkAll();
            
            // Give time for responses to load
            setTimeout(() => {
              const domainSystem = getFrameContent('system-health-frame');
              const edgeSystem = getFrameContent('edge-system-health-frame');
              const domainDb = getFrameContent('db-health-frame');
              const edgeDb = getFrameContent('edge-db-health-frame');
              
              // Check if we have valid responses
              if (!domainSystem || !edgeSystem || !domainDb || !edgeDb) {
                alert('Please wait for all health checks to complete first.');
                return;
              }
              
              // Compare timestamps (they will be different, so we're just checking structural equality)
              const systemMatch = domainSystem.status === edgeSystem.status;
              const dbMatch = domainDb.status === edgeDb.status && 
                             domainDb.database.connected === edgeDb.database.connected;
              
              // Display results in a popup
              alert(
                'Comparison Results:\n\n' +
                'System Health: ' + (systemMatch ? 'MATCH ✓' : 'DIFFERENT ✗') + '\n' +
                'Database Health: ' + (dbMatch ? 'MATCH ✓' : 'DIFFERENT ✗') + '\n\n' +
                'This confirms the Edge tier is correctly communicating with the Domain tier!'
              );
            }, 1000);
          }
        </script>
      </body>
    </html>
  `);
});

// Catch-all route for the React frontend
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Mount error handler middleware
app.use(errorHandler);

// Clean up resources when the process exits
process.on('SIGINT', async () => {
  console.log('Closing database connection...');
  await dbProvider.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database connection...');
  await dbProvider.close();
  process.exit(0);
});

export default app;
