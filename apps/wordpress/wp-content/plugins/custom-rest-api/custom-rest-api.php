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

        register_rest_route('custom-api/v1', '/posts', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_posts'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('custom-api/v1', '/users', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_users'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('custom-api/v1', '/node-data', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_node_data'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('custom-api/v1', '/categories', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_categories'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('custom-api/v1', '/post/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_single_post'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('custom-api/v1', '/stats', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_stats'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('custom-api/v1', '/search', array(
            'methods' => 'GET',
            'callback' => array($this, 'search_content'),
            'permission_callback' => '__return_true'
        ));

        // Demo endpoint for Open WebUI integration
        register_rest_route('custom-api/v1', '/demo', array(
            'methods' => 'GET, POST',
            'callback' => array($this, 'demo_endpoint'),
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

    public function get_posts($request)
    {
        try {
            // Get query parameters
            $per_page = $request->get_param('per_page') ?: 10;
            $page = $request->get_param('page') ?: 1;
            $category = $request->get_param('category');
            $search = $request->get_param('search');

            // Build query args
            $args = array(
                'numberposts' => $per_page,
                'post_status' => 'publish',
                'offset' => ($page - 1) * $per_page
            );

            if ($category) {
                $args['category_name'] = $category;
            }

            if ($search) {
                $args['s'] = $search;
            }

            $posts = get_posts($args);
            $total_posts = wp_count_posts('post')->publish;

            $formatted_posts = array();
            foreach ($posts as $post) {
                $formatted_posts[] = array(
                    'id' => $post->ID,
                    'title' => $post->post_title,
                    'content' => wp_strip_all_tags($post->post_content),
                    'excerpt' => wp_strip_all_tags($post->post_excerpt ?: wp_trim_words($post->post_content, 55)),
                    'author' => get_the_author_meta('display_name', $post->post_author),
                    'author_id' => $post->post_author,
                    'created_at' => $post->post_date,
                    'modified_at' => $post->post_modified,
                    'permalink' => get_permalink($post->ID),
                    'featured_image' => get_the_post_thumbnail_url($post->ID, 'medium'),
                    'categories' => wp_get_post_categories($post->ID, array('fields' => 'names')),
                    'tags' => wp_get_post_tags($post->ID, array('fields' => 'names'))
                );
            }

            $response = array(
                'success' => true,
                'data' => $formatted_posts,
                'pagination' => array(
                    'current_page' => (int)$page,
                    'per_page' => (int)$per_page,
                    'total_posts' => $total_posts,
                    'total_pages' => ceil($total_posts / $per_page)
                ),
                'meta' => array(
                    'endpoint' => '/index.php?rest_route=/custom-api/v1/posts',
                    'method' => 'GET',
                    'timestamp' => current_time('c')
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

    public function get_users($request)
    {
        try {
            // Get query parameters
            $per_page = $request->get_param('per_page') ?: 10;
            $page = $request->get_param('page') ?: 1;
            $role = $request->get_param('role');
            $search = $request->get_param('search');

            // Build query args
            $args = array(
                'number' => $per_page,
                'offset' => ($page - 1) * $per_page
            );

            if ($role) {
                $args['role'] = $role;
            }

            if ($search) {
                $args['search'] = '*' . $search . '*';
            }

            $users = get_users($args);
            $total_users = count_users()['total_users'];

            $formatted_users = array();
            foreach ($users as $user) {
                $formatted_users[] = array(
                    'id' => $user->ID,
                    'username' => $user->user_login,
                    'email' => $user->user_email,
                    'display_name' => $user->display_name,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'role' => implode(', ', $user->roles),
                    'registered_date' => $user->user_registered,
                    'avatar' => get_avatar_url($user->ID, array('size' => 96)),
                    'profile_url' => get_author_posts_url($user->ID)
                );
            }

            $response = array(
                'success' => true,
                'data' => $formatted_users,
                'pagination' => array(
                    'current_page' => (int)$page,
                    'per_page' => (int)$per_page,
                    'total_users' => $total_users,
                    'total_pages' => ceil($total_users / $per_page)
                ),
                'meta' => array(
                    'endpoint' => '/index.php?rest_route=/custom-api/v1/users',
                    'method' => 'GET',
                    'timestamp' => current_time('c')
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

    public function get_node_data($request)
    {
        try {
            // This endpoint provides server information
            $server_data = array(
                'success' => true,
                'data' => array(
                    'message' => 'Server information from WordPress',
                    'timestamp' => time(),
                    'random_number' => rand(1, 1000),
                    'server_info' => array(
                        'php_version' => PHP_VERSION,
                        'wordpress_version' => get_bloginfo('version'),
                        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
                        'memory_limit' => ini_get('memory_limit'),
                        'max_execution_time' => ini_get('max_execution_time')
                    ),
                    'wordpress_info' => array(
                        'site_title' => get_bloginfo('name'),
                        'site_description' => get_bloginfo('description'),
                        'site_url' => get_site_url(),
                        'admin_email' => get_option('admin_email'),
                        'timezone' => get_option('timezone_string'),
                        'date_format' => get_option('date_format'),
                        'time_format' => get_option('time_format')
                    )
                ),
                'meta' => array(
                    'endpoint' => '/index.php?rest_route=/custom-api/v1/node-data',
                    'method' => 'GET',
                    'timestamp' => current_time('c')
                )
            );

            return $this->create_json_response($server_data, 200);
        } catch (Exception $e) {
            $error_response = array(
                'success' => false,
                'error' => $e->getMessage(),
                'timestamp' => current_time('c')
            );
            return $this->create_json_response($error_response, 500);
        }
    }

    public function get_categories($request)
    {
        try {
            $categories = get_categories(array(
                'hide_empty' => false,
                'orderby' => 'name',
                'order' => 'ASC'
            ));

            $formatted_categories = array();
            foreach ($categories as $category) {
                $formatted_categories[] = array(
                    'id' => $category->term_id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'description' => $category->description,
                    'count' => $category->count,
                    'link' => get_category_link($category->term_id)
                );
            }

            $response = array(
                'success' => true,
                'data' => $formatted_categories,
                'meta' => array(
                    'endpoint' => '/index.php?rest_route=/custom-api/v1/categories',
                    'method' => 'GET',
                    'timestamp' => current_time('c'),
                    'total_categories' => count($formatted_categories)
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

    public function get_single_post($request)
    {
        try {
            $post_id = $request->get_param('id');
            $post = get_post($post_id);

            if (!$post || $post->post_status !== 'publish') {
                $error_response = array(
                    'success' => false,
                    'error' => 'Post not found or not published',
                    'timestamp' => current_time('c')
                );
                return $this->create_json_response($error_response, 404);
            }

            $response = array(
                'success' => true,
                'data' => array(
                    'id' => $post->ID,
                    'title' => $post->post_title,
                    'content' => $post->post_content,
                    'excerpt' => $post->post_excerpt ?: wp_trim_words($post->post_content, 55),
                    'author' => get_the_author_meta('display_name', $post->post_author),
                    'author_id' => $post->post_author,
                    'created_at' => $post->post_date,
                    'modified_at' => $post->post_modified,
                    'permalink' => get_permalink($post->ID),
                    'featured_image' => get_the_post_thumbnail_url($post->ID, 'full'),
                    'categories' => wp_get_post_categories($post->ID, array('fields' => 'names')),
                    'tags' => wp_get_post_tags($post->ID, array('fields' => 'names')),
                    'comment_count' => $post->comment_count,
                    'comment_status' => $post->comment_status
                ),
                'meta' => array(
                    'endpoint' => '/index.php?rest_route=/custom-api/v1/post/' . $post_id,
                    'method' => 'GET',
                    'timestamp' => current_time('c')
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

    public function get_stats($request)
    {
        try {
            $stats = array(
                'posts' => array(
                    'total' => wp_count_posts('post')->publish,
                    'draft' => wp_count_posts('post')->draft,
                    'pending' => wp_count_posts('post')->pending
                ),
                'pages' => array(
                    'total' => wp_count_posts('page')->publish,
                    'draft' => wp_count_posts('page')->draft
                ),
                'users' => count_users()['total_users'],
                'categories' => wp_count_terms('category'),
                'tags' => wp_count_terms('post_tag'),
                'comments' => array(
                    'total' => wp_count_comments()->total_comments,
                    'approved' => wp_count_comments()->approved,
                    'pending' => wp_count_comments()->moderated
                )
            );

            $response = array(
                'success' => true,
                'data' => $stats,
                'meta' => array(
                    'endpoint' => '/index.php?rest_route=/custom-api/v1/stats',
                    'method' => 'GET',
                    'timestamp' => current_time('c')
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

    public function search_content($request)
    {
        try {
            $query = $request->get_param('q');
            $type = $request->get_param('type') ?: 'post';
            $per_page = $request->get_param('per_page') ?: 10;
            $page = $request->get_param('page') ?: 1;

            if (!$query) {
                $error_response = array(
                    'success' => false,
                    'error' => 'Search query parameter "q" is required',
                    'timestamp' => current_time('c')
                );
                return $this->create_json_response($error_response, 400);
            }

            $args = array(
                's' => $query,
                'post_type' => $type,
                'post_status' => 'publish',
                'posts_per_page' => $per_page,
                'paged' => $page
            );

            $search_query = new WP_Query($args);
            $results = array();

            if ($search_query->have_posts()) {
                while ($search_query->have_posts()) {
                    $search_query->the_post();
                    $post = get_post();

                    $results[] = array(
                        'id' => $post->ID,
                        'title' => $post->post_title,
                        'excerpt' => wp_trim_words($post->post_content, 30),
                        'type' => $post->post_type,
                        'permalink' => get_permalink($post->ID),
                        'author' => get_the_author_meta('display_name', $post->post_author),
                        'created_at' => $post->post_date
                    );
                }
            }

            wp_reset_postdata();

            $response = array(
                'success' => true,
                'data' => $results,
                'pagination' => array(
                    'current_page' => (int)$page,
                    'per_page' => (int)$per_page,
                    'total_results' => $search_query->found_posts,
                    'total_pages' => $search_query->max_num_pages
                ),
                'meta' => array(
                    'endpoint' => '/index.php?rest_route=/custom-api/v1/search',
                    'method' => 'GET',
                    'query' => $query,
                    'type' => $type,
                    'timestamp' => current_time('c')
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

    public function handle_ajax_request()
    {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'custom_api_nonce')) {
            wp_die('Security check failed');
        }

        $action = $_POST['action'] ?? '';
        $data = $_POST['data'] ?? array();

        switch ($action) {
            case 'custom_api_action':
                $response = array(
                    'success' => true,
                    'message' => 'AJAX request processed successfully',
                    'data' => $data,
                    'timestamp' => current_time('c')
                );
                break;
            default:
                $response = array(
                    'success' => false,
                    'message' => 'Unknown action'
                );
        }

        wp_send_json($response);
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
     * Demo endpoint for Open WebUI integration
     * Weather API using free service
     */
    public function demo_endpoint($request)
    {
        $action = $request->get_param('action') ?: 'info';
        $city = $request->get_param('city') ?: 'London';
        $query = $request->get_param('query') ?: '';
        
        switch ($action) {
            case 'weather':
                return $this->get_weather_data($city);
            case 'search':
                return $this->get_search_results($query);
            case 'info':
            default:
                $response = array(
                    'success' => true,
                    'message' => 'Demo endpoint working!',
                    'available_actions' => array('weather', 'search', 'info'),
                    'examples' => array(
                        'weather' => '/demo?action=weather&city=New York',
                        'search' => '/demo?action=search&query=openai'
                    ),
                    'timestamp' => current_time('c')
                );
                return $this->create_json_response($response, 200);
        }
    }
    
    /**
     * Get weather data from free API
     */
    private function get_weather_data($city)
    {
        try {
            // Using wttr.in - a free weather API
            $url = 'https://wttr.in/' . urlencode($city) . '?format=j1';
            $response = wp_remote_get($url);
            
            if (is_wp_error($response)) {
                throw new Exception('Failed to fetch weather data: ' . $response->get_error_message());
            }
            
            $body = wp_remote_retrieve_body($response);
            $data = json_decode($body, true);
            
            if (!$data || !isset($data['current_condition'][0])) {
                throw new Exception('Invalid weather data received');
            }
            
            $current = $data['current_condition'][0];
            $nearest_area = $data['nearest_area'][0];
            
            $weather_response = array(
                'success' => true,
                'data' => array(
                    'city' => $nearest_area['areaName'][0]['value'],
                    'country' => $nearest_area['country'][0]['value'],
                    'temperature' => $current['temp_C'] . '°C',
                    'feels_like' => $current['FeelsLikeC'] . '°C',
                    'description' => $current['weatherDesc'][0]['value'],
                    'humidity' => $current['humidity'] . '%',
                    'wind_speed' => $current['windspeedKmph'] . ' km/h',
                    'wind_direction' => $current['winddir16Point'],
                    'visibility' => $current['visibility'] . ' km',
                    'pressure' => $current['pressure'] . ' mb',
                    'uv_index' => $current['uvIndex'],
                    'time' => $current['observation_time'],
                    'source' => 'wttr.in'
                ),
                'timestamp' => current_time('c')
            );
            
            return $this->create_json_response($weather_response, 200);
            
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
     * Get search results using DuckDuckGo Instant Answer API
     */
    private function get_search_results($query)
    {
        try {
            if (empty($query)) {
                throw new Exception('Search query is required');
            }
            
            // Using DuckDuckGo Instant Answer API (free, no API key needed)
            $url = 'https://api.duckduckgo.com/?q=' . urlencode($query) . '&format=json&no_html=1&skip_disambig=1';
            $response = wp_remote_get($url);
            
            if (is_wp_error($response)) {
                throw new Exception('Failed to fetch search results: ' . $response->get_error_message());
            }
            
            $body = wp_remote_retrieve_body($response);
            $data = json_decode($body, true);
            
            $results = array();
            
            // Add abstract if available
            if (!empty($data['Abstract'])) {
                $results[] = array(
                    'title' => $data['Heading'] ?: $query,
                    'snippet' => $data['Abstract'],
                    'url' => $data['AbstractURL'] ?: '',
                    'source' => 'DuckDuckGo Instant Answer'
                );
            }
            
            // Add related topics
            if (!empty($data['RelatedTopics'])) {
                foreach (array_slice($data['RelatedTopics'], 0, 5) as $topic) {
                    if (isset($topic['Text']) && isset($topic['FirstURL'])) {
                        $results[] = array(
                            'title' => $topic['Text'],
                            'snippet' => $topic['Text'],
                            'url' => $topic['FirstURL'],
                            'source' => 'DuckDuckGo Related Topics'
                        );
                    }
                }
            }
            
            if (empty($results)) {
                $results[] = array(
                    'title' => 'No results found',
                    'snippet' => 'No search results available for: ' . $query,
                    'url' => '',
                    'source' => 'DuckDuckGo'
                );
            }
            
            $search_response = array(
                'success' => true,
                'data' => array(
                    'query' => $query,
                    'results' => $results,
                    'total_results' => count($results),
                    'source' => 'DuckDuckGo Instant Answer API'
                ),
                'timestamp' => current_time('c')
            );
            
            return $this->create_json_response($search_response, 200);
            
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

            // Build location string
            $location = $city;
            if (!empty($country)) {
                $location .= ',' . $country;
            }

            // Using OpenWeatherMap API (free tier, no API key needed for basic weather)
            // For demo purposes, we'll use a mock weather service that doesn't require API keys
            $weather_data = $this->get_mock_weather_data($city, $country);

            $response = array(
                'success' => true,
                'data' => array(
                    'location' => array(
                        'city' => $city,
                        'country' => $country ?: 'Unknown',
                        'full_location' => $location
                    ),
                    'weather' => $weather_data,
                    'timestamp' => current_time('c'),
                    'source' => 'Mock Weather API (Demo)'
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
     * Generate mock weather data for demo purposes
     */
    private function get_mock_weather_data($city, $country = '')
    {
        // Generate consistent weather based on city name (for demo purposes)
        $city_hash = crc32(strtolower($city));
        $weather_conditions = array(
            'Clear', 'Cloudy', 'Partly Cloudy', 'Rainy', 'Sunny', 
            'Overcast', 'Light Rain', 'Thunderstorm', 'Foggy', 'Windy'
        );
        
        $condition = $weather_conditions[$city_hash % count($weather_conditions)];
        
        // Generate temperature based on city hash (between -10 and 35 degrees Celsius)
        $temperature = ($city_hash % 45) - 10;
        
        // Generate humidity (between 30 and 90%)
        $humidity = ($city_hash % 60) + 30;
        
        // Generate wind speed (between 0 and 25 km/h)
        $wind_speed = ($city_hash % 25);
        
        // Generate pressure (between 980 and 1030 hPa)
        $pressure = ($city_hash % 50) + 980;
        
        // Generate feels like temperature (slightly different from actual temperature)
        $feels_like = $temperature + (($city_hash % 7) - 3);
        
        return array(
            'condition' => $condition,
            'temperature' => array(
                'current' => $temperature,
                'feels_like' => $feels_like,
                'unit' => 'celsius'
            ),
            'humidity' => $humidity,
            'wind' => array(
                'speed' => $wind_speed,
                'unit' => 'km/h'
            ),
            'pressure' => array(
                'value' => $pressure,
                'unit' => 'hPa'
            ),
            'visibility' => array(
                'value' => ($city_hash % 10) + 5,
                'unit' => 'km'
            ),
            'uv_index' => ($city_hash % 11),
            'sunrise' => '06:00',
            'sunset' => '18:00',
            'last_updated' => current_time('c')
        );
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
