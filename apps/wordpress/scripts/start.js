#!/usr/bin/env node

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');

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

// Cross-platform utilities
function isWindows() {
  return os.platform() === 'win32';
}

function getPortCheckCommand(port) {
  if (isWindows()) {
    return `netstat -an | findstr :${port}`;
  }

  return `netstat -tuln | grep :${port}`;
}

function getDockerCommand() {
  // Use docker-compose if available, otherwise use docker compose
  try {
    execSync('docker-compose --version', { stdio: 'pipe' });
    return 'docker-compose';
  } catch (error) {
    return 'docker compose';
  }
}

function normalizePath(filePath) {
  // Ensure consistent path separators across platforms
  return path.normalize(filePath).replace(/\\/g, '/');
}

function execCommand(command, options = {}) {
  try {
    // Use cross-platform shell for complex commands
    const shell = isWindows() ? 'powershell.exe' : '/bin/bash';

    return execSync(command, {
      stdio: 'inherit',
      encoding: 'utf8',
      shell: shell,
      ...options,
    });
  } catch (error) {
    log(`❌ Error executing: ${command}`, 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

function execCommandSilent(command, options = {}) {
  try {
    // Use cross-platform shell for complex commands
    const shell = isWindows() ? 'powershell.exe' : '/bin/bash';

    return execSync(command, {
      stdio: 'pipe',
      encoding: 'utf8',
      shell: shell,
      ...options,
    });
  } catch (error) {
    return null;
  }
}

function checkDocker() {
  log('🔍 Checking if Docker is running...', 'cyan');
  try {
    execSync('docker info', { stdio: 'pipe' });
    log('✅ Docker is running', 'green');
    return true;
  } catch (error) {
    log('❌ Docker is not running. Please start Docker first.', 'red');
    return false;
  }
}

function stopRunningInstances() {
  log('🔄 Checking for running instances...', 'cyan');

  // Stop and remove any running wordpress-app container
  const wordpressContainer = execCommandSilent(
    'docker ps -q -f name=wordpress-app',
  );
  if (wordpressContainer) {
    log('🛑 Stopping existing wordpress-app container...', 'yellow');
    execCommandSilent('docker stop wordpress-app');
    execCommandSilent('docker rm wordpress-app');
    log('✅ wordpress-app container stopped and removed', 'green');
  }

  // Stop and remove any running wordpress-db container
  const dbContainer = execCommandSilent('docker ps -q -f name=wordpress-db');
  if (dbContainer) {
    log('🛑 Stopping existing wordpress-db container...', 'yellow');
    execCommandSilent('docker stop wordpress-db');
    execCommandSilent('docker rm wordpress-db');
    log('✅ wordpress-db container stopped and removed', 'green');
  }

  // Stop and remove any running wordpress-phpmyadmin container
  const phpmyadminContainer = execCommandSilent(
    'docker ps -q -f name=wordpress-phpmyadmin',
  );
  if (phpmyadminContainer) {
    log('🛑 Stopping existing wordpress-phpmyadmin container...', 'yellow');
    execCommandSilent('docker stop wordpress-phpmyadmin');
    execCommandSilent('docker rm wordpress-phpmyadmin');
    log('✅ wordpress-phpmyadmin container stopped and removed', 'green');
  }

  // Stop any running docker-compose services
  const dockerCompose = getDockerCommand();
  try {
    const composeServices = execCommandSilent(`${dockerCompose} ps -q`);
    if (composeServices && composeServices.trim()) {
      log('🛑 Stopping docker-compose services...', 'yellow');
      execCommandSilent(`${dockerCompose} down`);
      log('✅ docker-compose services stopped', 'green');
    }
  } catch (error) {
    // docker-compose.yml might not exist, which is fine
  }

  // Check if port 3000 is in use (cross-platform)
  try {
    const portCheckCommand = getPortCheckCommand(3000);
    execSync(portCheckCommand, { stdio: 'pipe' });
    log(
      '⚠️  Port 3000 is still in use. You may need to manually stop the process using it.',
      'yellow',
    );
  } catch (error) {
    // Port 3000 is free, which is good
  }

  log('✅ All running instances stopped', 'green');
}

function getRunMode() {
  const args = process.argv.slice(2);
  const runMode = args.find((arg) => arg.startsWith('--mode='))?.split('=')[1];

  if (runMode === 'docker-run') {
    return 'docker-run';
  } else if (runMode === 'compose') {
    return 'compose';
  } else if (runMode === 'full-stack') {
    return 'full-stack';
  } else {
    // Default to full-stack if no mode specified
    return 'full-stack';
  }
}

function buildDockerImage() {
  log('📦 Building WordPress Docker image...', 'cyan');
  execCommand('docker build -t wordpress-app .');
  log('✅ Docker image built successfully', 'green');
}

function runDockerContainer() {
  log('🚀 Starting WordPress container...', 'cyan');

  // Check if container is already running
  const existingContainer = execCommandSilent(
    'docker ps -q -f name=wordpress-app',
  );
  if (existingContainer) {
    log('🔄 Stopping existing container...', 'yellow');
    execCommand('docker stop wordpress-app');
    execCommand('docker rm wordpress-app');
  }

  // Run the container with port 3000
  const dockerRunCommand = [
    'docker run -d',
    '--name wordpress-app',
    '-p 3000:3000',
    '-e WORDPRESS_PORT=3000',
    '-e WORDPRESS_DB_HOST=host.docker.internal:3306',
    '-e WORDPRESS_DB_NAME=wordpress',
    '-e WORDPRESS_DB_USER=wordpress',
    '-e WORDPRESS_DB_PASSWORD=wordpress_password',
    '-e WORDPRESS_URL=http://localhost:3000',
    '-e WORDPRESS_TITLE="WordPress Application"',
    '-e WORDPRESS_ADMIN_USER=admin',
    '-e WORDPRESS_ADMIN_PASSWORD=admin',
    '-e WORDPRESS_ADMIN_EMAIL=admin@example.com',
    '-e WORDPRESS_DEBUG=1',
    'wordpress-app',
  ].join(' ');

  execCommand(dockerRunCommand);
  log('✅ WordPress container started', 'green');
}

function runDockerCompose() {
  const dockerCompose = getDockerCommand();
  log('📦 Building containers...', 'cyan');
  execCommand(`${dockerCompose} -f docker-compose.dev.yml build`);

  log('🔧 Starting services...', 'cyan');
  execCommand(`${dockerCompose} -f docker-compose.dev.yml up -d`);
}

function runFullStack() {
  const dockerCompose = getDockerCommand();
  log('📦 Building full stack (WordPress + MySQL + phpMyAdmin)...', 'cyan');
  execCommand(`${dockerCompose} build --no-cache`);

  log('🔧 Starting all services...', 'cyan');
  execCommand(`${dockerCompose} up -d`);
}

function waitForWordPress() {
  log('⏳ Waiting for WordPress to be ready...', 'yellow');

  return new Promise((resolve) => {
    const maxAttempts = 30; // 5 minutes max
    let attempts = 0;

    const checkInterval = setInterval(async () => {
      attempts++;
      try {
        log(
          `🔍 Attempt ${attempts}/${maxAttempts}: Checking if WordPress is ready...`,
          'cyan',
        );
        const response = await axios.get('http://localhost:3000', {
          timeout: 5000,
          validateStatus: () => true, // Accept any status code
        });

        if (response.status >= 200 && response.status < 500) {
          clearInterval(checkInterval);
          log('✅ WordPress is ready on port 3000!', 'green');
          resolve();
        } else {
          log(
            `⚠️  WordPress responded with status ${response.status}, continuing to wait...`,
            'yellow',
          );
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          log(
            '❌ WordPress failed to start on port 3000 after 30 attempts',
            'red',
          );
          log(`Last error: ${error.message}`, 'red');
          process.exit(1);
        }

        // Continue waiting
        log(
          `⏳ WordPress not ready yet (attempt ${attempts}/${maxAttempts})`,
          'yellow',
        );
      }
    }, 10000); // Check every 10 seconds
  });
}

function displayAccessInfo() {
  const runMode = getRunMode();

  log('\n🌐 Access your WordPress application:', 'bright');
  log('   WordPress: http://localhost:3000', 'cyan');
  log('   WordPress Admin: http://localhost:3000/wp-admin', 'cyan');
  log(
    '   Custom REST API: http://localhost:3000/wp-json/custom-api/v1/health',
    'cyan',
  );

  if (runMode === 'full-stack') {
    log('   phpMyAdmin: http://localhost:8081', 'cyan');
    log('   MySQL Database: localhost:3306', 'cyan');
  }

  log('\n📝 Application info:', 'bright');
  log('   - WordPress debug mode is enabled', 'yellow');
  if (runMode === 'full-stack') {
    log('   - Full stack with MySQL and phpMyAdmin', 'yellow');
    log('   - Logs: docker-compose logs wordpress', 'yellow');
  } else {
    log('   - Container name: wordpress-app', 'yellow');
    log('   - Logs: docker logs wordpress-app', 'yellow');
  }

  log('\n🛑 Press Ctrl+C to stop the application', 'magenta');
}

function cleanup() {
  const runMode = getRunMode();
  const dockerCompose = getDockerCommand();

  log('\n🛑 Stopping application...', 'yellow');
  try {
    if (runMode === 'docker-run') {
      execSync('docker stop wordpress-app', { stdio: 'inherit' });
      execSync('docker rm wordpress-app', { stdio: 'inherit' });
      log('✅ WordPress container stopped and removed', 'green');
    } else if (runMode === 'compose') {
      execSync(`${dockerCompose} -f docker-compose.dev.yml down`, {
        stdio: 'inherit',
      });
      log('✅ Application stopped', 'green');
    } else if (runMode === 'full-stack') {
      execSync(`${dockerCompose} down`, {
        stdio: 'inherit',
      });
      log('✅ Full stack environment stopped', 'green');
    }
  } catch (error) {
    log('❌ Error stopping application', 'red');
  }
}

// API Testing Functions
async function makeRequest(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true, // Accept any status code
    });

    return {
      status: response.status,
      data: response.data,
      headers: response.headers,
    };
  } catch (error) {
    throw error;
  }
}

