import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes and services
import { createHealthRoutes } from './routes/domain/health';
import { HealthService } from './services/core/health-service';
import { errorHandler } from './middleware/error-handler';
import { SQLiteProvider } from './providers/db/sqlite-provider';
import config from './config';

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

// Mount routes
app.use(createHealthRoutes(healthService));

// Serve static files from the public directory (will contain the UI build)
// We'll enable this when we implement the React UI in Milestone 4
// app.use(express.static(path.join(__dirname, '../public')));

// Add a placeholder route for the root path
app.get('/', (_req, res) => {
  res.send(`
    <html>
      <head>
        <title>Liminal Type Chat</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
          .api-section { margin-bottom: 40px; }
          iframe { 
            width: 100%; 
            height: 200px; 
            border: 1px solid #ddd; 
            border-radius: 4px; 
            margin-bottom: 10px; 
            background-color: #f5f5f5;
          }
          .button-row { margin-top: 10px; }
          a.button { 
            display: inline-block;
            background-color: #4CAF50; 
            color: white; 
            text-decoration: none;
            padding: 10px 15px; 
            text-align: center; 
            border-radius: 4px; 
            margin-right: 10px;
            font-weight: bold;
          }
          a.button:hover { background-color: #45a049; }
          h2 { margin-top: 30px; color: #333; }
          .info { margin-bottom: 15px; color: #555; }
        </style>
      </head>
      <body>
        <h1>Liminal Type Chat - API Server</h1>
        <p class="info">Server is running on port ${_req.socket.localPort}. The React frontend will be implemented in Milestone 4.</p>
        
        <h2>System Health Check</h2>
        <div class="api-section">
          <iframe id="system-health-frame" name="system-health-frame" title="System Health Response"></iframe>
          <div class="button-row">
            <a href="/api/v1/domain/health" target="system-health-frame" class="button">Check System Health</a>
          </div>
        </div>
        
        <h2>Database Health Check</h2>
        <div class="api-section">
          <iframe id="db-health-frame" name="db-health-frame" title="Database Health Response"></iframe>
          <div class="button-row">
            <a href="/api/v1/domain/health/db" target="db-health-frame" class="button">Check Database Health</a>
          </div>
        </div>
        
        <h2>Check All Health Endpoints</h2>
        <div class="api-section">
          <div class="button-row">
            <a href="#" class="button" onclick="checkAll(); return false;">Check All Health Endpoints</a>
          </div>
        </div>

        <script>
          // Wait for page to load
          window.onload = function() {
            // Add a message to the iframes
            document.getElementById('system-health-frame').contentDocument.body.innerHTML = 
              '<div style="padding: 15px; font-family: sans-serif;">Click the button below to view the system health check response...</div>';
            document.getElementById('db-health-frame').contentDocument.body.innerHTML = 
              '<div style="padding: 15px; font-family: sans-serif;">Click the button below to view the database health check response...</div>';
          };

          function checkAll() {
            document.querySelector('a[href="/api/v1/domain/health"]').click();
            setTimeout(() => {
              document.querySelector('a[href="/api/v1/domain/health/db"]').click();
            }, 100);
          }
        </script>
      </body>
    </html>
  `);
});

// Catch-all route will be implemented when we add the React frontend in Milestone 4
// app.get('*', (_req, res) => {
//   res.sendFile(path.join(__dirname, '../public/index.html'));
// });

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
