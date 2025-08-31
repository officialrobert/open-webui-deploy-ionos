# Use official PHP Apache image with WordPress
FROM php:8.2-apache

# Build arguments for customization
ARG APP_INSTANCE
ARG APP_PORT
ARG APP_TITLE
ARG TABLE_PREFIX

# Set environment variables
ENV WORDPRESS_VERSION=6.8.2
ENV WORDPRESS_DB_NAME=wordpress
ENV WORDPRESS_DB_USER=wordpress
ENV WORDPRESS_DB_PASSWORD=wordpress_password
ENV WORDPRESS_DB_HOST=db:3306
ENV WORDPRESS_TITLE="${APP_TITLE}"
ENV WORDPRESS_ADMIN_USER=admin
ENV WORDPRESS_ADMIN_PASSWORD=admin
ENV WORDPRESS_ADMIN_EMAIL=admin@example.com
ENV WORDPRESS_DEBUG=1
ENV WORDPRESS_SKIP_DB=0
ENV WORDPRESS_INSTANCE="${APP_INSTANCE}"
ENV WORDPRESS_TABLE_PREFIX="${TABLE_PREFIX}"

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    gnupg2 \
    lsb-release \
    ca-certificates \
    apt-transport-https \
    default-mysql-client \
    unzip \
    git \
    netcat-openbsd \
    iputils-ping \
    dnsutils \
    telnet \
    coreutils \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20 and npm
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install PHP extensions
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Enable Apache modules
RUN a2enmod rewrite
RUN a2enmod remoteip
RUN a2enmod headers

# Copy package.json files FIRST for better caching (only rebuilds when dependencies change)
COPY package.json /usr/local/bin/
COPY wp-content/plugins/custom-rest-api/package.json /tmp/plugin-package.json

# Install Node.js dependencies for the main application (cached layer)
RUN cd /usr/local/bin && npm install

# Install Node.js dependencies for the custom plugin (cached layer)
RUN mkdir -p /tmp/plugin-deps && cd /tmp/plugin-deps \
    && cp /tmp/plugin-package.json package.json \
    && npm install

# Download and extract WordPress
RUN wget -O /tmp/wordpress.tar.gz https://wordpress.org/wordpress-${WORDPRESS_VERSION}.tar.gz \
    && tar -xzf /tmp/wordpress.tar.gz -C /tmp \
    && rm /tmp/wordpress.tar.gz

