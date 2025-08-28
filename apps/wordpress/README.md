# WordPress Asynchronous Startup with Enhanced Observability

This project provides a complete Docker setup for running WordPress with a custom REST API plugin, featuring asynchronous startup, comprehensive health monitoring, and cross-platform compatibility.

## 🏗️ Architecture

- **WordPress Applications**: 3 separate WordPress instances (App A, App B, App C) with custom REST API
- **Custom REST API Plugin**: TypeScript-based plugin with Node.js-like functionality
- **Database**: MySQL 8.0 (shared across all apps) with phpMyAdmin for management
- **Asynchronous Startup**: Non-blocking container startup with real-time logging
- **Health Monitoring**: Comprehensive resource and status monitoring

## 📁 Project Structure

```
apps/wordpress/
├── Dockerfile                    # WordPress Dockerfile
├── docker-compose.yml           # Full stack (WordPress + MySQL + phpMyAdmin)
├── .dockerignore                # Docker ignore rules
├── scripts/
│   ├── start.js                 # Asynchronous startup script
│   ├── stop.js                  # Docker-based stop script
│   └── health.js                # Health monitoring script
├── wp-content/
│   └── plugins/
│       └── custom-rest-api/     # Custom REST API plugin
├── logs/                        # Host-mounted log directories
│   ├── app_a/                   # App A logs (startup, error, system, apache)
│   ├── app_b/                   # App B logs
│   └── app_c/                   # App C logs
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js (for running the management scripts)
- Git (for cloning the repository)

### Start the Application

```bash
# Navigate to the wordpress directory
cd apps/wordpress

# Start the full stack (WordPress + MySQL + phpMyAdmin)
npm start
```

**Features:**
- ✅ 3 WordPress apps with custom REST API plugin
- ✅ Shared MySQL 8.0 database with fresh installation on each start
- ✅ phpMyAdmin for database management
- ✅ Cross-platform compatibility (Windows, Linux, macOS)
- ✅ Asynchronous startup with non-blocking logging
- ✅ Comprehensive health monitoring
- ✅ Host-accessible log files
- ✅ Docker-based status checking (no PID files)
- ✅ Health checks and API testing
- ✅ Load balancer ready (ports 3001, 3002, 3003)

## 🛠️ Management Commands

### Core Commands

```bash
# Start all applications (asynchronous)
npm start

# Stop all applications (Docker-based)
npm run stop

# Health monitoring (CPU, memory, status)
npm run health

# Full reset (clean + start)
npm run reset
```

### Logging & Monitoring

```bash
# View all container logs
npm run start:logs

# View individual app logs
npm run logs:app_a
npm run logs:app_b
npm run logs:app_c
npm run logs:db

# Clean restart (remove volumes)
npm run start:clean
```

### Development & Access

```bash
# Access container shells
npm run shell:app_a
npm run shell:app_b
npm run shell:app_c

# Access database shell
npm run db:shell

# Test REST API endpoints
npm run test-api
```

### Plugin Development

```bash
# Build the custom plugin
npm run build:plugin

# Watch plugin for changes
npm run watch:plugin

# Install plugin dependencies
npm run install:plugin
```

### System Maintenance

```bash
# Clean Docker system and volumes
npm run clean:all
```

## 🏥 Health Monitoring

The health script provides comprehensive monitoring of your WordPress applications:

```bash
npm run health
```

**What it monitors:**
- ✅ Container status and health
- ✅ CPU and memory usage
- ✅ Network and disk I/O
- ✅ Port accessibility
- ✅ System resource overview
- ✅ Individual container responsiveness

**Status Indicators:**
- 🟢 - Healthy/Running
- 🟡 - Running but needs attention
- 🔴 - Stopped/Error
- ⚪ - Not found

## 📊 Logging System

### Host-Accessible Logs

Logs are automatically created and accessible from the host system:

```
./logs/
├── app_a/
│   ├── startup.log      # Startup process logs
│   ├── error.log        # Error logs
│   ├── system.log       # System information
│   └── apache.log       # Apache web server logs
├── app_b/
│   └── ... (same structure)
└── app_c/
    └── ... (same structure)