async function checkWordPress() {
  log('🔍 Checking if WordPress is running...', 'cyan');

  try {
    const response = await axios.get('http://localhost:3000', {
      timeout: 5000,
      validateStatus: () => true, // Accept any status code
    });

    if (response.status >= 200 && response.status < 500) {
      log('✅ WordPress is running on port 3000', 'green');
      return true;
    } else {
      log(
        `❌ WordPress is responding but with status ${response.status}`,
        'red',
      );
      log('   Please start the application first with: npm start', 'yellow');
      return false;
    }
  } catch (error) {
    log('❌ WordPress is not running on port 3000', 'red');
    log(`   Error: ${error.message}`, 'red');
    log('   Please start the application first with: npm start', 'yellow');
    return false;
  }
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

async function testAPI() {
  log('🧪 Testing Custom REST API Plugin...', 'bright');

  // Check if WordPress is running
  if (!(await checkWordPress())) {
    process.exit(1);
  }

  const baseUrl = 'http://localhost:3000/wp-json/custom-api/v1';

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
    'curl -H "X-WP-Nonce: YOUR_NONCE" http://localhost:3000/wp-json/custom-api/v1/health',
    'cyan',
  );
}

function showHelp() {
  log('\n📖 Usage:', 'bright');
  log(
    '   npm start                    # Start full stack (WordPress + MySQL + phpMyAdmin)',
    'cyan',
  );
  log(
    '   npm start -- --mode=full-stack  # Start full stack (default)',
    'cyan',
  );
  log(
    '   npm start -- --mode=docker-run  # Start with Docker run command (no database)',
    'cyan',
  );
  log(
    '   npm start -- --mode=compose     # Start with docker-compose.dev.yml',
    'cyan',
  );
  log(
    '   npm run test-api               # Test the REST API endpoints',
    'cyan',
  );
  log('\n🔧 Environment Variables:', 'bright');
  log(
    '   WORDPRESS_PORT=3000            # Port to run on (default: 3000)',
    'cyan',
  );
  log(
    '   WORDPRESS_DB_HOST=host.docker.internal:3306  # Database host',
    'cyan',
  );
  log('\n📝 Examples:', 'bright');
  log('   WORDPRESS_PORT=3000 npm start', 'yellow');
  log('   WORDPRESS_DB_HOST=localhost:3306 npm start', 'yellow');
  log('\n🌐 Full Stack Includes:', 'bright');
  log('   - WordPress on port 3000', 'cyan');
  log('   - MySQL database on port 3306', 'cyan');
  log('   - phpMyAdmin on port 8081', 'cyan');
}

