# GitHub Actions - IONOS Container Registry Deployment

This workflow automatically builds and deploys your WordPress applications to IONOS Container Registry.

## 🚀 How It Works

### 1. **Authentication Flow**
- Uses your IONOS secure token to generate an access token
- Creates a container registry token for Docker authentication
- Creates/updates the container registry

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

2. **Registry Creation Failed**
   - Ensure Container Registry service is enabled
   - Verify location is available (`de/txl`)

3. **Build Failed**
   - Check Dockerfile syntax
   - Verify all required files are present

4. **Push Failed**
   - Check registry token permissions
   - Verify network connectivity

### Debug Steps

1. Check GitHub Actions logs for detailed error messages
2. Verify IONOS API responses in the logs
3. Test authentication manually using curl
4. Check IONOS DCD for registry status

## 🔒 Security Features

- **Vulnerability Scanning**: Enabled by default
- **Token Expiry**: Registry tokens expire after 1 year
- **Scoped Permissions**: Minimal required permissions
- **Secure Authentication**: Uses IONOS secure tokens

## 📈 Performance Optimization

- **Docker Layer Caching**: Optimized Dockerfile for caching
- **Parallel Builds**: Each app builds independently
- **Efficient Pushes**: Only pushes changed layers
- **Cleanup**: Automatic cleanup of local images

## 🔄 Manual Deployment

To manually trigger deployment:

1. Go to GitHub repository → Actions
2. Select "Deploy WordPress Apps to IONOS Container Registry"
3. Click "Run workflow"
4. Select branch and click "Run workflow"

## 📞 Support

For issues with:
- **GitHub Actions**: Check workflow logs and this documentation
- **IONOS API**: Contact IONOS support
- **Container Registry**: Check IONOS DCD documentation
