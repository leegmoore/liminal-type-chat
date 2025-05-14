/**
 * Server diagnostics tool
 * Identifies common issues with server startup
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colored output helpers
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

function printSection(title) {
  console.log(`\n${colors.bold}${colors.blue}=== ${title} ===${colors.reset}\n`);
}

function printPass(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function printFail(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function printWarning(message) {
  console.log(`${colors.yellow}! ${message}${colors.reset}`);
}

function printInfo(message) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

// Check environment variables
function checkEnvironmentVariables() {
  printSection('Environment Variables');
  
  const requiredVars = [
    'PORT',
    'NODE_ENV',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'ENCRYPTION_KEY',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET'
  ];
  
  const optionalVars = [
    'DB_PATH',
    'API_BASE_URL',
    'IN_PROCESS_MODE',
    'LOG_LEVEL',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY'
  ];
  
  let allRequired = true;
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      printPass(`${varName} is set`);
    } else {
      printFail(`${varName} is not set`);
      allRequired = false;
    }
  });
  
  if (!allRequired) {
    printInfo('Create or update .env file with required variables');
  }
  
  printInfo('Optional environment variables:');
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      printPass(`${varName} is set`);
    } else {
      printWarning(`${varName} is not set (optional)`);
    }
  });
}

// Check dependencies
function checkDependencies() {
  printSection('Dependencies');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    
    const criticalDeps = [
      'express',
      'jsonwebtoken',
      '@anthropic-ai/sdk',
      'openai',
      'better-sqlite3',
      'typescript',
      'ts-node'
    ];
    
    criticalDeps.forEach(dep => {
      if (dependencies[dep]) {
        printPass(`${dep} (${dependencies[dep]}) is in package.json`);
        
        try {
          const nodeModulesPath = path.join(__dirname, 'node_modules', dep);
          if (fs.existsSync(nodeModulesPath)) {
            printPass(`${dep} is installed in node_modules`);
          } else {
            printFail(`${dep} is in package.json but not installed. Run npm install`);
          }
        } catch (error) {
          printFail(`Error checking installation of ${dep}: ${error.message}`);
        }
      } else {
        printFail(`${dep} is missing from package.json`);
      }
    });
  } catch (error) {
    printFail(`Error reading package.json: ${error.message}`);
  }
}

// Check TypeScript configuration
function checkTypeScript() {
  printSection('TypeScript');
  
  try {
    if (fs.existsSync('./tsconfig.json')) {
      printPass('tsconfig.json exists');
      
      try {
        const tsconfigJson = JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8'));
        
        // Check essential compiler options
        const compilerOptions = tsconfigJson.compilerOptions || {};
        
        if (compilerOptions.outDir) {
          printPass(`outDir is set to: ${compilerOptions.outDir}`);
          
          // Check if outDir exists
          if (fs.existsSync(path.join(__dirname, compilerOptions.outDir))) {
            printPass(`outDir directory exists`);
          } else {
            printWarning(`outDir directory doesn't exist. Run the build command.`);
          }
        } else {
          printWarning('outDir is not set in tsconfig.json');
        }
        
        // Check module and target settings
        printInfo(`Module system: ${compilerOptions.module || 'not specified'}`);
        printInfo(`Target: ${compilerOptions.target || 'not specified'}`);
        
        // Check for strict mode
        if (compilerOptions.strict) {
          printInfo('Strict mode is enabled');
        } else {
          printInfo('Strict mode is disabled');
        }
      } catch (error) {
        printFail(`Error parsing tsconfig.json: ${error.message}`);
      }
    } else {
      printFail('tsconfig.json does not exist');
    }
    
    // Try to run tsc --version
    try {
      const tscVersion = execSync('npx tsc --version', { encoding: 'utf8' }).trim();
      printPass(`TypeScript version: ${tscVersion}`);
    } catch (error) {
      printFail(`Error checking TypeScript version: ${error.message}`);
    }
  } catch (error) {
    printFail(`Error checking TypeScript configuration: ${error.message}`);
  }
}

// Check OpenAPI documentation
function checkOpenApi() {
  printSection('OpenAPI Documentation');
  
  const openApiPaths = [
    './openapi/edge-api.yaml',
    './openapi/domain-api.yaml'
  ];
  
  openApiPaths.forEach(apiPath => {
    try {
      if (fs.existsSync(apiPath)) {
        printPass(`${apiPath} exists`);
        
        const fileContents = fs.readFileSync(apiPath, 'utf8');
        
        // Check for common YAML errors
        if (fileContents.includes('      responses:') && fileContents.includes('        responses:')) {
          printFail(`Potential duplicate 'responses:' key in ${apiPath}`);
        } else {
          printPass(`No obvious YAML syntax issues detected in ${apiPath}`);
        }
      } else {
        printFail(`${apiPath} does not exist`);
      }
    } catch (error) {
      printFail(`Error checking ${apiPath}: ${error.message}`);
    }
  });
}

// Check Anthropic integration
function checkAnthropicIntegration() {
  printSection('Anthropic Integration');
  
  const filesToCheck = [
    './src/providers/llm/anthropic/AnthropicService.ts',
    './src/providers/llm/LlmServiceFactory.ts'
  ];
  
  filesToCheck.forEach(filePath => {
    try {
      if (fs.existsSync(filePath)) {
        printPass(`${filePath} exists`);
        
        const fileContents = fs.readFileSync(filePath, 'utf8');
        
        // Check for Claude 3.7 Sonnet references
        if (fileContents.includes('claude-3-7-sonnet')) {
          printPass(`${filePath} includes Claude 3.7 Sonnet references`);
        } else {
          printFail(`${filePath} does not contain Claude 3.7 Sonnet references`);
        }
      } else {
        printFail(`${filePath} does not exist`);
      }
    } catch (error) {
      printFail(`Error checking ${filePath}: ${error.message}`);
    }
  });
}

// Run diagnostics
function runDiagnostics() {
  console.log(`${colors.bold}${colors.blue}
========================================
SERVER DIAGNOSTICS TOOL
========================================${colors.reset}
  `);
  
  // Load environment variables from .env
  try {
    const dotenv = require('dotenv');
    const result = dotenv.config();
    if (result.error) {
      printFail(`Error loading .env file: ${result.error.message}`);
    } else {
      printPass('.env file loaded successfully');
    }
  } catch (error) {
    printFail(`Error loading dotenv: ${error.message}`);
  }
  
  checkEnvironmentVariables();
  checkDependencies();
  checkTypeScript();
  checkOpenApi();
  checkAnthropicIntegration();
  
  printSection('Next Steps');
  console.log(
    `1. Run the minimal server to test endpoint connectivity:
       ${colors.bold}node minimal-server.js${colors.reset}
    
    2. Test client connectivity to minimal server by visiting:
       ${colors.bold}http://localhost:5173/${colors.reset} (assuming client is running)
       
    3. Test direct Anthropic integration:
       ${colors.bold}node test-claude37-direct.js YOUR_API_KEY${colors.reset}
       
    4. If minimal server works but full server doesn't, incrementally add functionality
       to the minimal server to identify the breaking point.`
  );
}

runDiagnostics();