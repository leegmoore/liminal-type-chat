/**
 * Development Environment Setup Script
 * 
 * This script generates secure defaults for local development:
 * - Creates a .env.local file with secure random keys
 * - Configures developer-friendly security settings
 * - Sets up local environment configuration
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Base directory of the project
const BASE_DIR = path.resolve(__dirname, '..');

// Generate a secure random string of specified bytes and encoding
function generateSecureKey(bytes = 32, encoding = 'base64') {
  return crypto.randomBytes(bytes).toString(encoding);
}

// Generate environment variables for local development
function generateEnvFile() {
  console.log('Generating secure environment variables for local development...');
  
  // Generate secure random keys
  const jwtSecret = generateSecureKey(32);
  const encryptionKey = generateSecureKey(32);
  const stateSecret = generateSecureKey(16);
  
  // Create the .env.local content
  const envContent = `# Local Development Environment
# Generated on ${new Date().toISOString()}
# DO NOT COMMIT THIS FILE TO VERSION CONTROL!

# Environment
NODE_ENV=development
APP_ENV=local

# Security
JWT_SECRET=${jwtSecret}
ENCRYPTION_KEY=${encryptionKey}
STATE_SECRET=${stateSecret}

# Local Development Settings
DEV_REQUIRE_AUTH=false
DEV_MODE=true
LOG_LEVEL=debug

# Default port
PORT=8765

# API Endpoints
API_BASE_URL=http://localhost:8765
DOMAIN_API_BASE_URL=http://localhost:8765
CLIENT_ORIGIN=http://localhost:5173

# No need to fill these in unless testing OAuth
# GITHUB_CLIENT_ID=
# GITHUB_CLIENT_SECRET=

# To test with strict security settings, uncomment:
# ENFORCE_SECURITY=true
`;
  
  // Write to .env.local file
  fs.writeFileSync(path.join(BASE_DIR, '.env.local'), envContent);
  console.log('✅ Created .env.local with secure defaults');
}

// Check for existing GitHub OAuth credentials and prompt for configuration
function checkOAuthConfig() {
  const envLocalPath = path.join(BASE_DIR, '.env.local');
  if (!fs.existsSync(envLocalPath)) {
    console.log('❌ .env.local file not found. Run this script again after creating it.');
    return;
  }
  
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  
  if (!envContent.includes('GITHUB_CLIENT_ID=') || !envContent.includes('GITHUB_CLIENT_SECRET=')) {
    console.log('\n📝 GitHub OAuth Setup Instructions:');
    console.log('1. Go to https://github.com/settings/developers');
    console.log('2. Click "New OAuth App"');
    console.log('3. Fill in the application details:');
    console.log('   - Application name: Liminal Type Chat (Dev)');
    console.log('   - Homepage URL: http://localhost:8765');
    console.log('   - Authorization callback URL: http://localhost:8765/api/v1/auth/github/callback');
    console.log('4. Click "Register application"');
    console.log('5. Copy the Client ID and generate a new Client Secret');
    console.log('6. Add these to your .env.local file:');
    console.log('   GITHUB_CLIENT_ID=your_client_id');
    console.log('   GITHUB_CLIENT_SECRET=your_client_secret\n');
  }
}

// Setup the local development environment
async function setupDevEnvironment() {
  console.log('🔧 Setting up secure development environment...');
  
  // Generate environment file if it doesn't exist
  const envLocalPath = path.join(BASE_DIR, '.env.local');
  if (!fs.existsSync(envLocalPath)) {
    generateEnvFile();
  } else {
    console.log('⚠️ .env.local already exists. Skipping generation.');
    console.log('   Delete it and run this script again to regenerate.');
  }
  
  // Check GitHub OAuth configuration
  checkOAuthConfig();
  
  console.log('\n✨ Development environment setup complete!');
  console.log('\nTo start the server in development mode:');
  console.log('npm run dev');
}

// Run the setup
setupDevEnvironment().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});