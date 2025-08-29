# Custom REST API Plugin for WordPress

A custom REST API plugin for WordPress that provides Node.js-like functionality and ensures all endpoints return proper JSON responses.

## Features

- ✅ **Guaranteed JSON Responses**: All endpoints return proper JSON with correct content-type headers
- ✅ **Error Handling**: Comprehensive error handling with JSON error responses
- ✅ **CORS Support**: Built-in CORS headers for cross-origin requests
- ✅ **TypeScript Support**: Written in TypeScript with Node.js-like utilities
- ✅ **WordPress Integration**: Seamless integration with WordPress REST API
- ✅ **Bridge Middleware**: Acts as a bridge between WordPress and Node.js-style API handlers

## Installation

1. Upload the plugin to your WordPress plugins directory
2. Activate the plugin in WordPress admin
3. The API endpoints will be available using the direct REST API format

## API Endpoints

### Base URL Format
Since this plugin is designed to work reliably across different server configurations, use the direct REST API format:

```
http://your-site.com/index.php?rest_route=/custom-api/v1/
```

### Available Endpoints

#### Health Check
```
GET /index.php?rest_route=/custom-api/v1/health
```
Returns the health status of the API.

#### Test Endpoint
```
GET /index.php?rest_route=/custom-api/v1/test
```
Basic test endpoint to verify the API is working.

#### Posts
```
GET /index.php?rest_route=/custom-api/v1/posts
GET /index.php?rest_route=/custom-api/v1/posts?per_page=10&page=1&category=news&search=wordpress
```
Returns WordPress posts with pagination and filtering options.

#### Users
```
GET /index.php?rest_route=/custom-api/v1/users
GET /index.php?rest_route=/custom-api/v1/users?per_page=10&page=1&role=administrator&search=admin
```
Returns WordPress users with pagination and filtering options.

#### Node Data
```
GET /index.php?rest_route=/custom-api/v1/node-data
```
Returns Node.js-like data including server information and WordPress details.

#### Categories
```
GET /index.php?rest_route=/custom-api/v1/categories
```
Returns all WordPress categories.

#### Single Post
```
GET /index.php?rest_route=/custom-api/v1/post/{id}
```
Returns a single post by ID.

#### Stats
```
GET /index.php?rest_route=/custom-api/v1/stats
```
Returns WordPress site statistics.

#### Search
```
GET /index.php?rest_route=/custom-api/v1/search?q=search_term&type=post&per_page=10&page=1
```
Search WordPress content.

## Response Format

All endpoints return responses in this consistent format:

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "endpoint": "/custom-api/v1/endpoint",
    "method": "GET",
    "timestamp": "2024-01-01T00:00:00+00:00"
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00+00:00"
}
```

## Testing

### Using PowerShell (Windows)
```powershell
# Test health endpoint
Invoke-RestMethod -Uri "http://localhost:3001/index.php?rest_route=/custom-api/v1/health" -Method GET

# Test posts endpoint
Invoke-RestMethod -Uri "http://localhost:3001/index.php?rest_route=/custom-api/v1/posts" -Method GET

# Test with parameters
Invoke-RestMethod -Uri "http://localhost:3001/index.php?rest_route=/custom-api/v1/posts?per_page=3" -Method GET
```

### Using curl
```bash
# Test health endpoint
curl "http://your-site.com/index.php?rest_route=/custom-api/v1/health"

# Test posts endpoint
curl "http://your-site.com/index.php?rest_route=/custom-api/v1/posts"

# Test with parameters
curl "http://your-site.com/index.php?rest_route=/custom-api/v1/posts?per_page=3"
```

### Using JavaScript/Fetch
```javascript
// Test health endpoint
fetch('http://your-site.com/index.php?rest_route=/custom-api/v1/health')
  .then(response => response.json())
  .then(data => console.log(data));

// Test posts endpoint
fetch('http://your-site.com/index.php?rest_route=/custom-api/v1/posts')
  .then(response => response.json())
  .then(data => console.log(data));
```

## Integration with Node.js Applications

This plugin is designed to act as a bridge middleware between WordPress and Node.js-style API handlers. The plugin ensures:

1. **Consistent JSON Responses**: All endpoints return proper JSON with correct content-type headers
2. **Error Handling**: Comprehensive error handling that returns JSON error responses
3. **CORS Support**: Built-in CORS headers for cross-origin requests
4. **WordPress Integration**: Seamless access to WordPress data and functionality

### Example Node.js Integration
```javascript
const axios = require('axios');

class WordPressAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async getHealth() {
    const response = await axios.get(`${this.baseUrl}/index.php?rest_route=/custom-api/v1/health`);
    return response.data;
  }

  async getPosts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}/index.php?rest_route=/custom-api/v1/posts${queryString ? '&' + queryString : ''}`;
    const response = await axios.get(url);
    return response.data;
  }

  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}/index.php?rest_route=/custom-api/v1/users${queryString ? '&' + queryString : ''}`;
    const response = await axios.get(url);
    return response.data;
  }
}

// Usage
const wpAPI = new WordPressAPI('http://your-site.com');
const health = await wpAPI.getHealth();
const posts = await wpAPI.getPosts({ per_page: 5 });
```

## Development

### Building TypeScript

The plugin includes TypeScript source files. To build:

```bash
cd wp-content/plugins/custom-rest-api
npm install
npm run build
```

### Adding New Endpoints

1. Add the endpoint method to the `CustomRestAPI` class
2. Register the route in the `register_rest_routes` method
3. Use the `create_json_response` helper method for consistent responses

Example:
```php
public function my_new_endpoint($request) {
    try {
        $data = array(
            'message' => 'Hello from new endpoint',
            'timestamp' => current_time('c')
        );
        
        return $this->create_json_response($data, 200);
    } catch (Exception $e) {
        $error_response = array(
            'success' => false,
            'error' => $e->getMessage(),
            'timestamp' => current_time('c')
        );
        return $this->create_json_response($error_response, 500);
    }
}
```

## Troubleshooting

### Issue: Getting HTML instead of JSON

If you're getting HTML responses, ensure you're using the correct URL format:

**✅ Correct format:**
```
http://your-site.com/index.php?rest_route=/custom-api/v1/health
```

**❌ May not work:**
```
http://your-site.com/index.php?rest_route=/custom-api/v1/health
```

### Common Solutions

1. **Use Direct REST API Format**: Always use `index.php?rest_route=` format for reliable results
2. **Check Plugin Activation**: Ensure the plugin is activated in WordPress admin
3. **Clear Cache**: Clear any caching plugins or server cache
4. **Check Error Logs**: Check WordPress and server error logs

### Debug Steps

1. Enable WordPress debug mode in `wp-config.php`:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

2. Test the basic WordPress REST API:
```bash
curl "http://your-site.com/index.php?rest_route=/"
```

3. Test your custom endpoint:
```bash
curl "http://your-site.com/index.php?rest_route=/custom-api/v1/health"
```

## Security

- All endpoints use WordPress nonces for authentication
- CORS headers are properly configured
- Error messages don't expose sensitive information
- Input validation and sanitization are implemented

## Support

If you encounter issues:

1. Verify you're using the correct URL format (`index.php?rest_route=`)
2. Check that the plugin is activated
3. Test with the basic WordPress REST API first
4. Check WordPress error logs
5. Ensure all requirements are met

## Requirements

- WordPress 5.0 or higher
- PHP 7.4 or higher
- REST API enabled (default in WordPress)

## License

MIT License - see LICENSE file for details.
