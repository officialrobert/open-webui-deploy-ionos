#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
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
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    return execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf8',
      ...options 
    });
  } catch (error) {
    log(`❌ Error executing: ${command}`, 'red');
    log(error.message, 'red');
    throw error;
  }
}

function execCommandSilent(command, options = {}) {
  try {
    return execSync(command, { 
      stdio: 'pipe', 
      encoding: 'utf8',
      ...options 
    });
  } catch (error) {
    return null;
  }
}

function createWpConfig() {
  const wpConfigPath = path.join('/var/www/html', 'wp-config.php');
  
  if (!fs.existsSync(wpConfigPath)) {
    log('Creating wp-config.php...', 'cyan');
    
    // Copy wp-config-sample.php to wp-config.php
    execCommand('cp wp-config-sample.php wp-config.php');
    
    // Read the file
    let configContent = fs.readFileSync(wpConfigPath, 'utf8');
    
    // Replace database settings with environment variables
    const dbName = process.env.WORDPRESS_DB_NAME || 'wordpress';
    const dbUser = process.env.WORDPRESS_DB_USER || 'wordpress';
    const dbPassword = process.env.WORDPRESS_DB_PASSWORD || 'wordpress_password';
    const dbHost = process.env.WORDPRESS_DB_HOST || 'db:3306';
    const tablePrefix = process.env.WORDPRESS_TABLE_PREFIX || 'wp_';
    
    configContent = configContent.replace(
      /define\( 'DB_NAME', 'database_name_here' \);/g,
      `define( 'DB_NAME', '${dbName}' );`
    );
    
    configContent = configContent.replace(
      /define\( 'DB_USER', 'username_here' \);/g,
      `define( 'DB_USER', '${dbUser}' );`
    );
    
    configContent = configContent.replace(
      /define\( 'DB_PASSWORD', 'password_here' \);/g,
      `define( 'DB_PASSWORD', '${dbPassword}' );`
    );
    
    configContent = configContent.replace(
      /define\( 'DB_HOST', 'localhost' \);/g,
      `define( 'DB_HOST', '${dbHost}' );`
    );
    
    configContent = configContent.replace(
      /\$table_prefix = 'wp_';/g,
      `$table_prefix = '${tablePrefix}';`
    );
    
    // Add debug settings
    const debug = process.env.WORDPRESS_DEBUG === '1';
    if (debug) {
      configContent += `
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );
`;
    } else {
      configContent += `
define( 'WP_DEBUG', false );
define( 'WP_DEBUG_LOG', false );
`;
    }
    
    // Write the updated config
    fs.writeFileSync(wpConfigPath, configContent);
    
    log('wp-config.php created successfully', 'green');
  } else {
    log('wp-config.php already exists', 'yellow');
  }
}

function waitForDatabase() {
  const skipDatabase = process.env.WORDPRESS_SKIP_DB === '1';
  
  if (skipDatabase) {
    log('⏭️ Skipping database wait (WORDPRESS_SKIP_DB=1)', 'yellow');
    return Promise.resolve();
  }
  
  log('Waiting for database to be ready...', 'yellow');
  
  return new Promise((resolve) => {
    const dbHost = process.env.WORDPRESS_DB_HOST || 'db:3306';
    const [dbHostName, dbPort] = dbHost.split(':');
    const dbPortNum = dbPort || '3306';
    
    const maxAttempts = 30; // 5 minutes max
    let attempts = 0;
    
    const checkInterval = setInterval(() => {
      attempts++;
      const result = execCommandSilent(`mysqladmin ping -h"${dbHostName}" -P"${dbPortNum}"`);
      
      if (result !== null) {
        clearInterval(checkInterval);
        log('Database is ready!', 'green');
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        log('Database not available after 5 minutes. Starting WordPress anyway...', 'yellow');
        resolve();
      }
    }, 10000); // Check every 10 seconds
  });
}

