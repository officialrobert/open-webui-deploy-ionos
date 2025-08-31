<?php
/**
 * OpenAPI JSON endpoint
 * This file serves the OpenAPI specification at /openapi.json
 */

// Set proper headers
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// OpenAPI specification
$openapi_spec = array(
    'openapi' => '3.0.1',
    'info' => array(
        'title' => 'Custom Weather API',
        'version' => '1.0.0',
        'description' => 'Returns current weather data for a given city'
    ),
    'paths' => array(
        '/index.php' => array(
            'get' => array(
                'summary' => 'Get current weather',
                'description' => 'Fetch weather data for a city',
                'parameters' => array(
                    array(
                        'name' => 'rest_route',
                        'in' => 'query',
                        'required' => true,
                        'schema' => array(
                            'type' => 'string',
                            'enum' => array('/custom-api/v1/weather')
                        ),
                        'description' => 'Fixed route for weather endpoint'
                    ),
                    array(
                        'name' => 'city',
                        'in' => 'query',
                        'required' => true,
                        'schema' => array(
                            'type' => 'string'
                        ),
                        'description' => 'City name (e.g., Manila)'
                    )
                ),
                'responses' => array(
                    '200' => array(
                        'description' => 'Successful weather response',
                        'content' => array(
                            'application/json' => array(
                                'schema' => array(
                                    'type' => 'object',
                                    'properties' => array(
                                        'success' => array('type' => 'boolean'),
                                        'data' => array(
                                            'type' => 'object',
                                            'properties' => array(
                                                'location' => array(
                                                    'type' => 'object',
                                                    'properties' => array(
                                                        'city' => array('type' => 'string'),
                                                        'country' => array('type' => 'string')
                                                    )
                                                ),
                                                'weather' => array(
                                                    'type' => 'object',
                                                    'properties' => array(
                                                        'city' => array('type' => 'string'),
                                                        'temperature' => array('type' => 'number'),
                                                        'description' => array('type' => 'string'),
                                                        'humidity' => array('type' => 'integer'),
                                                        'wind_speed' => array('type' => 'number'),
                                                        'source' => array('type' => 'string')
                                                    ),
                                                    'required' => array('city', 'temperature', 'description')
                                                ),
                                                'timestamp' => array('type' => 'string', 'format' => 'date-time'),
                                                'source' => array('type' => 'string')
                                            )
                                        ),
                                        'meta' => array(
                                            'type' => 'object',
                                            'properties' => array(
                                                'endpoint' => array('type' => 'string'),
                                                'method' => array('type' => 'string'),
                                                'parameters' => array(
                                                    'type' => 'object',
                                                    'properties' => array(
                                                        'city' => array('type' => 'string'),
                                                        'country' => array('type' => 'string')
                                                    )
                                                )
                                            )
                                        )
                                    ),
                                    'required' => array('success', 'data')
                                )
                            )
                        )
                    )
                )
            )
        )
    )
);

// Output JSON
echo json_encode($openapi_spec, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
exit;
