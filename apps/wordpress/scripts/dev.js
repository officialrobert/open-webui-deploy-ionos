#!/usr/bin/env node

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

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

function execCommand(command, options = {}) {
  try {
    return execSync(command, {
      stdio: 'inherit',
      encoding: 'utf8',
      ...options,
    });
  } catch (error) {
    log(`❌ Error executing: ${command}`, 'red');
    log(error.message, 'red');
    process.exit(1);
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

function waitForWordPress() {
  log('⏳ Waiting for WordPress apps to be ready...', 'yellow');

  return new Promise((resolve) => {
    const apps = [
      { port: 3000, name: 'App A' },
      { port: 3001, name: 'App B' },
      { port: 3002, name: 'App C' }
    ];
    
    let readyApps = 0;
    const totalApps = apps.length;
    
    const checkInterval = setInterval(() => {
      apps.forEach((app, index) => {
        if (!app.ready) {
          try {
            execSync(`curl -s http://localhost:${app.port} > /dev/null`, { stdio: 'pipe' });
            app.ready = true;
            readyApps++;
            log(`✅ ${app.name} is ready on port ${app.port}!`, 'green');
          } catch (error) {
            // App not ready yet
          }
        }
      });
      
      if (readyApps === totalApps) {
        clearInterval(checkInterval);
        log('✅ All WordPress apps are ready!', 'green');
        resolve();
      }
    }, 5000);
  });
}

function displayAccessInfo() {
  log('\n🌐 Access your applications:', 'bright');
  log('   App A - WordPress: http://localhost:3000', 'cyan');
  log('   App A - Admin: http://localhost:3000/wp-admin', 'cyan');
  log('   App B - WordPress: http://localhost:3001', 'cyan');
  log('   App B - Admin: http://localhost:3001/wp-admin', 'cyan');
  log('   App C - WordPress: http://localhost:3002', 'cyan');
  log('   App C - Admin: http://localhost:3002/wp-admin', 'cyan');
  log('   phpMyAdmin: http://localhost:8080', 'cyan');
  log(
    '   App A - REST API: http://localhost:3000/wp-json/custom-api/v1/health',
    'cyan',
  );
  log(
    '   App B - REST API: http://localhost:3001/wp-json/custom-api/v1/health',
    'cyan',
  );
  log(
    '   App C - REST API: http://localhost:3002/wp-json/custom-api/v1/health',
    'cyan',
  );

  log('\n📝 Development info:', 'bright');
  log('   - Plugin source is mounted for hot reloading', 'yellow');
  log('   - TypeScript is watching for changes', 'yellow');
  log('   - WordPress debug mode is enabled', 'yellow');
  log('   - Logs: npm run dev:logs', 'yellow');

  log('\n🛑 Press Ctrl+C to stop the development environment', 'magenta');
}

function cleanup() {
  log('\n🛑 Stopping development environment...', 'yellow');
  try {
    execSync('docker-compose -f docker-compose.dev.yml down', {
      stdio: 'inherit',
    });
    log('✅ Development environment stopped', 'green');
  } catch (error) {
    log('❌ Error stopping development environment', 'red');
  }
}

async function main() {
  log('🚀 Starting WordPress Development Environment...', 'bright');

  // Check if Docker is running
  if (!checkDocker()) {
    process.exit(1);
  }

  // Check if docker-compose.dev.yml exists
  const composeFile = path.join(__dirname, '..', 'docker-compose.dev.yml');
  if (!existsSync(composeFile)) {
    log('❌ docker-compose.dev.yml not found', 'red');
    process.exit(1);
  }

  // Build and start development environment
  log('📦 Building development containers...', 'cyan');
  execCommand('docker-compose -f docker-compose.dev.yml build');

  log('🔧 Starting services...', 'cyan');
  execCommand('docker-compose -f docker-compose.dev.yml up -d');

  // Wait for services to be ready
  log('⏳ Waiting for services to be ready...', 'yellow');
  await new Promise((resolve) => setTimeout(resolve, 10000));

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
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    log(`❌ Unexpected error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { main, cleanup, checkDocker, waitForWordPress };