function installWordPress() {
  const skipDatabase = process.env.WORDPRESS_SKIP_DB === '1';
  
  if (skipDatabase) {
    log('⏭️ Skipping WordPress installation (WORDPRESS_SKIP_DB=1)', 'yellow');
    return;
  }
  
  const result = execCommandSilent('wp core is-installed --allow-root');
  
  if (result === null) {
    log('Installing WordPress...', 'cyan');
    
    // Get the port from environment or default to 80
    const port = process.env.WORDPRESS_PORT || '80';
    const baseUrl = process.env.WORDPRESS_URL || `http://localhost:${port}`;
    const title = process.env.WORDPRESS_TITLE || 'WordPress Site';
    const adminUser = process.env.WORDPRESS_ADMIN_USER || 'admin';
    const adminPassword = process.env.WORDPRESS_ADMIN_PASSWORD || 'admin';
    const adminEmail = process.env.WORDPRESS_ADMIN_EMAIL || 'admin@example.com';
    
    try {
      execCommand(`wp core install --url="${baseUrl}" --title="${title}" --admin_user="${adminUser}" --admin_password="${adminPassword}" --admin_email="${adminEmail}" --allow-root`);
      log('WordPress installed successfully', 'green');
    } catch (error) {
      log('Warning: Could not install WordPress. Database may not be available.', 'yellow');
      log('WordPress will show installation page when accessed.', 'yellow');
    }
  } else {
    log('WordPress is already installed', 'yellow');
  }
}

function setPermissions() {
  log('Setting proper permissions...', 'cyan');
  execCommand('chown -R www-data:www-data /var/www/html');
  execCommand('chmod -R 755 /var/www/html');
}

function activatePlugin() {
  const skipDatabase = process.env.WORDPRESS_SKIP_DB === '1';
  
  if (skipDatabase) {
    log('⏭️ Skipping plugin activation (WORDPRESS_SKIP_DB=1)', 'yellow');
    return;
  }
  
  log('Activating custom REST API plugin...', 'cyan');
  try {
    execCommand('wp plugin activate custom-rest-api --allow-root');
    log('Custom REST API plugin activated', 'green');
  } catch (error) {
    log('Plugin activation failed (may already be active or database not available)', 'yellow');
  }
}

function configureApache() {
  const port = process.env.WORDPRESS_PORT || '80';
  log(`🔧 Configuring Apache for port ${port}...`, 'cyan');
  
  // Update ports.conf
  execCommand(`sed -i 's/Listen 80/Listen ${port}/' /etc/apache2/ports.conf`);
  
  // Update virtual host configuration
  const vhostConfig = `/etc/apache2/sites-available/000-default.conf`;
  let vhostContent = fs.readFileSync(vhostConfig, 'utf8');
  
  // Replace the VirtualHost port
  vhostContent = vhostContent.replace(
    /<VirtualHost \*:80>/g,
    `<VirtualHost *:${port}>`
  );
  
  // Write the updated configuration
  fs.writeFileSync(vhostConfig, vhostContent);
  
  log('Apache configuration updated', 'green');
}

async function main() {
  try {
    const skipDatabase = process.env.WORDPRESS_SKIP_DB === '1';
    const mode = skipDatabase ? 'No Database Mode' : 'Full Mode';
    
    log(`🚀 Starting WordPress (${mode})...`, 'bright');
    
    // Change to WordPress directory
    process.chdir('/var/www/html');
    
    // Create wp-config.php
    createWpConfig();
    
    // Wait for database (if not skipped)
    await waitForDatabase();
    
    // Install WordPress (if not skipped)
    installWordPress();
    
    // Set proper permissions
    setPermissions();
    
    // Activate our custom plugin (if not skipped)
    activatePlugin();
    
    // Configure Apache
    configureApache();
    
    const port = process.env.WORDPRESS_PORT || '80';
    const baseUrl = process.env.WORDPRESS_URL || `http://localhost:${port}`;
    
    log('✅ WordPress is ready!', 'green');
    log('\n🌐 Access your applications:', 'bright');
    log(`   WordPress: ${baseUrl}`, 'cyan');
    log(`   WordPress Admin: ${baseUrl}/wp-admin`, 'cyan');
    log(`   Custom REST API: ${baseUrl}/wp-json/custom-api/v1/health`, 'cyan');
    
    if (!skipDatabase) {
      log('   phpMyAdmin: http://localhost:8080', 'cyan');
      log('   MySQL Database: localhost:3306', 'cyan');
    } else {
      log('\n📝 Note: Running in no-database mode', 'yellow');
      log('   WordPress will show installation page when accessed', 'yellow');
      log('   Set WORDPRESS_SKIP_DB=0 to enable database operations', 'yellow');
    }
    
    // Start Apache
    log('\n🔧 Starting Apache...', 'cyan');
    execCommand('apache2-foreground');
    
  } catch (error) {
    log(`❌ Error during startup: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    log(`❌ Unexpected error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { 
  main, 
  createWpConfig, 
  waitForDatabase, 
  installWordPress, 
  setPermissions,
  activatePlugin,
  configureApache
};
