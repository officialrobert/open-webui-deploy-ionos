# WordPress Weather API with Custom REST Endpoints

This project provides a complete Docker setup for running WordPress with a custom REST API plugin that provides weather data integration. Features asynchronous startup, comprehensive health monitoring, and cross-platform compatibility.

## 🏗️ Architecture

- **WordPress Applications**: 3 separate WordPress instances (App A, App B, App C) with custom weather REST API
- **Weather API Plugin**: TypeScript-based plugin with OpenWeatherMap integration
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
│       └── custom-rest-api/     # Weather REST API plugin
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
- ✅ 3 WordPress apps with weather REST API plugin
- ✅ OpenWeatherMap API integration for real-time weather data
- ✅ Shared MySQL 8.0 database with fresh installation on each start
- ✅ phpMyAdmin for database management
- ✅ Cross-platform compatibility (Windows, Linux, macOS)
- ✅ Asynchronous startup with non-blocking logging
- ✅ Comprehensive health monitoring
- ✅ Host-accessible log files
- ✅ Docker-based status checking (no PID files)
- ✅ Weather API testing and validation
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

# Build cache manually (optional - cache is built automatically on first run)
npm run build:cache

# Clean build cache
npm run build:cache:clean
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

## 🗄️ Database Structure

### MySQL Database Configuration

The setup uses a shared MySQL 8.0 database with separate table prefixes for each WordPress instance:

- **Database Name**: `wordpress`
- **Username**: `wordpress`
- **Password**: `wordpress_password`
- **Port**: `3307` (external), `3306` (internal)

### Table Prefixes

Each WordPress instance uses a unique table prefix to avoid conflicts:

- **App A**: `wp_a_` (port 3001)
- **App B**: `wp_b_` (port 3002)  
- **App C**: `wp_c_` (port 3003)

### WordPress Tables

Each instance creates the following standard WordPress tables:

**Core Tables:**
- `wp_{prefix}_posts` - Posts and pages
- `wp_{prefix}_users` - User accounts
- `wp_{prefix}_options` - WordPress settings
- `wp_{prefix}_comments` - Comments
- `wp_{prefix}_postmeta` - Post metadata
- `wp_{prefix}_terms` - Categories and tags
- `wp_{prefix}_term_taxonomy` - Taxonomy definitions
- `wp_{prefix}_term_relationships` - Post-term relationships

**Global Tables (shared):**
- `wp_users` - Global user accounts
- `wp_usermeta` - User metadata

### Database Access

```bash
# Access database via command line
docker-compose exec db mysql -u wordpress -pwordpress_password wordpress

# Check tables for specific app
docker-compose exec db mysql -u wordpress -pwordpress_password -e "SHOW TABLES LIKE 'wp_a_%';" wordpress

# Access phpMyAdmin
# URL: http://localhost:8081
# Username: wordpress
# Password: wordpress_password
```

## 🧪 Testing the Weather API

### Automated Testing

```bash
# Run the test script
npm run test-api
```

### Manual Weather API Testing

```bash
# Test weather API for different cities
curl "http://localhost:3001/index.php?rest_route=/custom-api/v1/weather&city=London"
curl "http://localhost:3001/index.php?rest_route=/custom-api/v1/weather&city=New York"
curl "http://localhost:3001/index.php?rest_route=/custom-api/v1/weather&city=Tokyo"

# Test health endpoints
curl "http://localhost:3001/index.php?rest_route=/custom-api/v1/health"
curl "http://localhost:3002/index.php?rest_route=/custom-api/v1/health"
curl "http://localhost:3003/index.php?rest_route=/custom-api/v1/health"

# Get OpenAPI specification
curl "http://localhost:3001/index.php?rest_route=/custom-api/v1/openapi.json"
```

## 🌐 Access Points

Once the environment is running, you can access:

### WordPress Applications
- **App A - WordPress**: http://localhost:3001
- **App A - Admin**: http://localhost:3001/wp-admin
- **App B - WordPress**: http://localhost:3002
- **App B - Admin**: http://localhost:3002/wp-admin
- **App C - WordPress**: http://localhost:3003
- **App C - Admin**: http://localhost:3003/wp-admin

### Weather API Endpoints
- **App A - Weather API**: http://localhost:3001/index.php?rest_route=/custom-api/v1/weather&city=London
- **App B - Weather API**: http://localhost:3002/index.php?rest_route=/custom-api/v1/weather&city=London
- **App C - Weather API**: http://localhost:3003/index.php?rest_route=/custom-api/v1/weather&city=London

### Health & Documentation
- **Health Check**: http://localhost:3001/index.php?rest_route=/custom-api/v1/health
- **OpenAPI Spec**: http://localhost:3001/index.php?rest_route=/custom-api/v1/openapi.json

### Database Management
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

### 3. Test Weather API

```bash
# Test weather endpoints
curl "http://localhost:3001/index.php?rest_route=/custom-api/v1/weather&city=London"
curl "http://localhost:3001/index.php?rest_route=/custom-api/v1/health"

# Run automated tests
npm run test-api
```

### 4. Plugin Development

The weather API plugin source is available for editing:
- Edit `wp-content/plugins/custom-rest-api/src/api.ts`
- Rebuild the plugin if needed: `npm run build:plugin`
- Refresh browser to see changes

## 🔧 API Configuration

### Environment Variables

The weather API requires the following environment variables:

```yaml
# OpenWeatherMap API Key (required)
OPEN_WEATHER_MAP_KEY: "your_api_key_here"

# Optional API Keys
NEWSAPI_KEY: ""
DUCKDUCKGO_ENABLED: "true"
```

### API Key Setup

1. Get your free API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Set the `OPEN_WEATHER_MAP_KEY` environment variable in `docker-compose.yml`
3. Restart the containers: `npm run reset`

## 🔧 Troubleshooting

### Common Issues

1. **Weather API Not Working**
   ```bash
   # Check if API key is set
   docker-compose exec app_a env | grep OPEN_WEATHER_MAP_KEY
   
   # Check plugin logs
   npm run logs:app_a
   ```

2. **Database Connection Issues**
   ```bash
   # Check database logs
   npm run logs:db
   
   # Check health status
   npm run health
   ```

3. **Port Conflicts**
   ```bash
   # Check what's using the ports
   netstat -an | findstr :3001  # Windows
   netstat -tuln | grep :3001   # Linux/macOS
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

# Check weather API health
curl "http://localhost:3001/index.php?rest_route=/custom-api/v1/health"

# Monitor logs
npm run start:logs
```

### Performance Monitoring

```bash
# Check container resource usage
npm run health

# Test weather API performance
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3001/index.php?rest_route=/custom-api/v1/weather&city=London"
```

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
4. Test weather API: `curl "http://localhost:3001/index.php?rest_route=/custom-api/v1/weather&city=London"`
5. Check WordPress debug logs in `./logs/` directory

