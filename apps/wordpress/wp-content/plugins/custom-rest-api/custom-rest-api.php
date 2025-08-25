<?php

/**
 * Plugin Name: Custom REST API
 * Plugin URI: https://example.com/custom-rest-api
 * Description: A custom REST API built with TypeScript/Node.js functionality integrated into WordPress
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
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('rest_api_init', array($this, 'register_rest_routes'));
        add_action('wp_ajax_custom_api_action', array($this, 'handle_ajax_request'));
        add_action('wp_ajax_nopriv_custom_api_action', array($this, 'handle_ajax_request'));
    }

    public function init()
    {
        // Load Node.js dependencies if available
        $this->load_node_dependencies();
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
            'rest_url' => rest_url('custom-api/v1/')
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
        // Register REST API routes
        register_rest_route('custom-api/v1', '/health', array(
            'methods' => 'GET',
            'callback' => array($this, 'health_check'),
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
    }


    public function health_check($request)
    {
        return array(
            'status' => 'OK',
            'timestamp' => current_time('c'),
            'service' => 'WordPress Custom REST API',
            'version' => CUSTOM_REST_API_VERSION,
            'wordpress_version' => get_bloginfo('version')
        );
    }

    public function get_posts($request)
    {
        $posts = get_posts(array(
            'numberposts' => 10,
            'post_status' => 'publish'
        ));

        $formatted_posts = array();
        foreach ($posts as $post) {
            $formatted_posts[] = array(
                'id' => $post->ID,
                'title' => $post->post_title,
                'content' => wp_strip_all_tags($post->post_content),
                'author' => get_the_author_meta('display_name', $post->post_author),
                'created_at' => $post->post_date,
                'modified_at' => $post->post_modified,
                'permalink' => get_permalink($post->ID)
            );
        }

        return $formatted_posts;
    }

    public function get_users($request)
    {
        $users = get_users(array('number' => 10));

        $formatted_users = array();
        foreach ($users as $user) {
            $formatted_users[] = array(
                'id' => $user->ID,
                'username' => $user->user_login,
                'email' => $user->user_email,
                'display_name' => $user->display_name,
                'role' => implode(', ', $user->roles)
            );
        }

        return $formatted_users;
    }

    public function get_node_data($request)
    {
        // This endpoint simulates Node.js functionality
        $node_data = array(
            'message' => 'Node.js-like data from WordPress',
            'timestamp' => time(),
            'random_number' => rand(1, 1000),
            'server_info' => array(
                'php_version' => PHP_VERSION,
                'wordpress_version' => get_bloginfo('version'),
                'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
            )
        );

        return $node_data;
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
