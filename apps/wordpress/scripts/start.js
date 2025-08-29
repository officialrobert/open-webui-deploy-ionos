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

function checkIfAppsAreRunning() {
  log('🔍 Checking if WordPress apps are already running...', 'cyan');

  const dockerCompose = getDockerCommand();
  const containerNames = [
    'wordpress-app-a',
    'wordpress-app-b',
    'wordpress-app-c',
  ];
  let runningContainers = 0;

  try {
    // Check if containers are running
    for (const containerName of containerNames) {
      const containerStatus = execCommandSilent(
        `docker ps --filter name=${containerName} --format "{{.Status}}"`,
      );
      if (containerStatus && containerStatus.trim()) {
        log(
          `✅ ${containerName} is running: ${containerStatus.trim()}`,
          'green',
        );
        runningContainers++;
      } else {
        log(`❌ ${containerName} is not running`, 'red');
      }
    }

    // Check if ports are accessible
    const ports = [3001, 3002, 3003];
    let accessiblePorts = 0;

    for (const port of ports) {
      try {
        const portCheckCommand = getPortCheckCommand(port);
        const portStatus = execCommandSilent(portCheckCommand);
        if (portStatus && portStatus.trim()) {
          log(`✅ Port ${port} is accessible`, 'green');
          accessiblePorts++;
        } else {
          log(`❌ Port ${port} is not accessible`, 'red');
        }
      } catch (error) {
        log(`❌ Port ${port} is not accessible`, 'red');
      }
    }

    if (
      runningContainers === containerNames.length &&
      accessiblePorts === ports.length
    ) {
      log('✅ All WordPress apps are running and accessible', 'green');
      return true;
    } else {
      log(
        `⚠️  ${runningContainers}/${containerNames.length} containers running, ${accessiblePorts}/${ports.length} ports accessible`,
        'yellow',
      );
      return false;
    }
  } catch (error) {
    log('❌ Error checking app status', 'red');
    return false;
  }
}