```

### Log Features

- **Structured Logging**: Different log types with timestamps
- **Color Coding**: Easy-to-read colored output
- **Real-time Access**: Logs are immediately available on host
- **Cross-Platform**: Works on Windows, Linux, and macOS

## 🧪 Testing the API

### Automated Testing

```bash
# Run the test script
npm run test-api
```

### Testing Table Prefix Configuration

Each WordPress instance uses a unique table prefix to avoid conflicts in the shared database:

- **App A**: `wp_a_` (port 3001)
- **App B**: `wp_b_` (port 3002)  
- **App C**: `wp_c_` (port 3003)

**Note**: The application performs a fresh installation on each start, dropping and recreating all tables for each instance. This ensures a clean slate every time you start the application.

To verify the table prefixes are working correctly:

```bash
# Check database tables after startup
docker-compose exec db mysql -u wordpress -pwordpress_password -e "SHOW TABLES;" wordpress

# You should see tables like:
# wp_a_posts, wp_a_users, wp_a_options (for App A)
# wp_b_posts, wp_b_users, wp_b_options (for App B)
# wp_c_posts, wp_c_users, wp_c_options (for App C)
```

### Manual Testing

```bash
# Health check for all apps
curl http://localhost:3001/wp-json/custom-api/v1/health
curl http://localhost:3002/wp-json/custom-api/v1/health
curl http://localhost:3003/wp-json/custom-api/v1/health

# Get posts from all apps
curl http://localhost:3001/wp-json/custom-api/v1/posts
curl http://localhost:3002/wp-json/custom-api/v1/posts
curl http://localhost:3003/wp-json/custom-api/v1/posts

# Get users from all apps
curl http://localhost:3001/wp-json/custom-api/v1/users
curl http://localhost:3002/wp-json/custom-api/v1/users
curl http://localhost:3003/wp-json/custom-api/v1/users

# Get Node.js-like data from all apps
curl http://localhost:3001/wp-json/custom-api/v1/node-data
curl http://localhost:3002/wp-json/custom-api/v1/node-data
curl http://localhost:3003/wp-json/custom-api/v1/node-data
```

## 🌐 Access Points

Once the environment is running, you can access:

### Full Stack Environment
- **App A - WordPress**: http://localhost:3001
- **App A - Admin**: http://localhost:3001/wp-admin
- **App A - REST API**: http://localhost:3001/wp-json/custom-api/v1/health
- **App B - WordPress**: http://localhost:3002
- **App B - Admin**: http://localhost:3002/wp-admin
- **App B - REST API**: http://localhost:3002/wp-json/custom-api/v1/health
- **App C - WordPress**: http://localhost:3003
- **App C - Admin**: http://localhost:3003/wp-admin
- **App C - REST API**: http://localhost:3003/wp-json/custom-api/v1/health
- **phpMyAdmin**: http://localhost:8081
- **MySQL Database**: localhost:3307

## 🔧 Development Workflow

### 1. Start the Application

```bash
npm start
```

### 2. Monitor Health

```bash
# Check application health
npm run health

# View logs
npm run logs:app_a
```

### 3. Edit Plugin Code

The plugin source is available for editing:
- Edit `wp-content/plugins/custom-rest-api/src/api.ts`
- Rebuild the plugin if needed: `npm run build:plugin`
- Refresh browser to see changes

### 4. Test Changes

```bash
# Test API endpoints for all apps
npm run test-api

# Or manually test in browser
curl http://localhost:3001/wp-json/custom-api/v1/health
curl http://localhost:3002/wp-json/custom-api/v1/health
curl http://localhost:3003/wp-json/custom-api/v1/health
```

## 🐳 Docker Configuration Details

### Environment Variables

```yaml
# WordPress Configuration (for each app)
WORDPRESS_DB_HOST: db:3306
WORDPRESS_DB_NAME: wordpress
WORDPRESS_DB_USER: wordpress
WORDPRESS_DB_PASSWORD: wordpress_password
WORDPRESS_URL: http://localhost:3001 (App A), 3002 (App B), 3003 (App C)
WORDPRESS_TITLE: "WordPress App X - Custom REST API"
WORDPRESS_ADMIN_USER: admin
WORDPRESS_ADMIN_PASSWORD: admin
WORDPRESS_ADMIN_EMAIL: admin@example.com
WORDPRESS_DEBUG: 1
WORDPRESS_TABLE_PREFIX: wp_a_ (App A), wp_b_ (App B), wp_c_ (App C)

# MySQL Configuration
MYSQL_ROOT_PASSWORD: rootpassword
MYSQL_DATABASE: wordpress
MYSQL_USER: wordpress
MYSQL_PASSWORD: wordpress_password

