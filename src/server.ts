import app from './app';

// Get port from environment or use default
const port = process.env.PORT || 3000;

// Start the server
app.listen(port, () => {
  console.log(`Liminal Type Chat server listening on port ${port}`);
  console.log(`http://localhost:${port}`);
});
