#!/usr/bin/env node

const { execSync } = require('child_process');
const { getDockerCommand, isWindows } = require('./start.js');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getStatusIcon(status) {
  if (status.includes('Up') && status.includes('healthy')) return '🟢';
  if (status.includes('Up')) return '🟡';
  if (status.includes('Exited')) return '🔴';
  return '⚪';
}

function getPortCheckCommand(port) {
  if (isWindows()) {
    return `netstat -an | findstr :${port}`;
  }
  return `netstat -tuln | grep :${port}`;
}

function countRunningContainers() {
  try {
    const runningContainers = execSync('docker ps -q', {
      stdio: 'pipe',
      encoding: 'utf8',
    });

    if (!runningContainers.trim()) {
      return 0;
    }

    // Count lines (containers)
    return runningContainers.trim().split('\n').length;
  } catch (error) {
    return 0;
  }
}

function checkContainerHealth() {
  log('\n🏥 WordPress Application Health Check', 'bright');
  log('='.repeat(50), 'cyan');

  const dockerCompose = getDockerCommand();
  const containers = [
    'wordpress-app-a',
    'wordpress-app-b',
    'wordpress-app-c',
    'wordpress-db',
    'wordpress-phpmyadmin',
  ];

  try {
    // Get container status
    log('\n📊 Container Status:', 'bright');
    log('─'.repeat(50), 'cyan');

    const containerStatus = execSync(
      `${dockerCompose} ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"`,
      {
        stdio: 'pipe',
        encoding: 'utf8',
      },
    );

    console.log(containerStatus);

    // Get detailed resource usage
    log('\n💻 Resource Usage:', 'bright');
    log('─'.repeat(50), 'cyan');

    const resourceUsage = execSync(
      'docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"',
      {
        stdio: 'pipe',
        encoding: 'utf8',
      },
    );

    console.log(resourceUsage);

    // Check individual container health
    log('\n🔍 Individual Container Health:', 'bright');
    log('─'.repeat(50), 'cyan');

    for (const container of containers) {
      try {
        // Check if container exists and get its status
        const containerInfo = execSync(
          `docker ps -a --filter name=${container} --format "{{.Names}}\t{{.Status}}\t{{.Ports}}"`,
          {
            stdio: 'pipe',
            encoding: 'utf8',
          },
        ).trim();

        if (containerInfo) {
          const [name, status, ports] = containerInfo.split('\t');
          const statusIcon = getStatusIcon(status);

          log(`${statusIcon} ${name}:`, 'white');
          log(`   Status: ${status}`, status.includes('Up') ? 'green' : 'red');
          log(`   Ports: ${ports || 'N/A'}`, 'cyan');

          // Check if container is responding
          if (status.includes('Up')) {
            try {
              // Try to ping the container
              execSync(
                `docker exec ${container} echo "Container is responsive"`,
                {
                  stdio: 'pipe',
                  timeout: 5000,
                },
              );
              log(`   Health: 🟢 Responsive`, 'green');
            } catch (error) {
              log(`   Health: 🔴 Not responsive`, 'red');
            }
          }
        } else {
          log(`⚪ ${container}: Not found`, 'yellow');
        }
      } catch (error) {
        log(`❌ Error checking ${container}: ${error.message}`, 'red');
      }
    }

    // Check port accessibility
    log('\n🌐 Port Accessibility:', 'bright');
    log('─'.repeat(50), 'cyan');

    const ports = [
      { port: 3001, service: 'WordPress App A' },
      { port: 3002, service: 'WordPress App B' },
      { port: 3003, service: 'WordPress App C' },
      { port: 3307, service: 'MySQL Database' },
      { port: 8081, service: 'phpMyAdmin' },
    ];

    for (const { port, service } of ports) {
      try {
        const portCheckCommand = getPortCheckCommand(port);
        const portCheck = execSync(portCheckCommand, {
          stdio: 'pipe',
          encoding: 'utf8',
        });

        if (portCheck.trim()) {
          log(`🟢 Port ${port} (${service}): Accessible`, 'green');
        } else {
          log(`🔴 Port ${port} (${service}): Not accessible`, 'red');
        }
      } catch (error) {
        log(`🔴 Port ${port} (${service}): Not accessible`, 'red');
      }
    }

    // System overview
    log('\n💾 System Overview:', 'bright');
    log('─'.repeat(50), 'cyan');

    try {
      // Get Docker system info
      const dockerInfo = execSync('docker system df', {
        stdio: 'pipe',
        encoding: 'utf8',
      });

      console.log(dockerInfo);

      // Get total containers running using cross-platform method
      const runningCount = countRunningContainers();

      log(`\n📈 Running Containers: ${runningCount}`, 'cyan');
    } catch (error) {
      log(`❌ Error getting system info: ${error.message}`, 'red');
    }

    // Health summary
    log('\n📋 Health Summary:', 'bright');
    log('─'.repeat(50), 'cyan');

    const runningCount = countRunningContainers();
    const totalCount = containers.length;

    if (runningCount === totalCount) {
      log('🟢 All containers are running and healthy!', 'green');
    } else if (runningCount > 0) {
      log(`🟡 ${runningCount}/${totalCount} containers are running`, 'yellow');
    } else {
      log('🔴 No containers are running', 'red');
    }

    log('\n💡 Quick Commands:', 'bright');
    log('   npm start                    # Start all applications', 'cyan');
    log('   npm run stop                 # Stop all applications', 'cyan');
    log('   npm run status               # Show container status', 'cyan');
    log('   npm run logs:app_a           # View app A logs', 'cyan');
    log('   npm run logs:app_b           # View app B logs', 'cyan');
    log('   npm run logs:app_c           # View app C logs', 'cyan');
  } catch (error) {
    log(`❌ Error during health check: ${error.message}`, 'red');
    log('💡 Make sure Docker is running and containers are started', 'yellow');
  }
}

function showHelp() {
  log('\n📖 Health Check Usage:', 'bright');
  log(
    '   npm run health                # Run comprehensive health check',
    'cyan',
  );
  log('   node scripts/health.js        # Run health check directly', 'cyan');
  log('   node scripts/health.js --help # Show this help message', 'cyan');

  log('\n🔧 What this checks:', 'bright');
  log('   - Container status and health', 'cyan');
  log('   - CPU and memory usage', 'cyan');
  log('   - Network and disk I/O', 'cyan');
  log('   - Port accessibility', 'cyan');
  log('   - System resource overview', 'cyan');
  log('   - Individual container responsiveness', 'cyan');

  log('\n📊 Status Indicators:', 'bright');
  log('   🟢 - Healthy/Running', 'green');
  log('   🟡 - Running but needs attention', 'yellow');
  log('   🔴 - Stopped/Error', 'red');
  log('   ⚪ - Not found', 'white');

  log('\n💡 Related commands:', 'bright');
  log('   npm start                       # Start applications', 'cyan');
  log('   npm run stop                    # Stop applications', 'cyan');
  log('   npm run status                  # Quick status check', 'cyan');
}

async function main() {
  const args = process.argv.slice(2);

  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  checkContainerHealth();
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    log(`❌ Unexpected error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  checkContainerHealth,
  showHelp,
};
