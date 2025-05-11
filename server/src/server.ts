import app from './app';
import net from 'net';

// Function to find an available port starting from the base port
const findAvailablePort = (basePort: number): Promise<number> => {
  return new Promise((resolve, reject) => {
    // Try ports from basePort to basePort + 100
    const maxPort = basePort + 100;
    let currentPort = basePort;
    
    const tryPort = () => {
      if (currentPort > maxPort) {
        return reject(new Error('No available ports found in range'));
      }
      
      const server = net.createServer();
      
      server.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          // Port is in use, try next port
          currentPort++;
          tryPort();
        } else {
          reject(err);
        }
      });
      
      server.once('listening', () => {
        const foundPort = currentPort;
        server.close(() => {
          resolve(foundPort);
        });
      });
      
      server.listen(currentPort);
    };
    
    tryPort();
  });
};

// Get base port from config and find available port
const startServer = async () => {
  try {
    // Start from base port 9000
    const port = await findAvailablePort(9000);
    
    // Start the server
    app.listen(port, () => {
      console.log(`Liminal Type Chat server listening on port ${port}`);
      console.log(`http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Initialize server
startServer();
