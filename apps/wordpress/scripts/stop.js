#!/usr/bin/env node

const { execSync } = require('child_process');
const { getDockerCommand } = require('./start.js');

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

function stopWordPressApps() {
  log('🛑 Stopping WordPress applications...', 'yellow');
  
  const dockerCompose = getDockerCommand();
  
  try {
    // Check if any containers are running first
    log('🔍 Checking for running containers...', 'cyan');
    const runningContainers = execSync(`${dockerCompose} ps -q`, { 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    if (!runningContainers.trim()) {
      log('ℹ️  No running containers found', 'blue');
      return;
    }
    
    // Show what we're stopping
    log('📋 Stopping the following containers:', 'cyan');
    execSync(`${dockerCompose} ps`, { stdio: 'inherit' });
    
    // Stop all containers
    log('🛑 Executing docker-compose down...', 'yellow');
    execSync(`${dockerCompose} down`, { stdio: 'inherit' });
    
    log('✅ WordPress applications stopped successfully', 'green');
    
    // Show final status
    log('\n📊 Final container status:', 'cyan');
    try {
      execSync(`${dockerCompose} ps`, { stdio: 'inherit' });
    } catch (error) {
      log('ℹ️  All containers stopped', 'blue');
    }
    
  } catch (error) {
    log(`❌ Error stopping applications: ${error.message}`, 'red');
    process.exit(1);
  }
}

function showHelp() {
  log('\n📖 Usage:', 'bright');
  log('   npm run stop                    # Stop all WordPress applications', 'cyan');
  log('   node scripts/stop.js            # Stop all WordPress applications', 'cyan');
  log('   node scripts/stop.js --help     # Show this help message', 'cyan');
  
  log('\n🔧 What this does:', 'bright');
  log('   - Stops all running WordPress containers', 'cyan');
  log('   - Removes stopped containers', 'cyan');
  log('   - Preserves volumes (data is kept)', 'cyan');
  log('   - Shows container status before and after', 'cyan');
  
  log('\n💡 Related commands:', 'bright');
  log('   npm start                       # Start applications', 'cyan');
  log('   npm run start:clean             # Stop and remove volumes', 'cyan');
  log('   npm run status                  # Show container status', 'cyan');
}

async function main() {
  const args = process.argv.slice(2);

  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  stopWordPressApps();
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    log(`❌ Unexpected error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  stopWordPressApps,
  showHelp,
};