async function main() {
  const args = process.argv.slice(2);

  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const runMode = getRunMode();

  log(`🚀 Starting WordPress Application (${runMode})...`, 'bright');

  // Check if Docker is running
  if (!checkDocker()) {
    process.exit(1);
  }

  // Stop any running instances before starting
  stopRunningInstances();

  try {
    if (runMode === 'docker-run') {
      // Build and run with Docker
      buildDockerImage();
      runDockerContainer();
    } else if (runMode === 'compose') {
      // Check if docker-compose.dev.yml exists
      const composeFile = normalizePath(
        path.join(__dirname, '..', 'docker-compose.dev.yml'),
      );
      if (!existsSync(composeFile)) {
        log('❌ docker-compose.dev.yml not found', 'red');
        log(
          '💡 Use --mode=full-stack to run with the current docker-compose.yml',
          'yellow',
        );
        process.exit(1);
      }
      runDockerCompose();
    } else if (runMode === 'full-stack') {
      // Check if docker-compose.yml exists
      const composeFile = normalizePath(
        path.join(__dirname, '..', 'docker-compose.yml'),
      );
      if (!existsSync(composeFile)) {
        log('❌ docker-compose.yml not found', 'red');
        log('💡 Use --mode=docker-run to run with Docker instead', 'yellow');
        process.exit(1);
      }
      runFullStack();
    }

    // Wait for WordPress to be ready
    await waitForWordPress();

    // Display access information
    displayAccessInfo();

    // Handle cleanup on exit
    process.on('SIGINT', () => {
      cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      cleanup();
      process.exit(0);
    });

    // Keep the script running
    process.stdin.resume();
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    cleanup();
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    log(`❌ Unexpected error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  main,
  cleanup,
  checkDocker,
  stopRunningInstances,
  waitForWordPress,
  buildDockerImage,
  runDockerContainer,
  runDockerCompose,
  runFullStack,
  getRunMode,
  getDockerCommand,
  isWindows,
  testAPI,
  testEndpoint,
  makeRequest,
};
