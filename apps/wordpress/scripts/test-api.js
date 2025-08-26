#!/usr/bin/env node

const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    const req = client.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers,
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function checkWordPress(appName = null) {
  log('🔍 Checking if WordPress is running...', 'cyan');
  
  // Define app configurations
  const apps = {
    app_a: { port: 3000, name: 'App A' },
    app_b: { port: 3001, name: 'App B' },
    app_c: { port: 3002, name: 'App C' }
  };
  
  // If specific app is requested, check only that one
  if (appName && apps[appName]) {
    const app = apps[appName];
    try {
      execSync(`curl -s http://localhost:${app.port} > /dev/null`, { stdio: 'pipe' });
      log(`✅ ${app.name} is running on port ${app.port}`, 'green');
      return { port: app.port, name: app.name };
    } catch (error) {
      log(`❌ ${app.name} is not running on port ${app.port}`, 'red');
      return false;
    }
  }
  
  // Check all apps and return the first one that's running
  for (const [key, app] of Object.entries(apps)) {
    try {
      execSync(`curl -s http://localhost:${app.port} > /dev/null`, { stdio: 'pipe' });
      log(`✅ ${app.name} is running on port ${app.port}`, 'green');
      return { port: app.port, name: app.name, key };
    } catch (error) {
      // Continue to next app
    }
  }
  
  log(
    '❌ No WordPress apps are running. Please start the Docker environment first.',
    'red',
  );
  log('   Run: npm run dev:detach or npm run prod:detach', 'yellow');
  return false;
}

async function testEndpoint(name, url) {
  log(`\n🧪 Testing: ${name}`, 'bright');
  log(`URL: ${url}`, 'cyan');

  try {
    const response = await makeRequest(url);

    if (response.status >= 200 && response.status < 300) {
      log('✅ Success', 'green');
      log('Response:', 'yellow');
      console.log(JSON.stringify(response.data, null, 2));
    } else {
      log(`❌ Error: HTTP ${response.status}`, 'red');
      log('Response:', 'yellow');
      console.log(JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }
}

async function main() {
  log('🧪 Testing Custom REST API Plugin...', 'bright');

  // Parse command line arguments
  const options = parseArgs();
  
  // Check if WordPress is running
  const appInfo = checkWordPress(options.app);
  if (!appInfo) {
    process.exit(1);
  }

  const baseUrl = `http://localhost:${appInfo.port}/wp-json/custom-api/v1`;

  // Test all endpoints
  const endpoints = [
    { name: 'Health Check', url: `${baseUrl}/health` },
    { name: 'Get Posts', url: `${baseUrl}/posts` },
    { name: 'Get Users', url: `${baseUrl}/users` },
    { name: 'Node.js-like Data', url: `${baseUrl}/node-data` },
  ];

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint.name, endpoint.url);
  }

  log('\n🎉 API testing completed!', 'green');
  log('\n💡 To test with authentication, you can use:', 'yellow');
  log(
    `curl -H "X-WP-Nonce: YOUR_NONCE" http://localhost:${appInfo.port}/wp-json/custom-api/v1/health`,
    'cyan',
  );

  log('\n📊 Additional testing options:', 'bright');
  log(
    '   - Test specific endpoint: node scripts/test-api.js --endpoint=health',
    'cyan',
  );
  log('   - Test with authentication: node scripts/test-api.js --auth', 'cyan');
  log('   - Verbose output: node scripts/test-api.js --verbose', 'cyan');
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    endpoint: null,
    app: null,
    auth: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--endpoint' && args[i + 1]) {
      options.endpoint = args[i + 1];
      i++;
    } else if (arg === '--app' && args[i + 1]) {
      options.app = args[i + 1];
      i++;
    } else if (arg === '--auth') {
      options.auth = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      log('Usage: node scripts/test-api.js [options]', 'bright');
      log('\nOptions:', 'bright');
      log(
        '  --endpoint <name>  Test specific endpoint (health, posts, users, node-data)',
        'cyan',
      );
      log(
        '  --app <name>      Test specific app (app_a, app_b, app_c)',
        'cyan',
      );
      log(
        '  --auth            Test with authentication (requires nonce)',
        'cyan',
      );
      log('  --verbose         Show detailed response information', 'cyan');
      log('  --help, -h        Show this help message', 'cyan');
      process.exit(0);
    }
  }

  return options;
}

// Run the script
if (require.main === module) {
  const options = parseArgs();

  if (options.verbose) {
    log('Verbose mode enabled', 'yellow');
  }

  if (options.app) {
    log(`Testing app: ${options.app}`, 'yellow');
  }

  main().catch((error) => {
    log(`❌ Unexpected error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { main, testEndpoint, checkWordPress, makeRequest };
