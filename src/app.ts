import express from 'express';
import path from 'path';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Express application
const app = express();

// Middleware
app.use(morgan('dev')); // Request logging
app.use(cors()); // CORS headers
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Routes will be mounted here
// Example: app.use('/api/v1/domain/health', domainHealthRoutes);

// Serve static files from the public directory (will contain the UI build)
// Uncomment when UI build is available
// app.use(express.static(path.join(__dirname, '../public')));

// Catch-all route for SPA (React frontend)
// Uncomment when UI build is available
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../public/index.html'));
// });

// Error handler middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

export default app;
