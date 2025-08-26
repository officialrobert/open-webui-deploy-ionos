# Universal Dockerfile for WordPress + Custom REST API Plugin (Dev & Prod)
FROM php:8.2-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libzip-dev \
    zip \
    unzip \
    curl \
    git \
    nodejs \
    npm \
    mariadb-client \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install \
    mysqli \
    pdo_mysql \
    zip \
    opcache

# Enable Apache modules
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Copy WordPress files
COPY . .

# Build the custom REST API plugin
WORKDIR /var/www/html/wp-content/plugins/custom-rest-api

# Copy package files and install dependencies
COPY wp-content/plugins/custom-rest-api/package*.json ./
COPY wp-content/plugins/custom-rest-api/tsconfig.json ./

# Install Node.js dependencies (will be overridden in dev with npm install)
RUN npm ci --only=production && \
    npm run build

# Copy plugin source files
COPY wp-content/plugins/custom-rest-api/src/ ./src/

# Build TypeScript again to ensure all files are compiled
RUN npm run build

# Return to WordPress root
WORKDIR /var/www/html

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Install WP-CLI
RUN curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar && \
    chmod +x wp-cli.phar && \
    mv wp-cli.phar /usr/local/bin/wp

# Copy startup script
COPY start-wordpress.js /usr/local/bin/start-wordpress.js
RUN chmod +x /usr/local/bin/start-wordpress.js

# Expose ports for all apps (will be configured by startup script)
EXPOSE 3000 3001 3002


# Start WordPress
CMD ["node", "/usr/local/bin/start-wordpress.js"]