function stopRunningInstances() {
  log('🔄 Checking for running instances...', 'cyan');

  // Stop and remove any running wordpress-app containers
  const appContainers = [
    'wordpress-app',
    'wordpress-app-a',
    'wordpress-app-b',
    'wordpress-app-c',
  ];

  for (const containerName of appContainers) {
    const container = execCommandSilent(
      `docker ps -q -f name=${containerName}`,
    );
    if (container) {
      log(`🛑 Stopping existing ${containerName} container...`, 'yellow');
      execCommandSilent(`docker stop ${containerName}`);
      execCommandSilent(`docker rm ${containerName}`);
      log(`✅ ${containerName} container stopped and removed`, 'green');
    }
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

  // Check if ports 3001, 3002, 3003 are in use (cross-platform)
  const ports = [3001, 3002, 3003];
  for (const port of ports) {
    try {
      const portCheckCommand = getPortCheckCommand(port);
      execSync(portCheckCommand, { stdio: 'pipe' });
      log(
        `⚠️  Port ${port} is still in use. You may need to manually stop the process using it.`,
        'yellow',
      );
    } catch (error) {
      // Port is free, which is good
    }
  }

  log('✅ All running instances stopped', 'green');
}

function runFullStack() {
  const dockerCompose = getDockerCommand();
  log(
    '📦 Building full stack (3 WordPress Apps + MySQL + phpMyAdmin)...',
    'cyan',
  );
  execCommand(`${dockerCompose} build --no-cache`);

  log('🔧 Starting all services...', 'cyan');
  execCommand(`${dockerCompose} up -d`);
}

function waitForWordPress() {
  log('⏳ Waiting for all WordPress apps to be ready...', 'yellow');

  return new Promise((resolve) => {
    const maxAttempts = 30; // 5 minutes max
    let attempts = 0;
    const ports = [3001, 3002, 3003];
    const readyApps = new Set();

    const checkInterval = setInterval(async () => {
      attempts++;
      try {
        log(
          `🔍 Attempt ${attempts}/${maxAttempts}: Checking if WordPress apps are ready...`,
          'cyan',
        );

        for (const port of ports) {
          if (!readyApps.has(port)) {
            try {
              const response = await axios.get(`http://localhost:${port}`, {
                timeout: 5000,
                validateStatus: () => true, // Accept any status code
              });

              if (response.status >= 200 && response.status < 500) {
                readyApps.add(port);
                log(`✅ WordPress App on port ${port} is ready!`, 'green');
              }
            } catch (error) {
              console.log(error?.message);
              // App not ready yet, continue checking
            }
          }
        }

        if (readyApps.size === ports.length) {
          clearInterval(checkInterval);
          log('✅ All WordPress apps are ready!', 'green');
          resolve();
        } else {
          log(
            `⏳ ${readyApps.size}/${ports.length} apps ready (attempt ${attempts}/${maxAttempts})`,
            'yellow',
          );
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          log('❌ WordPress apps failed to start after 30 attempts', 'red');
          log(`Last error: ${error.message}`, 'red');
          process.exit(1);
        }
      }
    }, 10000); // Check every 10 seconds
  });
}

function displayAccessInfo() {
  log('\n🌐 Access your WordPress applications:', 'bright');

  log('   App A - WordPress: http://localhost:3001', 'cyan');
  log('   App A - Admin: http://localhost:3001/wp-admin', 'cyan');
  log(
    '   App A - REST API: http://localhost:3001/index.php?rest_route=/custom-api/v1/health',
    'cyan',
  );

  log('   App B - WordPress: http://localhost:3002', 'cyan');
  log('   App B - Admin: http://localhost:3002/wp-admin', 'cyan');
  log(
    '   App B - REST API: http://localhost:3002/index.php?rest_route=/custom-api/v1/health',
    'cyan',
  );

  log('   App C - WordPress: http://localhost:3003', 'cyan');
  log('   App C - Admin: http://localhost:3003/wp-admin', 'cyan');
  log(
    '   App C - REST API: http://localhost:3003/index.php?rest_route=/custom-api/v1/health',
    'cyan',
  );

  log('   phpMyAdmin: http://localhost:8081', 'cyan');
  log('   MySQL Database: localhost:3306', 'cyan');

  log('\n📝 Application info:', 'bright');
  log('   - WordPress debug mode is enabled', 'yellow');
  log('   - Multi-app stack with MySQL and phpMyAdmin', 'yellow');
  log('   - All apps share the same database', 'yellow');
  log('   - Logs: docker-compose logs app_a', 'yellow');
  log('   - Logs: docker-compose logs app_b', 'yellow');
  log('   - Logs: docker-compose logs app_c', 'yellow');
}

function cleanup() {
  const dockerCompose = getDockerCommand();

  log('\n🛑 Stopping application...', 'yellow');
  try {
    execSync(`${dockerCompose} down`, {
      stdio: 'inherit',
    });
    log('✅ Full stack environment stopped', 'green');
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
  log('🔍 Checking if WordPress apps are running...', 'cyan');

  const ports = [3001, 3002, 3003];
  let runningApps = 0;

  for (const port of ports) {
    try {
      const response = await axios.get(`http://localhost:${port}`, {
        timeout: 5000,
        validateStatus: () => true, // Accept any status code
      });

      if (response.status >= 200 && response.status < 500) {
        log(`✅ WordPress App on port ${port} is running`, 'green');
        runningApps++;
      } else {
        log(
          `❌ WordPress App on port ${port} is responding but with status ${response.status}`,
          'red',
        );
      }
    } catch (error) {
      log(`❌ WordPress App on port ${port} is not running`, 'red');
    }
  }

  if (runningApps === ports.length) {
    log('✅ All WordPress apps are running', 'green');
    return true;
  } else {
    log(
      `❌ Only ${runningApps}/${ports.length} WordPress apps are running`,
      'red',
    );
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

  // Check if WordPress apps are running
  if (!(await checkWordPress())) {
    process.exit(1);
  }

  const ports = [3001, 3002, 3003];
  const endpoints = [
    { name: 'Health Check', path: '/health' },
    { name: 'Get Posts', path: '/posts' },
    { name: 'Get Users', path: '/users' },
    { name: 'Node.js-like Data', path: '/node-data' },
  ];

  for (const port of ports) {
    log(`\n🔍 Testing App on port ${port}:`, 'bright');
    const baseUrl = `http://localhost:${port}/wp-json/custom-api/v1`;

    for (const endpoint of endpoints) {
      await testEndpoint(
        `${endpoint.name} (Port ${port})`,
        `${baseUrl}${endpoint.path}`,
      );
    }
  }

  log('\n🎉 API testing completed for all apps!', 'green');
  log('\n💡 To test with authentication, you can use:', 'yellow');
  log(
    'curl -H "X-WP-Nonce: YOUR_NONCE" http://localhost:3001/index.php?rest_route=/custom-api/v1/health',
    'cyan',
  );
}

function showHelp() {
  log('\n📖 Usage:', 'bright');
  log(
    '   npm start                    # Start full stack (3 WordPress Apps + MySQL + phpMyAdmin)',
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
  log('   - App A on port 3001', 'cyan');
  log('   - App B on port 3002', 'cyan');
  log('   - App C on port 3003', 'cyan');
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

  // Check if already running using Docker commands
  const isAlreadyRunning = checkIfAppsAreRunning();

  if (isAlreadyRunning) {
    log('⚠️  WordPress apps are already running', 'yellow');
    log('📋 Showing recent Docker logs...', 'cyan');

    // Show recent Docker logs
    try {
      const dockerCompose = getDockerCommand();
      log('\n🐳 Recent Docker logs:', 'bright');
      execSync(`${dockerCompose} logs --tail=20`, { stdio: 'inherit' });

      log('\n📊 Container status:', 'bright');
      execSync(`${dockerCompose} ps`, { stdio: 'inherit' });

      log('\n💡 Use "npm run stop" to stop the application', 'yellow');
      log('💡 Use "npm run start:logs" to follow logs in real-time', 'yellow');
    } catch (error) {
      log('❌ Could not fetch Docker logs', 'red');
    }
    return;
  }

  log(
    '🚀 Starting WordPress Application (Docker Compose) in background...',
    'bright',
  );

  // Check if Docker is running
  if (!checkDocker()) {
    process.exit(1);
  }

  // Stop any existing instances
  stopRunningInstances();

  try {
    // Check if docker-compose.yml exists
    const composeFile = normalizePath(
      path.join(__dirname, '..', 'docker-compose.yml'),
    );
    if (!existsSync(composeFile)) {
      log('❌ docker-compose.yml not found', 'red');
      log(
        '💡 Please ensure docker-compose.yml exists in the project root',
        'yellow',
      );
      process.exit(1);
    }

    runFullStack();

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

    log(
      '✅ WordPress application started successfully in background!',
      'green',
    );
    log('💡 Use "npm run stop" to stop the application', 'yellow');
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
  runFullStack,
  getDockerCommand,
  isWindows,
  testAPI,
  testEndpoint,
  makeRequest,
  checkIfAppsAreRunning,
};
