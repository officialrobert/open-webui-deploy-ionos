# WordPress + Custom REST API Plugin - Docker Setup

This project provides a complete Docker setup for running WordPress with a custom REST API plugin that includes TypeScript/Node.js-like functionality.

## 🏗️ Architecture

- **WordPress**: PHP 8.2 with Apache
- **Custom REST API Plugin**: TypeScript-based plugin with Node.js-like functionality
- **Database**: MySQL 8.0
- **Development Tools**: Hot reloading, TypeScript compilation, debugging
- **Production**: Optimized builds, performance tuning

## 📁 Project Structure

```
apps/wordpress/
├── Dockerfile                    # Production Dockerfile
├── Dockerfile.dev               # Development Dockerfile
├── docker-compose.yml           # Production docker-compose
├── docker-compose.dev.yml       # Development docker-compose
├── .dockerignore                # Docker ignore rules
├── scripts/
│   ├── dev.sh                   # Development startup script
│   ├── prod.sh                  # Production startup script
│   └── test-api.sh              # API testing script
├── wp-content/
│   └── plugins/
│       └── custom-rest-api/     # Custom REST API plugin
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Git (for cloning the repository)

### 1. Development Environment

```bash
# Navigate to the wordpress directory
cd apps/wordpress

# Make scripts executable
chmod +x scripts/*.sh

# Start development environment
./scripts/dev.sh
```

**Development Features:**
- ✅ Hot reloading for TypeScript changes
- ✅ WordPress debug mode enabled
- ✅ Source code mounted for live editing
- ✅ Development tools container
- ✅ phpMyAdmin for database management

### 2. Production Environment

```bash
# Navigate to the wordpress directory
cd apps/wordpress

# Start production environment
./scripts/prod.sh
```

**Production Features:**
- ✅ Optimized for performance
- ✅ Debug mode disabled
- ✅ Pre-compiled TypeScript
- ✅ Security hardened
- ✅ Production-ready configuration

## 🔧 Manual Docker Commands

### Development

```bash
# Build and start development environment
docker-compose -f docker-compose.dev.yml up --build

# Start in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f wordpress

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

### Production

```bash
# Build and start production environment
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f wordpress

# Stop production environment
docker-compose down
```

## 🧪 Testing the API

### Automated Testing

```bash
# Run the test script
./scripts/test-api.sh
```

### Manual Testing

```bash
# Health check
curl http://localhost/wp-json/custom-api/v1/health

# Get posts
curl http://localhost/wp-json/custom-api/v1/posts

# Get users
curl http://localhost/wp-json/custom-api/v1/users

# Get Node.js-like data
curl http://localhost/wp-json/custom-api/v1/node-data
```

## 🌐 Access Points

Once the environment is running, you can access:

- **WordPress Site**: http://localhost
- **WordPress Admin**: http://localhost/wp-admin
- **phpMyAdmin**: http://localhost:8080
- **Custom REST API**: http://localhost/wp-json/custom-api/v1/health

## 🔧 Development Workflow

### 1. Start Development Environment

```bash
./scripts/dev.sh
```

### 2. Edit Plugin Code

The plugin source is mounted for hot reloading:
- Edit `wp-content/plugins/custom-rest-api/src/api.ts`
- Changes are automatically compiled
- Refresh browser to see changes

### 3. Test Changes

```bash
# Test API endpoints
./scripts/test-api.sh

# Or manually test in browser
curl http://localhost/wp-json/custom-api/v1/health
```

### 4. Build for Production

```bash
# Navigate to plugin directory
cd wp-content/plugins/custom-rest-api

# Build TypeScript
npm run build
```

## 🐳 Docker Configuration Details

### Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Debug Mode | ✅ Enabled | ❌ Disabled |
| Hot Reloading | ✅ Enabled | ❌ Disabled |
| Source Mounts | ✅ Enabled | ❌ Disabled |
| TypeScript Watch | ✅ Enabled | ❌ Pre-compiled |
| Performance | Standard | Optimized |
| Security | Development | Hardened |

### Environment Variables

**Development:**
```yaml
WORDPRESS_DEBUG: 1
WP_DEBUG: true
WP_DEBUG_LOG: true
```

**Production:**
```yaml
WORDPRESS_DEBUG: 0
WP_DEBUG: false
WP_DEBUG_LOG: false
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

# Check service health
docker-compose exec wordpress curl -f http://localhost/wp-json/custom-api/v1/health

# Monitor logs
docker-compose logs -f
```

### Performance Monitoring

```bash
# Check container resource usage
docker stats

# Check WordPress performance
curl -w "@curl-format.txt" -o /dev/null -s http://localhost/wp-json/custom-api/v1/health
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

### Local Production Build

```bash
# Build production image
docker-compose build

# Start production environment
docker-compose up -d

# Verify deployment
./scripts/test-api.sh
```

### Production Deployment

1. **Build Production Image:**
   ```bash
   docker-compose build wordpress
   ```

2. **Tag for Registry:**
   ```bash
   docker tag wordpress:latest your-registry/wordpress:latest
   ```

3. **Push to Registry:**
   ```bash
   docker push your-registry/wordpress:latest
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
4. Test with `./scripts/test-api.sh`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

1. Check the troubleshooting section
2. Review Docker logs: `docker-compose logs`
3. Test API endpoints: `./scripts/test-api.sh`
4. Check WordPress debug logs

