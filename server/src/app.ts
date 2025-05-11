import express from 'express';
// Path module will be used later for serving static files
// import path from 'path';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes
import { createHealthRoutes } from './routes/domain/health';
import { HealthService } from './services/core/health-service';
import { errorHandler } from './middleware/error-handler';

// Load environment variables
dotenv.config();

// Create Express application
const app = express();

// Middleware
app.use(morgan('dev')); // Request logging
app.use(cors()); // CORS headers
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Create services
const healthService = new HealthService();

// Mount routes
app.use(createHealthRoutes(healthService));

// Serve static files from the public directory (will contain the UI build)
// Uncomment when UI build is available
// app.use(express.static(path.join(__dirname, '../public')));

// Catch-all route for SPA (React frontend)
// Uncomment when UI build is available
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../public/index.html'));
// });

// Mount error handler middleware
app.use(errorHandler);

export default app;
