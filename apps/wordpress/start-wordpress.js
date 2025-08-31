#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env files
function loadEnvFiles() {
  const envFiles = [
    '.env',
    '.env.local',
    '.env.production',
    '.env.development',
  ];

  let filesLoaded = 0;

  for (const envFile of envFiles) {
    const envPath = path.join(__dirname, envFile);
    if (fs.existsSync(envPath)) {
      try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=').replace(/^["']|["']$/g, '');
              process.env[key] = value;
            }
          }
        }
        console.log(`Environment variables loaded from ${envFile}`);
        filesLoaded++;
      } catch (error) {
        console.log(`Warning: Could not read ${envFile}: ${error.message}`);
      }
    }
  }

  if (filesLoaded === 0) {
    console.log('No environment files found, using system defaults');
  }
}

// Load environment variables at startup
loadEnvFiles();

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

// Log important environment variables for debugging
if (process.env.OPEN_WEATHER_MAP_KEY) {
  const maskedKey =
    process.env.OPEN_WEATHER_MAP_KEY.substring(0, 4) +
    '*'.repeat(Math.max(0, process.env.OPEN_WEATHER_MAP_KEY.length - 8)) +
    process.env.OPEN_WEATHER_MAP_KEY.substring(
      process.env.OPEN_WEATHER_MAP_KEY.length - 4,
    );
  log(`🌤️  OpenWeatherMap API Key loaded: ${maskedKey}`, 'green');
} else {
  log(
    '⚠️  OpenWeatherMap API Key not found in environment variables',
    'yellow',
  );
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
    throw error;
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

function createWpConfig() {
  const wpConfigPath = path.join('/var/www/html', 'wp-config.php');

  log('Creating wp-config.php manually...', 'cyan');

  try {
    // Get environment variables with defaults
    const dbName = process.env.WORDPRESS_DB_NAME || 'wordpress';
    const dbUser = process.env.WORDPRESS_DB_USER || 'wordpress';
    const dbPassword =
      process.env.WORDPRESS_DB_PASSWORD || 'wordpress_password';
    const dbHost = process.env.WORDPRESS_DB_HOST || 'db:3306';
    const tablePrefix = process.env.WORDPRESS_TABLE_PREFIX || 'wp_';
    const debug = process.env.WORDPRESS_DEBUG === '1';

    // Create a clean wp-config.php file from scratch
    const wpConfigContent = `<?php
/**
 * The base configuration for WordPress
 *
 * This file contains the following configurations:
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', '${dbName}' );

/** Database username */
define( 'DB_USER', '${dbUser}' );

/** Database password */
define( 'DB_PASSWORD', '${dbPassword}' );

/** Database hostname */
define( 'DB_HOST', '${dbHost}' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         'demo-auth-key-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}' );
define( 'SECURE_AUTH_KEY',  'demo-secure-auth-key-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}' );
define( 'LOGGED_IN_KEY',    'demo-logged-in-key-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}' );
define( 'NONCE_KEY',        'demo-nonce-key-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}' );
define( 'AUTH_SALT',        'demo-auth-salt-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}' );
define( 'SECURE_AUTH_SALT', 'demo-secure-auth-salt-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}' );
define( 'LOGGED_IN_SALT',   'demo-logged-in-salt-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}' );
define( 'NONCE_SALT',       'demo-nonce-salt-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}' );

/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = '${tablePrefix}';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://developer.wordpress.org/advanced-administration/debug/debug-wordpress/
 */
define( 'WP_DEBUG', ${debug ? 'true' : 'false'} );
define( 'WP_DEBUG_LOG', ${debug ? 'true' : 'false'} );
define( 'WP_DEBUG_DISPLAY', false );

/* Add any custom values between this line and the "stop editing" line. */

// Force SSL for production (optional - uncomment if needed)
// define( 'FORCE_SSL_ADMIN', true );

// Disable file editing in admin (security)
define( 'DISALLOW_FILE_EDIT', true );

// Set memory limit for better performance
define( 'WP_MEMORY_LIMIT', '256M' );

// Enable automatic updates (for demo purposes)
define( 'AUTOMATIC_UPDATER_DISABLED', false );

// Allow WordPress to manage wp-content directory
define( 'WP_CONTENT_DIR', __DIR__ . '/wp-content' );
define( 'WP_CONTENT_URL', 'http://' . $_SERVER['HTTP_HOST'] . '/wp-content' );

// Proxy Trust Configuration
// Trust proxy headers for proper IP detection and SSL handling
if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    $_SERVER['REMOTE_ADDR'] = $_SERVER['HTTP_X_FORWARDED_FOR'];
}
if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
    $_SERVER['HTTPS'] = 'on';
}
if (isset($_SERVER['HTTP_X_FORWARDED_HOST'])) {
    $_SERVER['HTTP_HOST'] = $_SERVER['HTTP_X_FORWARDED_HOST'];
}

// WordPress proxy settings
define( 'WP_PROXY_HOST', '${process.env.WP_PROXY_HOST || ''}' );
define( 'WP_PROXY_PORT', '${process.env.WP_PROXY_PORT || ''}' );
define( 'WP_PROXY_USERNAME', '${process.env.WP_PROXY_USERNAME || ''}' );
define( 'WP_PROXY_PASSWORD', '${process.env.WP_PROXY_PASSWORD || ''}' );
define( 'WP_PROXY_BYPASS_HOSTS', '${
      process.env.WP_PROXY_BYPASS_HOSTS || 'localhost,127.0.0.1'
    }' );

// Trust all proxy headers (use with caution in production)
define( 'WP_HTTP_BLOCK_EXTERNAL', false );

// API Configuration
define( 'OPEN_WEATHER_MAP_KEY', '${process.env.OPEN_WEATHER_MAP_KEY || ''}' );
define( 'NEWSAPI_KEY', '${process.env.NEWSAPI_KEY || ''}' );
define( 'DUCKDUCKGO_ENABLED', '${process.env.DUCKDUCKGO_ENABLED || 'true'}' );

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
`;

    // Write the clean config file
    fs.writeFileSync(wpConfigPath, wpConfigContent);

    log('wp-config.php created successfully with clean configuration', 'green');
  } catch (error) {
    log(`❌ Error creating wp-config.php: ${error.message}`, 'red');
    log('Creating basic wp-config.php with minimal settings...', 'yellow');

    // Create a minimal wp-config.php if the sample file is not available
    const minimalConfig = `<?php
define( 'DB_NAME', '${process.env.WORDPRESS_DB_NAME || 'wordpress'}' );
define( 'DB_USER', '${process.env.WORDPRESS_DB_USER || 'wordpress'}' );
define( 'DB_PASSWORD', '${
      process.env.WORDPRESS_DB_PASSWORD || 'wordpress_password'
    }' );
define( 'DB_HOST', '${process.env.WORDPRESS_DB_HOST || 'db:3306'}' );
define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );

$table_prefix = '${process.env.WORDPRESS_TABLE_PREFIX || 'wp_'}' ;

define( 'WP_DEBUG', ${process.env.WORDPRESS_DEBUG === '1' ? 'true' : 'false'} );
define( 'WP_DEBUG_LOG', ${
      process.env.WORDPRESS_DEBUG === '1' ? 'true' : 'false'
    } );
define( 'WP_DEBUG_DISPLAY', false );

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-settings.php';
`;

    fs.writeFileSync(wpConfigPath, minimalConfig);
    log('Basic wp-config.php created', 'green');
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
      const result = execCommandSilent(
        `mysqladmin ping -h"${dbHostName}" -P"${dbPortNum}"`,
      );

      if (result !== null) {
        clearInterval(checkInterval);
        log('Database is ready!', 'green');
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        log(
          'Database not available after 5 minutes. Starting WordPress anyway...',
          'yellow',
        );
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
    const port = process.env.APACHE_PORT || process.env.WORDPRESS_PORT || '80';
    const baseUrl = process.env.WORDPRESS_URL || `http://localhost:${port}`;
    const title = process.env.WORDPRESS_TITLE || 'WordPress Site';
    const adminUser = process.env.WORDPRESS_ADMIN_USER || 'admin';
    const adminPassword = process.env.WORDPRESS_ADMIN_PASSWORD || 'admin';
    const adminEmail = process.env.WORDPRESS_ADMIN_EMAIL || 'admin@example.com';

    try {
      execCommand(
        `wp core install --url="${baseUrl}" --title="${title}" --admin_user="${adminUser}" --admin_password="${adminPassword}" --admin_email="${adminEmail}" --allow-root`,
      );
      log('WordPress installed successfully', 'green');
    } catch (error) {
      log(
        'Warning: Could not install WordPress. Database may not be available.',
        'yellow',
      );
      log('WordPress will show installation page when accessed.', 'yellow');
    }
  } else {
    log('WordPress is already installed', 'yellow');

    // Update site URL to ensure it matches the current environment
    const baseUrl =
      process.env.WORDPRESS_URL ||
      `http://localhost:${
        process.env.APACHE_PORT || process.env.WORDPRESS_PORT || '80'
      }`;
    try {
      execCommand(`wp option update home "${baseUrl}" --allow-root`);
      execCommand(`wp option update siteurl "${baseUrl}" --allow-root`);
      log(`Updated site URL to: ${baseUrl}`, 'green');
    } catch (error) {
      log(
        'Warning: Could not update site URL. This is normal if database is not available.',
        'yellow',
      );
    }
  }
}

function checkWordPressFiles() {
  log('Checking WordPress files...', 'cyan');

  const requiredFiles = [
    '/var/www/html/index.php',
    '/var/www/html/wp-config.php',
    '/var/www/html/wp-settings.php',
    '/var/www/html/wp-load.php',
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      log(`❌ Missing required file: ${file}`, 'red');
      throw new Error(`Missing required WordPress file: ${file}`);
    }
  }

  log('All required WordPress files found', 'green');
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
    log(
      'Plugin activation failed (may already be active or database not available)',
      'yellow',
    );
  }
}

