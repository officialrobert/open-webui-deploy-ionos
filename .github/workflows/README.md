# GitHub Actions - IONOS Container Registry Deployment

This workflow automatically builds and deploys your WordPress applications to IONOS Container Registry.

## 🚀 How It Works

### 1. **Authentication Flow**
- Uses your IONOS secure token to generate an access token
- Checks for existing container registry to avoid duplicates
- Creates a new registry if it doesn't exist
- Creates a container registry token for Docker authentication

### 2. **Build Process**
- Builds 3 separate WordPress images (app_a, app_b, app_c)
- Uses Docker layer caching for optimal performance
- Each app gets unique configuration via build arguments

### 3. **Deployment**
- Pushes images to IONOS Container Registry
- Tags images with both commit SHA and `latest`
- Enables vulnerability scanning

## 📋 Prerequisites

### GitHub Secrets
Add these secrets to your GitHub repository:

1. **IONOS_SECURE_TOKEN**: Your IONOS secure token
   - Go to IONOS DCD → API → Tokens
   - Create a new token with appropriate permissions
   - Add to GitHub: Settings → Secrets and variables → Actions

### IONOS Container Registry Permissions
Ensure your IONOS account has:
- Container Registry service enabled
- Appropriate permissions for registry creation and management

## 🔧 Configuration

### Environment Variables
The workflow uses these environment variables (can be customized):

```yaml
REGISTRY_NAME: wordpress-apps          # Registry name
REGISTRY_LOCATION: de/txl             # IONOS location
IMAGE_PREFIX: wordpress-app           # Image name prefix
```

### Build Arguments
Each WordPress app is built with unique arguments:

- **app_a**: Port 3001, table prefix `wp_a_`
- **app_b**: Port 3002, table prefix `wp_b_`  
- **app_c**: Port 3003, table prefix `wp_c_`

## 🎯 Trigger Conditions

The workflow runs on:
- Push to `main` or `master` branch
- Changes in `apps/wordpress/**` directory
- Manual trigger via GitHub Actions UI

## 📦 Generated Images

After deployment, you'll have these images in your registry:

```
your-registry.cr.ionos.com/wordpress-app-a:latest
your-registry.cr.ionos.com/wordpress-app-a:{commit-sha}
your-registry.cr.ionos.com/wordpress-app-b:latest
your-registry.cr.ionos.com/wordpress-app-b:{commit-sha}
your-registry.cr.ionos.com/wordpress-app-c:latest
your-registry.cr.ionos.com/wordpress-app-c:{commit-sha}
```

## 🔍 Monitoring

### GitHub Actions Summary
The workflow provides a summary with:
- Registry hostname
- Deployed image names
- Commit SHA tags

### IONOS Console
Monitor your registry in IONOS DCD:
- Container Registry → Your Registry
- View repositories and artifacts
- Check vulnerability scans

## 🛠️ Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify `IONOS_SECURE_TOKEN` secret is correct
   - Check token permissions in IONOS DCD
   - Ensure token has Container Registry permissions

2. **Registry Creation Failed**
   - Ensure Container Registry service is enabled in your IONOS account
   - Verify location is available (`de/txl`)
   - Check if registry name already exists

3. **Token Creation Failed**
   - Verify registry ID is valid
   - Check token name uniqueness (now includes timestamp)
   - Ensure proper scopes are defined

4. **Build Failed**
   - Check Dockerfile syntax
   - Verify all required files are present
   - Check build arguments

5. **Push Failed**
   - Check registry token permissions
   - Verify network connectivity
   - Ensure Docker login was successful

### Debug Steps

1. **Check GitHub Actions Logs**
   - Look for detailed error messages with HTTP codes
   - Check API response bodies for error details
   - Verify each step completion status

2. **Verify IONOS API Responses**
   - Access token generation: Should return HTTP 200
   - Registry creation: Should return HTTP 202 or 200
   - Token creation: Should return HTTP 202 or 200

3. **Test Authentication Manually**
   ```bash
   # Test secure token
   curl -X POST \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_SECURE_TOKEN" \
     -d '{"grant_type": "client_credentials"}' \
     "https://api.ionos.com/auth/v1/tokens"
   ```

4. **Check IONOS DCD**
   - Verify Container Registry service is active
   - Check existing registries and tokens
   - Review API token permissions

### Error Codes and Solutions

| HTTP Code | Meaning | Solution |
|-----------|---------|----------|
| 401 | Unauthorized | Check IONOS_SECURE_TOKEN secret |
| 403 | Forbidden | Verify token permissions |
| 404 | Not Found | Check API endpoint URLs |
| 409 | Conflict | Registry name already exists |
| 422 | Validation Error | Check request payload format |

### Recent Fixes Applied

1. **Fixed API Endpoint Order**: Now creates registry first, then tokens
2. **Added Error Handling**: Comprehensive error checking with HTTP codes
3. **Improved Registry Detection**: Checks for existing registries before creating
4. **Unique Token Names**: Includes timestamp to avoid conflicts
5. **Better Debugging**: Enhanced logging with success/failure indicators

## 🔒 Security Features

- **Vulnerability Scanning**: Enabled by default
- **Token Expiry**: Registry tokens expire after 1 year
- **Scoped Permissions**: Minimal required permissions
- **Secure Authentication**: Uses IONOS secure tokens
- **Unique Token Names**: Prevents token conflicts

## 📈 Performance Optimization

- **Docker Layer Caching**: Optimized Dockerfile for caching
- **Parallel Builds**: Each app builds independently
- **Efficient Pushes**: Only pushes changed layers
- **Cleanup**: Automatic cleanup of local images
- **Registry Reuse**: Checks for existing registries

## 🔄 Manual Deployment

To manually trigger deployment:

1. Go to GitHub repository → Actions
2. Select "Deploy WordPress Apps to IONOS Container Registry"
3. Click "Run workflow"
4. Select branch and click "Run workflow"

## 📞 Support

For issues with:
- **GitHub Actions**: Check workflow logs and this documentation
- **IONOS API**: Contact IONOS support or check their API documentation
- **Container Registry**: Check IONOS DCD documentation

### Useful Links
- [IONOS API Documentation](https://api.ionos.com/docs)
- [IONOS Container Registry](https://dcd.ionos.com/container-registry)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