# phpMyAdmin Configuration
PMA_HOST: db
PMA_PORT: 3306
PMA_USER: wordpress
PMA_PASSWORD: wordpress_password
```

## 🔍 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using the ports
   netstat -an | findstr :3001  # Windows
   netstat -tuln | grep :3001   # Linux/macOS
   
   # Or use different ports in docker-compose.yml
   ```

2. **Database Connection Issues**
   ```bash
   # Check database logs
   npm run logs:db
   
   # Check health status
   npm run health
   ```

3. **Plugin Not Working**
   ```bash
   # Check WordPress logs
   npm run logs:app_a
   
   # Rebuild plugin
   npm run build:plugin
   ```

4. **Container Not Starting**
   ```bash
   # Check health status
   npm run health
   
   # View startup logs
   npm run logs:app_a
   ```

5. **Table Prefix Issues**
   ```bash
   # Check if table prefixes are working
   docker-compose exec db mysql -u wordpress -pwordpress_password -e "SHOW TABLES;" wordpress
   
   # If tables are not separated, restart the containers
   npm run reset
   ```

### Debug Mode

**Enable WordPress Debug:**
```php
// In wp-config.php (already enabled by default)
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

**View Debug Logs:**
```bash
# View WordPress debug logs
npm run logs:app_a

# Or check host-mounted logs
cat ./logs/app_a/error.log
```

## 📊 Monitoring

### Health Checks

```bash
# Comprehensive health check
npm run health

# Check service health for all apps
docker-compose exec app_a curl -f http://localhost/wp-json/custom-api/v1/health
docker-compose exec app_b curl -f http://localhost/wp-json/custom-api/v1/health
docker-compose exec app_c curl -f http://localhost/wp-json/custom-api/v1/health

# Monitor logs
npm run start:logs
```

### Performance Monitoring

```bash
# Check container resource usage
npm run health

# Check WordPress performance for all apps
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/wp-json/custom-api/v1/health
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3002/wp-json/custom-api/v1/health
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3003/wp-json/custom-api/v1/health
```

## 🔒 Security

### Production Security

- Debug mode disabled
- Error display disabled
- Secure file permissions
- Database credentials in environment variables
- HTTPS ready (add SSL certificates)

### Development Security

- Debug mode enabled for troubleshooting
- Source code accessible for development
- Database exposed for management

## 🚀 Deployment

### Local Build

```bash
# Start environment
npm start

# Verify deployment
npm run health
npm run test-api
```

### Production Deployment

1. **Build Images:**
   ```bash
   docker-compose build app_a app_b app_c
   ```

2. **Tag for Registry:**
   ```bash
   docker tag wordpress-app-a:latest your-registry/wordpress-app-a:latest
   docker tag wordpress-app-b:latest your-registry/wordpress-app-b:latest
   docker tag wordpress-app-c:latest your-registry/wordpress-app-c:latest
   ```

3. **Push to Registry:**
   ```bash
   docker push your-registry/wordpress-app-a:latest
   docker push your-registry/wordpress-app-b:latest
   docker push your-registry/wordpress-app-c:latest
   ```

4. **Deploy:**
   ```bash
   # On production server
   docker-compose pull
   docker-compose up -d
   ```

## 📚 API Documentation

### Available Endpoints

- `GET /wp-json/custom-api/v1/health` - Health check
- `GET /wp-json/custom-api/v1/posts` - Get WordPress posts
- `GET /wp-json/custom-api/v1/users` - Get WordPress users
- `GET /wp-json/custom-api/v1/node-data` - Node.js-like data

### Response Format

```json
{
  "status": "OK",
  "timestamp": "2023-12-01T10:00:00+00:00",
  "service": "WordPress Custom REST API",
  "version": "1.0.0"
}
```

## 🌍 Cross-Platform Compatibility

This project is designed to work seamlessly across different operating systems:

### Windows
- Uses PowerShell for command execution
- Windows-compatible port checking
- Proper path handling

### Linux/macOS
- Uses Bash for command execution
- Unix-compatible port checking
- Standard path handling

### Docker Commands
- Universal Docker interface
- Cross-platform container management
- Consistent behavior across platforms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run health` and `npm run test-api`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

1. Check the troubleshooting section
2. Run health check: `npm run health`
3. Review logs: `npm run logs:app_a`
4. Test API endpoints: `npm run test-api`
5. Check WordPress debug logs in `./logs/` directory