function setupDefaultTheme() {
  const skipDatabase = process.env.WORDPRESS_SKIP_DB === '1';

  if (skipDatabase) {
    log('⏭️ Skipping theme setup (WORDPRESS_SKIP_DB=1)', 'yellow');
    return;
  }

  log('Activating default theme...', 'cyan');
  try {
    execCommand('wp theme activate twentytwentyfour --allow-root');
    log('Default theme activated', 'green');
  } catch (error) {
    log(
      'Theme activation failed (may already be active or database not available)',
      'yellow',
    );
  }
}

function configureApache() {
  const port = process.env.APACHE_PORT || process.env.WORDPRESS_PORT || '80';
  log(`🔧 Configuring Apache for port ${port}...`, 'cyan');

  try {
    // Update ports.conf - handle both 80 and 3000 (from Dockerfile)
    execCommand(`sed -i 's/Listen 80/Listen ${port}/' /etc/apache2/ports.conf`);
    execCommand(
      `sed -i 's/Listen 3000/Listen ${port}/' /etc/apache2/ports.conf`,
    );

    // Update virtual host configuration
    const vhostConfig = `/etc/apache2/sites-available/000-default.conf`;
    let vhostContent = fs.readFileSync(vhostConfig, 'utf8');

    // Replace the VirtualHost port - handle both 80 and 3000
    vhostContent = vhostContent.replace(
      /<VirtualHost \*:80>/g,
      `<VirtualHost *:${port}>`,
    );
    vhostContent = vhostContent.replace(
      /<VirtualHost \*:3000>/g,
      `<VirtualHost *:${port}>`,
    );

    // Ensure proper DocumentRoot and Directory settings
    if (!vhostContent.includes('DocumentRoot /var/www/html')) {
      vhostContent = vhostContent.replace(
        /DocumentRoot \/var\/www\/html/g,
        'DocumentRoot /var/www/html',
      );
    }

    // Add Directory configuration if not present
    if (!vhostContent.includes('<Directory /var/www/html>')) {
      vhostContent += `
    <Directory /var/www/html>
        AllowOverride All
        Require all granted
    </Directory>
`;
    }

    // Add proxy headers configuration
    if (!vhostContent.includes('RemoteIPHeader')) {
      vhostContent += `
    # Proxy Headers Configuration
    RemoteIPHeader X-Forwarded-For
    RemoteIPInternalProxy 10.0.0.0/8
    RemoteIPInternalProxy 172.16.0.0/12
    RemoteIPInternalProxy 192.168.0.0/16
    RemoteIPInternalProxy 127.0.0.1
    RemoteIPInternalProxy ::1
    
    # Trust proxy headers
    RequestHeader set X-Forwarded-Proto "http"
    RequestHeader set X-Forwarded-Port "80"
    
    # Enable mod_remoteip
    LoadModule remoteip_module modules/mod_remoteip.so
`;
    }

    // Write the updated configuration
    fs.writeFileSync(vhostConfig, vhostContent);

    log('Apache configuration updated', 'green');
  } catch (error) {
    log(`❌ Error configuring Apache: ${error.message}`, 'red');
    log('Using default Apache configuration', 'yellow');
  }
}

