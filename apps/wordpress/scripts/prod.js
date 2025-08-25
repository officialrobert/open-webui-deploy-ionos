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
  log('⏳ Waiting for WordPress to be ready...', 'yellow');

  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      try {
        execSync('curl -s http://localhost > /dev/null', { stdio: 'pipe' });
        clearInterval(checkInterval);
        log('✅ WordPress is ready!', 'green');
        resolve();
      } catch (error) {
        // WordPress not ready yet, continue waiting
      }
    }, 5000);
  });
}

function displayAccessInfo() {
  log('\n🌐 Access your applications:', 'bright');
  log('   WordPress: http://localhost', 'cyan');
  log('   WordPress Admin: http://localhost/wp-admin', 'cyan');
  log('   phpMyAdmin: http://localhost:8080', 'cyan');
  log(
    '   Custom REST API: http://localhost/wp-json/custom-api/v1/health',
    'cyan',
  );

  log('\n📝 Production info:', 'bright');
  log('   - Optimized for performance', 'yellow');
  log('   - Debug mode is disabled', 'yellow');
  log('   - TypeScript is pre-compiled', 'yellow');
  log('   - Logs: npm run prod:logs', 'yellow');

  log('\n🛑 Press Ctrl+C to stop the production environment', 'magenta');
}

function cleanup() {
  log('\n🛑 Stopping production environment...', 'yellow');
  try {
    execSync('docker-compose down', { stdio: 'inherit' });
    log('✅ Production environment stopped', 'green');
  } catch (error) {
    log('❌ Error stopping production environment', 'red');
  }
}

async function main() {
  log('🚀 Starting WordPress Production Environment...', 'bright');

  // Check if Docker is running
  if (!checkDocker()) {
    process.exit(1);
  }

  // Check if docker-compose.yml exists
  const composeFile = path.join(__dirname, '..', 'docker-compose.yml');
  if (!existsSync(composeFile)) {
    log('❌ docker-compose.yml not found', 'red');
    process.exit(1);
  }

  // Build and start production environment
  log('📦 Building production containers...', 'cyan');
  execCommand('docker-compose build');

  log('🔧 Starting services...', 'cyan');
  execCommand('docker-compose up -d');

  // Wait for services to be ready
  log('⏳ Waiting for services to be ready...', 'yellow');
  await new Promise((resolve) => setTimeout(resolve, 15000));

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
