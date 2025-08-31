<?php

/**
 * Plugin Name: Custom REST API
 * Plugin URI: https://example.com/custom-rest-api
 * Description: A custom REST API with external API integration for Open WebUI
 * Version: 1.0.0
 * Author: Your Name
 * License: MIT
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('CUSTOM_REST_API_VERSION', '1.0.0');
define('CUSTOM_REST_API_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CUSTOM_REST_API_PLUGIN_URL', plugin_dir_url(__FILE__));

// API configuration is now centralized in src/config.ts

class CustomRestAPI
{

    public function __construct()
    {
        error_log('Custom REST API: Plugin constructor called');
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('rest_api_init', array($this, 'register_rest_routes'));
        add_action('wp_ajax_custom_api_action', array($this, 'handle_ajax_request'));
        add_action('wp_ajax_nopriv_custom_api_action', array($this, 'handle_ajax_request'));

        // Ensure JSON content type for all REST API responses
        add_filter('rest_pre_serve_request', array($this, 'set_json_content_type'), 10, 4);

        // Prevent WordPress from serving HTML error pages for our API
        add_action('rest_api_init', array($this, 'prevent_html_errors'));

        // Add CORS headers for API requests
        add_action('rest_api_init', array($this, 'add_cors_headers'));
    }

    public function init()
    {
        // Load Node.js dependencies if available
        $this->load_node_dependencies();
    }

    public function prevent_html_errors()
    {
        // Prevent WordPress from serving HTML error pages for our custom API
        if (strpos($_SERVER['REQUEST_URI'] ?? '', 'rest_route=/custom-api/v1/') !== false) {
            // Disable WordPress error display for our API
            if (!defined('WP_DEBUG_DISPLAY')) {
                define('WP_DEBUG_DISPLAY', false);
            }

            // Set error handler to return JSON
            set_error_handler(array($this, 'json_error_handler'));
        }
    }

    public function json_error_handler($errno, $errstr, $errfile, $errline)
    {
        // Only handle errors for our API endpoints
        if (strpos($_SERVER['REQUEST_URI'] ?? '', 'rest_route=/custom-api/v1/') !== false) {
            $error_response = array(
                'success' => false,
                'error' => array(
                    'message' => $errstr,
                    'file' => $errfile,
                    'line' => $errline,
                    'type' => $errno
                ),
                'timestamp' => current_time('c')
            );

            header('Content-Type: application/json; charset=UTF-8');
            http_response_code(500);
            echo json_encode($error_response);
            exit;
        }

        return false; // Let PHP handle other errors
    }

    public function add_cors_headers()
    {
        // Add CORS headers for API requests
        if (strpos($_SERVER['REQUEST_URI'] ?? '', 'rest_route=/custom-api/v1/') !== false) {
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, X-WP-Nonce, Authorization');

            // Handle preflight requests
            if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
                http_response_code(200);
                exit;
            }
        }
    }

    public function enqueue_scripts()
    {
        // Enqueue CSS
        wp_enqueue_style(
            'custom-rest-api-style',
            CUSTOM_REST_API_PLUGIN_URL . 'assets/css/style.css',
            array(),
            CUSTOM_REST_API_VERSION
        );

        // Enqueue JavaScript
        wp_enqueue_script(
            'custom-rest-api-frontend',
            CUSTOM_REST_API_PLUGIN_URL . 'assets/js/frontend.js',
            array('jquery'),
            CUSTOM_REST_API_VERSION,
            true
        );

        wp_localize_script('custom-rest-api-frontend', 'customApiAjax', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('custom_api_nonce'),
            'rest_url' => home_url('/index.php?rest_route=/custom-api/v1/')
        ));
    }

    public function enqueue_admin_scripts()
    {
        wp_enqueue_script(
            'custom-rest-api-admin',
            CUSTOM_REST_API_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery'),
            CUSTOM_REST_API_VERSION,
            true
        );
    }

    public function register_rest_routes()
    {
        // Add debugging
        error_log('Custom REST API: Registering routes...');

        // Register REST API routes
        register_rest_route('custom-api/v1', '/health', array(
            'methods' => 'GET',
            'callback' => array($this, 'health_check'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('custom-api/v1', '/test', array(
            'methods' => 'GET',
            'callback' => array($this, 'test_endpoint'),
            'permission_callback' => '__return_true'
        ));



        // Weather API endpoint
        register_rest_route('custom-api/v1', '/weather', array(
            'methods' => 'GET, POST',
            'callback' => array($this, 'get_weather'),
            'permission_callback' => '__return_true',
            'args' => array(
                'city' => array(
                    'required' => true,
                    'type' => 'string',
                    'description' => 'City name to get weather for',
                    'sanitize_callback' => 'sanitize_text_field'
                ),
                'country' => array(
                    'required' => false,
                    'type' => 'string',
                    'description' => 'Country code (optional)',
                    'sanitize_callback' => 'sanitize_text_field'
                )
            )
        ));

        error_log('Custom REST API: Routes registered successfully');
    }

    /**
     * Helper method to create consistent JSON responses
     */
    private function create_json_response($data, $status_code = 200, $headers = array())
    {
        $response = new WP_REST_Response($data, $status_code);

        // Always set JSON content type
        $response->header('Content-Type', 'application/json; charset=UTF-8');

        // Add additional headers
        foreach ($headers as $key => $value) {
            $response->header($key, $value);
        }

        return $response;
    }

    public function test_endpoint($request)
    {
        $response = array(
            'success' => true,
            'message' => 'Custom REST API is working!',
            'timestamp' => current_time('c'),
            'plugin_loaded' => true,
            'wordpress_version' => get_bloginfo('version'),
            'rest_api_enabled' => true,
            'endpoint' => '/index.php?rest_route=/custom-api/v1/test',
            'method' => 'GET'
        );

        return $this->create_json_response($response, 200);
    }

    public function health_check($request)
    {
        $response = array(
            'status' => 'OK',
            'timestamp' => current_time('c'),
            'service' => 'WordPress Custom REST API',
            'version' => CUSTOM_REST_API_VERSION,
            'wordpress_version' => get_bloginfo('version'),
            'endpoint' => '/index.php?rest_route=/custom-api/v1/health',
            'method' => 'GET'
        );

        return $this->create_json_response($response, 200);
    }





    private function load_node_dependencies()
    {
        // Check if Node.js dependencies are available
        $package_json_path = CUSTOM_REST_API_PLUGIN_DIR . 'package.json';
        $node_modules_path = CUSTOM_REST_API_PLUGIN_DIR . 'node_modules';

        if (file_exists($package_json_path) && is_dir($node_modules_path)) {
            // Node.js dependencies are available
            add_action('wp_footer', array($this, 'load_node_scripts'));
        }
    }

    public function load_node_scripts()
    {
        // Load compiled Node.js scripts if available
        $dist_path = CUSTOM_REST_API_PLUGIN_DIR . 'dist/';
        if (is_dir($dist_path)) {
            $files = glob($dist_path . '*.js');
            foreach ($files as $file) {
                $filename = basename($file);
                wp_enqueue_script(
                    'custom-api-' . $filename,
                    CUSTOM_REST_API_PLUGIN_URL . 'dist/' . $filename,
                    array(),
                    CUSTOM_REST_API_VERSION,
                    true
                );
            }
        }
    }

    public function set_json_content_type($served, $result, $request, $server)
    {
        // Check if this is our custom API endpoint
        if (strpos($request->get_route(), 'custom-api/v1') !== false) {
            header('Content-Type: application/json; charset=UTF-8');

            // Prevent WordPress from outputting anything else
            if (!headers_sent()) {
                header('X-Content-Type-Options: nosniff');
            }
        }
        return $served;
    }



    /**
     * Get weather information for a city
     */
    public function get_weather($request)
    {
        try {
            $city = $request->get_param('city');
            $country = $request->get_param('country');

            if (empty($city)) {
                $error_response = array(
                    'success' => false,
                    'error' => 'City parameter is required',
                    'timestamp' => current_time('c')
                );
                return $this->create_json_response($error_response, 400);
            }

            // Call the TypeScript API service
            $weather_data = $this->call_typescript_weather_service($city);

            $response = array(
                'success' => true,
                'data' => array(
                    'location' => array(
                        'city' => $city,
                        'country' => $country ?: 'Unknown'
                    ),
                    'weather' => $weather_data,
                    'timestamp' => current_time('c'),
                    'source' => $weather_data['source']
                ),
                'meta' => array(
                    'endpoint' => '/index.php?rest_route=/custom-api/v1/weather',
                    'method' => 'GET',
                    'parameters' => array(
                        'city' => $city,
                        'country' => $country ?: 'Not specified'
                    )
                )
            );

            return $this->create_json_response($response, 200);
        } catch (Exception $e) {
            $error_response = array(
                'success' => false,
                'error' => $e->getMessage(),
                'timestamp' => current_time('c')
            );
            return $this->create_json_response($error_response, 500);
        }
    }

    /**
     * Call TypeScript weather service to get weather data
     */
    private function call_typescript_weather_service($city)
    {

        // Try multiple ways to get the API key
        if (defined('OPEN_WEATHER_MAP_KEY') && !empty(constant('OPEN_WEATHER_MAP_KEY'))) {
            $weather_api_key = constant('OPEN_WEATHER_MAP_KEY');
        } elseif (getenv('OPEN_WEATHER_MAP_KEY')) {
            $weather_api_key = getenv('OPEN_WEATHER_MAP_KEY');
        } elseif (isset($_ENV['OPEN_WEATHER_MAP_KEY'])) {
            $weather_api_key = $_ENV['OPEN_WEATHER_MAP_KEY'];
        }

        if (!$weather_api_key) {
            throw new Exception('OpenWeatherMap API key not found in environment variables. Please set OPEN_WEATHER_MAP_KEY in your environment or .env file.');
        }

        // Decode base64 API key if it's encoded
        if (base64_encode(base64_decode($weather_api_key, true)) === $weather_api_key) {
            $weather_api_key = base64_decode($weather_api_key);
        }

        // Debug: log what we found
        error_log('Weather API Key Debug - defined: ' . (defined('OPEN_WEATHER_MAP_KEY') ? 'yes' : 'no') .
            ', getenv: ' . (getenv('OPEN_WEATHER_MAP_KEY') ? 'yes' : 'no') .
            ', _ENV: ' . (isset($_ENV['OPEN_WEATHER_MAP_KEY']) ? 'yes' : 'no') .
            ', final key: ' . substr($weather_api_key, 0, 4) . '***' .
            ', defined value: ' . (defined('OPEN_WEATHER_MAP_KEY') ? constant('OPEN_WEATHER_MAP_KEY') : 'not defined'));

        // Execute Node.js script to call TypeScript service
        $script_path = CUSTOM_REST_API_PLUGIN_DIR . 'dist/api.js';

        if (!file_exists($script_path)) {
            throw new Exception('TypeScript API service not compiled. Run npm run build first.');
        }

        // Create a temporary Node.js script to call the weather service
        $plugin_dir = CUSTOM_REST_API_PLUGIN_DIR;
        $temp_script = "const { WeatherApiService } = require('" . $plugin_dir . "dist/api.js');\n";
        $temp_script .= "const service = new WeatherApiService('" . $weather_api_key . "');\n";
        $temp_script .= "service.getWeatherData('" . addslashes($city) . "').then(data => {\n";
        $temp_script .= "  console.log(JSON.stringify(data));\n";
        $temp_script .= "}).catch(error => {\n";
        $temp_script .= "  console.error(JSON.stringify({error: error.message}));\n";
        $temp_script .= "  process.exit(1);\n";
        $temp_script .= "});\n";

        $temp_file = tempnam(sys_get_temp_dir(), 'weather_');
        file_put_contents($temp_file, $temp_script);

        // Execute the Node.js script with environment variable
        $env_var = "OPEN_WEATHER_MAP_KEY=" . escapeshellarg($weather_api_key);
        $output = shell_exec($env_var . " node " . escapeshellarg($temp_file) . " 2>&1");

        // Clean up temp file
        unlink($temp_file);

        // Check if output contains error JSON
        if (strpos($output, '{"error":') !== false) {
            $error_data = json_decode($output, true);
            throw new Exception('TypeScript service failed: ' . ($error_data['error'] ?? 'Unknown error'));
        }

        // Check if output is valid JSON
        $data = json_decode($output, true);
        if (!$data) {
            throw new Exception('Invalid JSON response from TypeScript service: ' . $output);
        }

        // Check if the data contains an error
        if (isset($data['error'])) {
            throw new Exception('TypeScript service error: ' . $data['error']);
        }

        return $data;
    }


}

// Initialize the plugin
new CustomRestAPI();

// Activation hook
register_activation_hook(__FILE__, 'custom_rest_api_activate');
function custom_rest_api_activate()
{
    // Create necessary database tables or options
    add_option('custom_rest_api_version', CUSTOM_REST_API_VERSION);
}

// Deactivation hook
register_deactivation_hook(__FILE__, 'custom_rest_api_deactivate');
function custom_rest_api_deactivate()
{
    // Cleanup if necessary
}