async function main() {
  try {
    const skipDatabase = process.env.WORDPRESS_SKIP_DB === '1';
    const mode = skipDatabase ? 'No Database Mode' : 'Full Mode';
    const instance = process.env.WORDPRESS_INSTANCE || 'default';
    const tablePrefix = process.env.WORDPRESS_TABLE_PREFIX || 'wp_';

    log(`🚀 Starting WordPress Instance: ${instance} (${mode})...`, 'bright');
    log(`📊 Database: ${process.env.WORDPRESS_DB_NAME || 'wordpress'}`, 'cyan');
    log(`🏷️  Table Prefix: ${tablePrefix}`, 'cyan');

    // Change to WordPress directory
    process.chdir('/var/www/html');

    // Create wp-config.php
    createWpConfig();

    // Check WordPress files
    checkWordPressFiles();

    // Wait for database (if not skipped)
    await waitForDatabase();

    // Install WordPress (if not skipped)
    installWordPress();

    // Set proper permissions
    setPermissions();

    // Activate our custom plugin (if not skipped)
    activatePlugin();

    // Setup default theme (if not skipped)
    setupDefaultTheme();

    // Configure Apache
    configureApache();

    const port = process.env.APACHE_PORT || process.env.WORDPRESS_PORT || '80';
    const baseUrl = process.env.WORDPRESS_URL || `http://localhost:${port}`;

    log('✅ WordPress is ready!', 'green');
    log(`\n🌐 WordPress Instance: ${instance}`, 'bright');
    log(`   WordPress: ${baseUrl}`, 'cyan');
    log(`   WordPress Admin: ${baseUrl}/wp-admin`, 'cyan');
    log(
      `   Custom REST API: ${baseUrl}/index.php?rest_route=/custom-api/v1/health`,
      'cyan',
    );

    if (!skipDatabase) {
      log('   phpMyAdmin: http://localhost:8081', 'cyan');
      log('   MySQL Database: localhost:3307', 'cyan');
    } else {
      log('\n📝 Note: Running in no-database mode', 'yellow');
      log('   WordPress will show installation page when accessed', 'yellow');
      log('   Set WORDPRESS_SKIP_DB=0 to enable database operations', 'yellow');
    }

    // Start Apache
    log('\n🔧 Starting Apache...', 'cyan');

    // Test Apache configuration before starting
    try {
      execCommand('apache2ctl configtest');
      log('Apache configuration test passed', 'green');
    } catch (error) {
      log('Apache configuration test failed, but continuing...', 'yellow');
    }

    // Show final configuration for debugging
    log('\n📋 Final Configuration:', 'bright');
    log(`   Instance: ${instance}`, 'cyan');
    log(`   Port: ${port}`, 'cyan');
    log(`   URL: ${baseUrl}`, 'cyan');
    log(`   Database: ${process.env.WORDPRESS_DB_NAME || 'wordpress'}`, 'cyan');
    log(`   Table Prefix: ${tablePrefix}`, 'cyan');

    execCommand('apache2-foreground');
  } catch (error) {
    log(`❌ Error during startup: ${error.message}`, 'red');
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
  createWpConfig,
  waitForDatabase,
  installWordPress,
  setPermissions,
  activatePlugin,
  setupDefaultTheme,
  configureApache,
  checkWordPressFiles,
};
