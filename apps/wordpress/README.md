# WordPress + Custom REST API Plugin - Docker Setup

This project provides a complete Docker setup for running WordPress with a custom REST API plugin that includes TypeScript/Node.js-like functionality.

## 🏗️ Architecture

- **WordPress Applications**: 3 separate WordPress instances (App A, App B, App C) with custom REST API
- **Custom REST API Plugin**: TypeScript-based plugin with Node.js-like functionality
- **Database**: MySQL 8.0 (shared across all apps) with phpMyAdmin for management

## 📁 Project Structure

```
apps/wordpress/
├── Dockerfile                    # WordPress Dockerfile
├── docker-compose.yml           # Full stack (WordPress + MySQL + phpMyAdmin)
├── .dockerignore                # Docker ignore rules
├── scripts/
│   └── start.js                 # Unified startup script
├── wp-content/
│   └── plugins/
│       └── custom-rest-api/     # Custom REST API plugin
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js (for running the startup script)
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
- ✅ Automatic container management
- ✅ Health checks and API testing
- ✅ Load balancer ready (ports 3001, 3002, 3003)

### Start the Application

```bash
# Start the full stack (WordPress + MySQL + phpMyAdmin)
npm start
```



## 🔧 Manual Docker Commands

### Full Stack (Recommended)

```bash
# Build and start full stack environment
docker-compose up --build

# Start in background
docker-compose up -d

# View logs for specific apps
docker-compose logs -f app_a
docker-compose logs -f app_b
docker-compose logs -f app_c

# Stop environment
docker-compose down
```



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

### Preventing Redirect Issues

If you experience redirects between instances (e.g., accessing port 3002 redirects to 3001):

1. **Clear browser cache and cookies**
2. **Use incognito/private browsing mode**
3. **Check for browser extensions causing redirects**
4. **Verify each instance has correct site URL**:
   ```bash
   # Check site URLs in database
   docker-compose exec db mysql -u wordpress -pwordpress_password -e "SELECT option_name, option_value FROM wp_a_options WHERE option_name IN ('home', 'siteurl');" wordpress
   docker-compose exec db mysql -u wordpress -pwordpress_password -e "SELECT option_name, option_value FROM wp_b_options WHERE option_name IN ('home', 'siteurl');" wordpress
   docker-compose exec db mysql -u wordpress -pwordpress_password -e "SELECT option_name, option_value FROM wp_c_options WHERE option_name IN ('home', 'siteurl');" wordpress
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
- **MySQL Database**: localhost:3306





## 🔧 Development Workflow

### 1. Start the Application

```bash
npm start
```

### 2. Edit Plugin Code

The plugin source is available for editing:
- Edit `wp-content/plugins/custom-rest-api/src/api.ts`
- Rebuild the plugin if needed
- Refresh browser to see changes

### 3. Test Changes

```bash
# Test API endpoints for all apps
npm run test-api

# Or manually test in browser
curl http://localhost:3001/wp-json/custom-api/v1/health
curl http://localhost:3002/wp-json/custom-api/v1/health
curl http://localhost:3003/wp-json/custom-api/v1/health
```

### 4. Build Plugin

```bash
# Navigate to plugin directory
cd wp-content/plugins/custom-rest-api

# Build TypeScript
npm run build
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
   # Check what's using port 80
   sudo lsof -i :80
   
   # Or use different ports
   # Edit docker-compose.yml and change ports
   ```

2. **Database Connection Issues**
   ```bash
   # Check database logs
   docker-compose logs db
   
   # Restart database
   docker-compose restart db
   ```

3. **Plugin Not Working**
   ```bash
   # Check WordPress logs
   docker-compose logs wordpress
   
   # Check plugin build
   docker exec -it wordpress bash
   cd wp-content/plugins/custom-rest-api
   npm run build
   ```

4. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   chmod -R 755 .
   ```

5. **Table Prefix Issues**
   ```bash
   # Check if table prefixes are working
   docker-compose exec db mysql -u wordpress -pwordpress_password -e "SHOW TABLES;" wordpress
   
   # If tables are not separated, restart the containers
   docker-compose down
   docker-compose up -d
   
   # Check the wp-config.php in each container
   docker-compose exec app_a cat /var/www/html/wp-config.php | grep table_prefix
   docker-compose exec app_b cat /var/www/html/wp-config.php | grep table_prefix
   docker-compose exec app_c cat /var/www/html/wp-config.php | grep table_prefix
   ```

### Debug Mode

**Enable WordPress Debug:**
```php
// In wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

**View Debug Logs:**
```bash
# View WordPress debug logs
docker exec -it wordpress cat /var/www/html/wp-content/debug.log

# Or mount logs to host
# Add to docker-compose.yml volumes:
# - ./logs:/var/www/html/wp-content/logs
```

## 📊 Monitoring

### Health Checks

```bash
# Check all services
docker-compose ps

# Check service health for all apps
docker-compose exec app_a curl -f http://localhost/wp-json/custom-api/v1/health
docker-compose exec app_b curl -f http://localhost/wp-json/custom-api/v1/health
docker-compose exec app_c curl -f http://localhost/wp-json/custom-api/v1/health

# Monitor logs
docker-compose logs -f
```

### Performance Monitoring

```bash
# Check container resource usage
docker stats

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
# Build image
docker-compose build

# Start environment
docker-compose up -d

# Verify deployment
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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run test-api`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

1. Check the troubleshooting section
2. Review Docker logs: `docker-compose logs`
3. Test API endpoints: `npm run test-api`
4. Check WordPress debug logs

