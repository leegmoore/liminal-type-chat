import app from './app';
import config from './config';

// Get port from configuration
const startServer = async () => {
  try {
    const port = config.port;
    
    const portSource = process.env.PORT || 'using default';
    console.log(`Starting server with configured port: ${port} (from env: ${portSource})`);
    const server = app.listen(port, () => {
      console.log(`Liminal Type Chat server listening on port ${port}`);
      console.log(`http://localhost:${port}`);
      console.log(`Dashboard URL: http://localhost:${port}/dashboard`);
    });
    
    // Handle graceful shutdown
    const handleShutdown = async () => {
      console.log('\nShutting down server...');
      server.close(() => {
        console.log('Server closed.');
        process.exit(0);
      });
      
      // Force close after 5 seconds if server doesn't close gracefully
      setTimeout(() => {
        console.log('Forcing server shutdown...');
        process.exit(1);
      }, 5000);
    };
    
    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Initialize server
startServer();
