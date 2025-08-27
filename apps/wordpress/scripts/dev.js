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

function execCommandSilent(command, options = {}) {
  try {
    return execSync(command, {
      stdio: 'pipe',
      encoding: 'utf8',
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

function getRunMode() {
  const args = process.argv.slice(2);
  const runMode = args.find(arg => arg.startsWith('--mode='))?.split('=')[1];
  
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
  const existingContainer = execCommandSilent('docker ps -q -f name=wordpress-dev');
  if (existingContainer) {
    log('🔄 Stopping existing container...', 'yellow');
    execCommand('docker stop wordpress-dev');
    execCommand('docker rm wordpress-dev');
  }
  
  // Run the container
  const port = process.env.WORDPRESS_PORT || '3000';
  const dbHost = process.env.WORDPRESS_DB_HOST || 'host.docker.internal:3306';
  
  const dockerRunCommand = [
    'docker run -d',
    '--name wordpress-dev',
    `-p ${port}:3000`,
    '-e WORDPRESS_PORT=3000',
    `-e WORDPRESS_DB_HOST=${dbHost}`,
    '-e WORDPRESS_DB_NAME=wordpress',
    '-e WORDPRESS_DB_USER=wordpress',
    '-e WORDPRESS_DB_PASSWORD=wordpress_password',
    '-e WORDPRESS_URL=http://localhost:3000',
    '-e WORDPRESS_TITLE="WordPress Development"',
    '-e WORDPRESS_ADMIN_USER=admin',
    '-e WORDPRESS_ADMIN_PASSWORD=admin',
    '-e WORDPRESS_ADMIN_EMAIL=admin@example.com',
    '-e WORDPRESS_DEBUG=1',
    'wordpress-app'
  ].join(' ');
  
  execCommand(dockerRunCommand);
  log('✅ WordPress container started', 'green');
}

function runDockerCompose() {
  log('📦 Building development containers...', 'cyan');
  execCommand('docker-compose -f docker-compose.dev.yml build');

  log('🔧 Starting services...', 'cyan');
  execCommand('docker-compose -f docker-compose.dev.yml up -d');
}

function runFullStack() {
  log('📦 Building full stack (WordPress + MySQL + phpMyAdmin)...', 'cyan');
  execCommand('docker-compose build --no-cache');

  log('🔧 Starting all services...', 'cyan');
  execCommand('docker-compose up -d');
}

function waitForWordPress() {
  log('⏳ Waiting for WordPress to be ready...', 'yellow');

  return new Promise((resolve) => {
    const port = process.env.WORDPRESS_PORT || '3000';
    const maxAttempts = 30; // 5 minutes max
    let attempts = 0;
    
    const checkInterval = setInterval(() => {
      attempts++;
      try {
        execSync(`curl -s http://localhost:${port} > /dev/null`, { stdio: 'pipe' });
        clearInterval(checkInterval);
        log(`✅ WordPress is ready on port ${port}!`, 'green');
        resolve();
      } catch (error) {
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          log(`❌ WordPress failed to start on port ${port} after ${maxAttempts} attempts`, 'red');
          process.exit(1);
        }
        // Continue waiting
      }
    }, 10000); // Check every 10 seconds
  });
}

function displayAccessInfo() {
  const port = process.env.WORDPRESS_PORT || '3000';
  const runMode = getRunMode();
  
  log('\n🌐 Access your WordPress application:', 'bright');
  log(`   WordPress: http://localhost:${port}`, 'cyan');
  log(`   WordPress Admin: http://localhost:${port}/wp-admin`, 'cyan');
  log(`   Custom REST API: http://localhost:${port}/wp-json/custom-api/v1/health`, 'cyan');

  if (runMode === 'full-stack') {
    log('   phpMyAdmin: http://localhost:8080', 'cyan');
    log('   MySQL Database: localhost:3306', 'cyan');
  }

  log('\n📝 Development info:', 'bright');
  log('   - WordPress debug mode is enabled', 'yellow');
  if (runMode === 'full-stack') {
    log('   - Full stack with MySQL and phpMyAdmin', 'yellow');
    log('   - Logs: docker-compose logs wordpress', 'yellow');
  } else {
    log('   - Container name: wordpress-dev', 'yellow');
    log('   - Logs: docker logs wordpress-dev', 'yellow');
  }

  log('\n🛑 Press Ctrl+C to stop the development environment', 'magenta');
}

function cleanup() {  
  const runMode = getRunMode();
  
  log('\n🛑 Stopping development environment...', 'yellow');
  try {
    if (runMode === 'docker-run') {
      execSync('docker stop wordpress-dev', { stdio: 'inherit' });
      execSync('docker rm wordpress-dev', { stdio: 'inherit' });
      log('✅ WordPress container stopped and removed', 'green');
    } else if (runMode === 'compose') {
      execSync('docker-compose -f docker-compose.dev.yml down', {
        stdio: 'inherit',
      });
      log('✅ Development environment stopped', 'green');
    } else if (runMode === 'full-stack') {
      execSync('docker-compose down', {
        stdio: 'inherit',
      });
      log('✅ Full stack environment stopped', 'green');
    }
  } catch (error) {
    log('❌ Error stopping development environment', 'red');
  }
}

function showHelp() {
  log('\n📖 Usage:', 'bright');
  log('   npm run dev                    # Run full stack (WordPress + MySQL + phpMyAdmin)', 'cyan');
  log('   npm run dev -- --mode=full-stack  # Run full stack (default)', 'cyan');
  log('   npm run dev -- --mode=docker-run  # Run with Docker run command (no database)', 'cyan');
  log('   npm run dev -- --mode=compose     # Run with docker-compose.dev.yml', 'cyan');
  log('\n🔧 Environment Variables:', 'bright');
  log('   WORDPRESS_PORT=3000            # Port to run on (default: 3000)', 'cyan');
  log('   WORDPRESS_DB_HOST=host.docker.internal:3306  # Database host', 'cyan');
  log('\n📝 Examples:', 'bright');
  log('   WORDPRESS_PORT=3001 npm run dev', 'yellow');
  log('   WORDPRESS_DB_HOST=localhost:3306 npm run dev', 'yellow');
  log('\n🌐 Full Stack Includes:', 'bright');
  log('   - WordPress on port 3000', 'cyan');
  log('   - MySQL database on port 3306', 'cyan');
  log('   - phpMyAdmin on port 8080', 'cyan');
}

async function main() {
  const args = process.argv.slice(2);
  
  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  const runMode = getRunMode();
  
  log(`🚀 Starting WordPress Development Environment (${runMode})...`, 'bright');

  // Check if Docker is running
  if (!checkDocker()) {
    process.exit(1);
  }

  try {
    if (runMode === 'docker-run') {
      // Build and run with Docker
      buildDockerImage();
      runDockerContainer();
    } else if (runMode === 'compose') {
      // Check if docker-compose.dev.yml exists
      const composeFile = path.join(__dirname, '..', 'docker-compose.dev.yml');
      if (!existsSync(composeFile)) {
        log('❌ docker-compose.dev.yml not found', 'red');
        log('💡 Use --mode=full-stack to run with the current docker-compose.yml', 'yellow');
        process.exit(1);
      }
      runDockerCompose();
    } else if (runMode === 'full-stack') {
      // Check if docker-compose.yml exists
      const composeFile = path.join(__dirname, '..', 'docker-compose.yml');
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
  waitForWordPress, 
  buildDockerImage, 
  runDockerContainer,
  runDockerCompose,
  runFullStack,
  getRunMode 
};
