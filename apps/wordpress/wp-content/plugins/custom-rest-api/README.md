# Custom REST API WordPress Plugin

A WordPress plugin that provides a custom REST API with TypeScript/Node.js-like functionality integrated directly into WordPress.

## 🏗️ Features

- **WordPress REST API Integration**: Custom endpoints using WordPress REST API framework
- **TypeScript Support**: Full TypeScript compilation and development workflow
- **Node.js-like Functionality**: Utilities and patterns similar to Node.js development
- **AJAX Support**: Client-side AJAX functionality for dynamic interactions
- **Admin Dashboard**: WordPress admin panel integration with status monitoring
- **Responsive Design**: Modern, responsive UI components

## 📁 Plugin Structure

```
custom-rest-api/
├── custom-rest-api.php      # Main plugin file
├── package.json             # Node.js dependencies
├── tsconfig.json           # TypeScript configuration
├── src/
│   └── api.ts              # TypeScript API implementation
├── assets/
│   ├── css/
│   │   └── style.css       # Plugin styles
│   └── js/
│       ├── frontend.js     # Frontend JavaScript
│       └── admin.js        # Admin panel JavaScript
├── dist/                   # Compiled JavaScript (auto-generated)
└── README.md              # This file
```

## 🚀 Installation

### 1. Install the Plugin

1. Copy the `custom-rest-api` folder to your WordPress `wp-content/plugins/` directory
2. Activate the plugin in WordPress admin panel
3. The plugin will automatically register REST API endpoints

### 2. Build TypeScript (Development)

```bash
# Navigate to plugin directory
cd wp-content/plugins/custom-rest-api

# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch for changes (development)
npm run watch
```

## 🔧 API Endpoints

The plugin provides the following REST API endpoints:

### Base URL
```
/wp-json/custom-api/v1/
```

### Available Endpoints

- `GET /health` - Health check and status information
- `GET /posts` - Get WordPress posts
- `GET /users` - Get WordPress users
- `GET /node-data` - Node.js-like data simulation

### Example Usage

```javascript
// Health check
fetch('/wp-json/custom-api/v1/health')
  .then(response => response.json())
  .then(data => console.log(data));

// Get posts
fetch('/wp-json/custom-api/v1/posts')
  .then(response => response.json())
  .then(posts => console.log(posts));
```

## 🎨 Frontend Integration

### Using the Plugin's JavaScript

The plugin automatically loads frontend JavaScript that provides:

- API connection testing
- Form handling
- Data display utilities
- Notification system

### Example HTML

```html
<!-- Test API Connection -->
<button class="custom-api-test">Test API Connection</button>
<div class="api-status">Checking...</div>

<!-- Display Posts -->
<div class="posts-container"></div>

<!-- Display Users -->
<div class="users-container"></div>

<!-- Custom Form -->
<form class="custom-api-form">
    <div class="form-group">
        <label for="name">Name:</label>
        <input type="text" id="name" name="name" required>
    </div>
    <button type="submit">Submit</button>
</form>
```

## 🔧 Development

### Adding New Endpoints

1. Edit `custom-rest-api.php`
2. Add new route in `register_rest_routes()` method:

```php
register_rest_route('custom-api/v1', '/new-endpoint', array(
    'methods' => 'GET',
    'callback' => array($this, 'new_endpoint_handler'),
    'permission_callback' => '__return_true'
));
```

3. Add the handler method:

```php
public function new_endpoint_handler($request) {
    return array(
        'message' => 'New endpoint response',
        'timestamp' => current_time('c')
    );
}
```

### TypeScript Development

1. Edit `src/api.ts`
2. Add new functionality using Node.js-like patterns
3. Build with `npm run build`
4. The compiled JavaScript will be automatically loaded by WordPress

### Adding New Dependencies

1. Edit `package.json`
2. Add new dependencies
3. Run `npm install`
4. Import and use in `src/api.ts`

## 🎛️ Admin Panel

The plugin provides admin panel functionality:

- **Dashboard Widget**: Shows API status and quick actions
- **Settings Page**: Configure plugin options
- **Status Monitoring**: Real-time API health monitoring
- **Cache Management**: Clear API cache

### Admin Features

- Test API connections
- View API statistics
- Export API data
- Monitor system status

## 🔒 Security

- **Nonce Verification**: All AJAX requests use WordPress nonces
- **Permission Callbacks**: REST API endpoints include permission checks
- **Input Sanitization**: All user inputs are properly sanitized
- **Output Escaping**: All outputs are properly escaped

## 🎨 Styling

The plugin includes comprehensive CSS styling:

- **Status Indicators**: Visual API status indicators
- **Notifications**: Toast-style notifications
- **Forms**: Styled form elements
- **Responsive Design**: Mobile-friendly layouts
- **Admin Integration**: WordPress admin panel styling

## 🐛 Troubleshooting

### Common Issues

1. **Plugin Not Activating**
   - Check PHP version (requires PHP 7.4+)
   - Verify file permissions
   - Check for syntax errors in plugin files

2. **REST API Not Working**
   - Ensure WordPress REST API is enabled
   - Check permalink settings
   - Verify .htaccess configuration

3. **TypeScript Build Errors**
   - Run `npm install` to install dependencies
   - Check TypeScript configuration
   - Verify Node.js version (requires 14+)

4. **AJAX Not Working**
   - Check browser console for JavaScript errors
   - Verify nonce is being generated correctly
   - Check WordPress AJAX URL configuration

### Debug Mode

Enable WordPress debug mode to see detailed error messages:

```php
// In wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

## 📚 API Reference

### REST API Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "timestamp": "2023-12-01T10:00:00Z"
}
```

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

### AJAX Response Format

```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This plugin is licensed under the MIT License.

## 🆘 Support

For support and questions:

1. Check the troubleshooting section
2. Review WordPress error logs
3. Test with default WordPress theme
4. Disable other plugins to check for conflicts

## 🔄 Updates

To update the plugin:

1. Backup your current installation
2. Replace plugin files with new version
3. Run `npm install` if dependencies changed
4. Run `npm run build` to rebuild TypeScript
5. Test functionality