# Copy WordPress files to Apache document root
RUN cp -r /tmp/wordpress/* /var/www/html/ \
    && rm -rf /tmp/wordpress

# Copy custom files and scripts
COPY start-wordpress.js /usr/local/bin/
COPY wp-config-sample.php /var/www/html/

# Copy environment files (if they exist) - using shell to handle missing files gracefully
RUN touch /tmp/.env.default && \
    if ls .env* 1> /dev/null 2>&1; then \
        cp .env* /tmp/; \
        echo "Environment files copied"; \
    else \
        echo "No .env files found, using defaults"; \
    fi

# Load environment variables from .env files if they exist
RUN for envfile in /tmp/.env*; do \
        if [ -f "$envfile" ] && [ "$envfile" != "/tmp/.env.default" ]; then \
            echo "Loading environment variables from $(basename $envfile)"; \
            export $(cat "$envfile" | grep -v '^#' | xargs); \
        fi; \
    done

# Create a PHP environment file that will be loaded by Apache
RUN echo '<?php' > /var/www/html/env.php \
    && echo '// Environment variables for PHP' >> /var/www/html/env.php \
    && echo '// Load from .env file if it exists' >> /var/www/html/env.php \
    && echo 'if (file_exists("/tmp/.env")) {' >> /var/www/html/env.php \
    && echo '    $env_content = file_get_contents("/tmp/.env");' >> /var/www/html/env.php \
    && echo '    $lines = explode("\n", $env_content);' >> /var/www/html/env.php \
    && echo '    foreach ($lines as $line) {' >> /var/www/html/env.php \
    && echo '        $line = trim($line);' >> /var/www/html/env.php \
    && echo '        if ($line && !str_starts_with($line, "#")) {' >> /var/www/html/env.php \
    && echo '            $parts = explode("=", $line, 2);' >> /var/www/html/env.php \
    && echo '            if (count($parts) == 2) {' >> /var/www/html/env.php \
    && echo '                $key = trim($parts[0]);' >> /var/www/html/env.php \
    && echo '                $value = trim($parts[1]);' >> /var/www/html/env.php \
    && echo '                if (!defined($key)) {' >> /var/www/html/env.php \
    && echo '                    define($key, $value);' >> /var/www/html/env.php \
    && echo '                }' >> /var/www/html/env.php \
    && echo '                $_ENV[$key] = $value;' >> /var/www/html/env.php \
    && echo '                putenv("$key=$value");' >> /var/www/html/env.php \
    && echo '            }' >> /var/www/html/env.php \
    && echo '        }' >> /var/www/html/env.php \
    && echo '    }' >> /var/www/html/env.php \
    && echo '}' >> /var/www/html/env.php \
    && echo '' >> /var/www/html/env.php \
    && echo '// Load from container environment variables' >> /var/www/html/env.php \
    && echo '$env_vars = array(' >> /var/www/html/env.php \
    && echo '    "OPEN_WEATHER_MAP_KEY",' >> /var/www/html/env.php \
    && echo '    "NEWSAPI_KEY",' >> /var/www/html/env.php \
    && echo '    "DUCKDUCKGO_ENABLED",' >> /var/www/html/env.php \
    && echo '    "WORDPRESS_DB_NAME",' >> /var/www/html/env.php \
    && echo '    "WORDPRESS_DB_USER",' >> /var/www/html/env.php \
    && echo '    "WORDPRESS_DB_PASSWORD",' >> /var/www/html/env.php \
    && echo '    "WORDPRESS_DB_HOST",' >> /var/www/html/env.php \
    && echo '    "WORDPRESS_TABLE_PREFIX",' >> /var/www/html/env.php \
    && echo '    "WORDPRESS_DEBUG",' >> /var/www/html/env.php \
    && echo '    "WORDPRESS_INSTANCE",' >> /var/www/html/env.php \
    && echo '    "WORDPRESS_TITLE",' >> /var/www/html/env.php \
    && echo '    "WORDPRESS_URL",' >> /var/www/html/env.php \
    && echo '    "WORDPRESS_ADMIN_USER",' >> /var/www/html/env.php \
    && echo '    "WORDPRESS_ADMIN_PASSWORD",' >> /var/www/html/env.php \
    && echo '    "WORDPRESS_ADMIN_EMAIL",' >> /var/www/html/env.php \
    && echo '    "APACHE_PORT",' >> /var/www/html/env.php \
    && echo '    "WP_PROXY_HOST",' >> /var/www/html/env.php \
    && echo '    "WP_PROXY_PORT",' >> /var/www/html/env.php \
    && echo '    "WP_PROXY_USERNAME",' >> /var/www/html/env.php \
    && echo '    "WP_PROXY_PASSWORD",' >> /var/www/html/env.php \
    && echo '    "WP_PROXY_BYPASS_HOSTS"' >> /var/www/html/env.php \
    && echo ');' >> /var/www/html/env.php \
    && echo '' >> /var/www/html/env.php \
    && echo 'foreach ($env_vars as $var) {' >> /var/www/html/env.php \
    && echo '    $value = getenv($var);' >> /var/www/html/env.php \
    && echo '    if ($value !== false && !defined($var)) {' >> /var/www/html/env.php \
    && echo '        define($var, $value);' >> /var/www/html/env.php \
    && echo '        $_ENV[$var] = $value;' >> /var/www/html/env.php \
    && echo '    }' >> /var/www/html/env.php \
    && echo '}' >> /var/www/html/env.php

# Copy custom REST API plugin
COPY wp-content/plugins/custom-rest-api /var/www/html/wp-content/plugins/custom-rest-api/

# Copy pre-installed plugin dependencies and build plugin (cached layer)
RUN cp -r /tmp/plugin-deps/node_modules /var/www/html/wp-content/plugins/custom-rest-api/ \
    && cd /var/www/html/wp-content/plugins/custom-rest-api \
    && npm run build

# Install WP-CLI
RUN curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
    && chmod +x wp-cli.phar \
    && mv wp-cli.phar /usr/local/bin/wp

# Create necessary directories and set permissions
RUN mkdir -p /var/www/html/wp-content/uploads \
    && mkdir -p /var/www/html/wp-content/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Load environment variables from .env files if they exist
RUN if [ -f /tmp/.env ]; then \
        export $(cat /tmp/.env | grep -v '^#' | xargs); \
        echo "Environment variables loaded from .env"; \
    fi

# Configure Apache for port 3000
RUN sed -i "s/Listen 80/Listen 0.0.0.0:3000/" /etc/apache2/ports.conf \
    && sed -i "s/<VirtualHost \*:80>/<VirtualHost *:3000>/" /etc/apache2/sites-available/000-default.conf \
    && echo "ServerName localhost" >> /etc/apache2/sites-available/000-default.conf

# Add .htaccess for WordPress with proxy support
RUN echo 'RewriteEngine On' > /var/www/html/.htaccess \
    && echo 'RewriteBase /' >> /var/www/html/.htaccess \
    && echo 'RewriteRule ^index\.php$ - [L]' >> /var/www/html/.htaccess \
    && echo 'RewriteCond %{REQUEST_FILENAME} !-f' >> /var/www/html/.htaccess \
    && echo 'RewriteCond %{REQUEST_FILENAME} !-d' >> /var/www/html/.htaccess \
    && echo 'RewriteRule . /index.php [L]' >> /var/www/html/.htaccess \
    && echo '' >> /var/www/html/.htaccess \
    && echo '# Proxy Trust Configuration' >> /var/www/html/.htaccess \
    && echo 'SetEnvIf X-Forwarded-Proto https HTTPS=on' >> /var/www/html/.htaccess \
    && echo 'SetEnvIf X-Forwarded-Proto https SERVER_PORT=443' >> /var/www/html/.htaccess \
    && echo 'SetEnvIf X-Forwarded-Proto http SERVER_PORT=80' >> /var/www/html/.htaccess

# Create a health check script
RUN echo '#!/bin/bash' > /usr/local/bin/healthcheck.sh \
    && echo 'curl -f http://127.0.0.1:3000/wp-json/ || exit 1' >> /usr/local/bin/healthcheck.sh \
    && chmod +x /usr/local/bin/healthcheck.sh

# Expose port 3000
EXPOSE 3000

# Set the entrypoint to our unified startup script
ENTRYPOINT ["node", "/usr/local/bin/start-wordpress.js"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh
