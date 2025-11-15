/**
 * SecureSheets Client Library
 * Version: 1.0.0
 * 
 * A client-side JavaScript library for making secure, authenticated requests
 * to SecureSheets API (securesheets_lib.js v3.4.1+)
 * 
 * Dependencies: CryptoJS (for HMAC-SHA256)
 * - Include: https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js
 * 
 * Usage:
 * 1. Configure with SecureSheets.configure()
 * 2. Make requests with SecureSheets.makeRequest() or convenience methods
 */

(function(window) {
    'use strict';

    // ============================================
    // SECURESHEETS NAMESPACE
    // ============================================
    const SecureSheets = {
        version: '1.0.0',
        config: {
            scriptUrl: null,
            apiToken: null,
            hmacSecret: null,
            rateLimitEnabled: true,
            maxRequests: 100,
            enableCache: true,
            enforceHttps: true,
            debug: false,
            timeout: 30000
        },
        
        // Rate limiting
        requestCount: 0,
        requestWindow: Date.now(),
        
        // Cache
        cache: new Map()
    };

    // ============================================
    // CONFIGURATION
    // ============================================
    /**
     * Configure SecureSheets client
     * @param {Object} options - Configuration options
     * @param {string} options.scriptUrl - Google Apps Script Web App URL
     * @param {string} options.apiToken - API authentication token
     * @param {string} options.hmacSecret - HMAC secret key
     * @param {boolean} [options.rateLimitEnabled=true] - Enable client-side rate limiting
     * @param {number} [options.maxRequests=100] - Max requests per hour
     * @param {boolean} [options.enableCache=true] - Enable response caching
     * @param {boolean} [options.enforceHttps=true] - Enforce HTTPS
     * @param {boolean} [options.debug=false] - Enable debug logging
     * @param {number} [options.timeout=30000] - Request timeout in ms
     */
    SecureSheets.configure = function(options) {
        if (!options) {
            throw new Error('SecureSheets: Configuration options required');
        }

        // Required fields
        if (!options.scriptUrl) {
            throw new Error('SecureSheets: scriptUrl is required');
        }
        if (!options.apiToken) {
            throw new Error('SecureSheets: apiToken is required');
        }
        if (!options.hmacSecret) {
            throw new Error('SecureSheets: hmacSecret is required');
        }

        // HTTPS validation
        if (options.enforceHttps !== false && !options.scriptUrl.startsWith('https://')) {
            throw new Error('SecureSheets: scriptUrl must use HTTPS');
        }

        // Merge config
        Object.assign(SecureSheets.config, options);

        if (SecureSheets.config.debug) {
            console.log('SecureSheets: Configured successfully', {
                scriptUrl: SecureSheets.config.scriptUrl,
                version: SecureSheets.version
            });
        }

        return SecureSheets;
    };

    // ============================================
    // HMAC SIGNATURE GENERATION
    // ============================================
    /**
     * Compute HMAC-SHA256 signature
     * @param {string} message - Message to sign
     * @param {string} secret - Secret key
     * @returns {string} HMAC signature
     */
    SecureSheets.computeHMAC = function(message, secret) {
        if (typeof CryptoJS === 'undefined') {
            throw new Error('SecureSheets: CryptoJS required. Include https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js');
        }

        return CryptoJS.HmacSHA256(message, secret).toString();
    };

    /**
     * Create signature from parameters
     * @param {Object} params - Request parameters
     * @param {string} secret - HMAC secret
     * @returns {string} Generated signature
     */
    SecureSheets.createSignature = function(params, secret) {
        // Sort keys alphabetically
        const sortedKeys = Object.keys(params).sort();
        
        // Build signature string: key1=value1&key2=value2
        const signatureString = sortedKeys
            .map(key => `${key}=${params[key]}`)
            .join('&');

        if (SecureSheets.config.debug) {
            console.log('SecureSheets: Signature string:', signatureString);
        }

        return SecureSheets.computeHMAC(signatureString, secret);
    };

    // ============================================
    // RATE LIMITING
    // ============================================
    /**
     * Check client-side rate limit
     * @returns {boolean} True if within limits
     */
    SecureSheets.checkRateLimit = function() {
        if (!SecureSheets.config.rateLimitEnabled) {
            return true;
        }

        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        // Reset if window passed
        if (now - SecureSheets.requestWindow > oneHour) {
            SecureSheets.requestCount = 0;
            SecureSheets.requestWindow = now;
        }

        // Check limit
        if (SecureSheets.requestCount >= SecureSheets.config.maxRequests) {
            const resetTime = new Date(SecureSheets.requestWindow + oneHour);
            throw new Error(`Rate limit exceeded. Resets at ${resetTime.toLocaleTimeString()}`);
        }

        SecureSheets.requestCount++;
        return true;
    };

    // ============================================
    // CACHING
    // ============================================
    /**
     * Get cached response
     * @param {string} key - Cache key
     * @returns {Object|null} Cached data or null
     */
    SecureSheets.getCached = function(key) {
        if (!SecureSheets.config.enableCache) {
            return null;
        }

        const cached = SecureSheets.cache.get(key);
        if (!cached) return null;

        // Check expiration
        if (Date.now() > cached.expires) {
            SecureSheets.cache.delete(key);
            return null;
        }

        if (SecureSheets.config.debug) {
            console.log('SecureSheets: Cache hit:', key);
        }

        return { ...cached.data, fromCache: true };
    };

    /**
     * Set cached response
     * @param {string} key - Cache key
     * @param {Object} data - Data to cache
     * @param {number} ttl - Time to live in seconds
     */
    SecureSheets.setCached = function(key, data, ttl = 300) {
        if (!SecureSheets.config.enableCache) {
            return;
        }

        SecureSheets.cache.set(key, {
            data: data,
            expires: Date.now() + (ttl * 1000)
        });
    };

    // ============================================
    // MAIN REQUEST METHOD
    // ============================================
    /**
     * Make authenticated API request
     * @param {Object} params - Request parameters
     * @param {Object} [options] - Additional options
     * @param {boolean} [options.useCache=true] - Use caching
     * @param {number} [options.cacheTTL=300] - Cache TTL in seconds
     * @param {Object} [options.headers] - Additional headers
     * @returns {Promise<Object>} API response
     */
    SecureSheets.makeRequest = async function(params, options = {}) {
        // Validate config
        if (!SecureSheets.config.scriptUrl || !SecureSheets.config.apiToken || !SecureSheets.config.hmacSecret) {
            throw new Error('SecureSheets: Not configured. Call configure() first.');
        }

        // Validate params
        if (!params || typeof params !== 'object') {
            throw new Error('SecureSheets: Parameters must be an object');
        }

        try {
            // Check rate limit
            SecureSheets.checkRateLimit();

            // Clone params
            const requestParams = { ...params };

            // Add auth and metadata
            requestParams.token = SecureSheets.config.apiToken;
            requestParams.timestamp = Date.now().toString();
            requestParams.referrer = window.location.origin;
            requestParams.origin = window.location.origin;

            // Check cache (for GET requests)
            if (options.useCache !== false && !requestParams.action) {
                const cacheKey = JSON.stringify(requestParams);
                const cached = SecureSheets.getCached(cacheKey);
                if (cached) return cached;
            }

            // Generate HMAC signature
            requestParams.signature = SecureSheets.createSignature(requestParams, SecureSheets.config.hmacSecret);

            // Build URL
            const url = new URL(SecureSheets.config.scriptUrl);
            Object.keys(requestParams).forEach(key => {
                url.searchParams.append(key, requestParams[key]);
            });

            if (SecureSheets.config.debug) {
                console.log('SecureSheets: Request URL:', url.toString());
            }

            // Setup fetch
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), SecureSheets.config.timeout);

            const fetchOptions = {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    ...options.headers
                },
                signal: controller.signal
            };

            // Make request
            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);

            // Check HTTP status
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Parse response
            const data = await response.json();

            if (SecureSheets.config.debug) {
                console.log('SecureSheets: Response:', data);
            }

            // Cache successful responses
            if (data.success && options.useCache !== false) {
                const cacheKey = JSON.stringify(requestParams);
                SecureSheets.setCached(cacheKey, data, options.cacheTTL);
            }

            return data;

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('SecureSheets: Request timeout');
            }
            
            console.error('SecureSheets: Request error:', error);
            throw error;
        }
    };

    // ============================================
    // PUBLIC ENDPOINT METHODS (No Auth)
    // ============================================

    /**
     * Get scrolling messages (public endpoint)
     * @param {Object} [options] - Request options
     * @returns {Promise<Object>} Scrolling messages
     */
    SecureSheets.getScrollingMessages = async function(options = {}) {
        const url = new URL(SecureSheets.config.scriptUrl);
        url.searchParams.append('type', 'scrolling');
        
        if (options.callback) {
            url.searchParams.append('callback', options.callback);
        }

        const cached = SecureSheets.getCached('scrolling');
        if (cached && options.useCache !== false) return cached;

        const response = await fetch(url);
        const data = await response.json();

        if (options.useCache !== false) {
            SecureSheets.setCached('scrolling', data, 300);
        }

        return data;
    };

    /**
     * Get doodle events (public endpoint)
     * @param {Object} [options] - Request options
     * @returns {Promise<Object>} Doodle events
     */
    SecureSheets.getDoodleEvents = async function(options = {}) {
        const url = new URL(SecureSheets.config.scriptUrl);
        url.searchParams.append('type', 'doodle');
        
        if (options.callback) {
            url.searchParams.append('callback', options.callback);
        }

        const cached = SecureSheets.getCached('doodle');
        if (cached && options.useCache !== false) return cached;

        const response = await fetch(url);
        const data = await response.json();

        if (options.useCache !== false) {
            SecureSheets.setCached('doodle', data, 300);
        }

        return data;
    };

    /**
     * Get modal content (public endpoint)
     * @param {string} sheet - Sheet name (Sheet5 or Sheet6)
     * @param {string} range - Cell range (e.g., 'B37' or 'B37:D44')
     * @param {Object} [options] - Request options
     * @returns {Promise<Object>} Modal content
     */
    SecureSheets.getModalContent = async function(sheet, range, options = {}) {
        const url = new URL(SecureSheets.config.scriptUrl);
        url.searchParams.append('type', 'modal');
        url.searchParams.append('sheet', sheet);
        url.searchParams.append('range', range);
        
        if (options.callback) {
            url.searchParams.append('callback', options.callback);
        }

        const response = await fetch(url);
        return await response.json();
    };

    /**
     * Get batch data (public endpoint)
     * @param {Array<string>} requests - Request types ['scrolling', 'doodle']
     * @param {Object} [options] - Request options
     * @returns {Promise<Object>} Batch results
     */
    SecureSheets.getBatch = async function(requests, options = {}) {
        const url = new URL(SecureSheets.config.scriptUrl);
        url.searchParams.append('type', 'batch');
        url.searchParams.append('requests', requests.join(','));
        
        if (options.callback) {
            url.searchParams.append('callback', options.callback);
        }

        const response = await fetch(url);
        return await response.json();
    };

    // ============================================
    // PROTECTED ENDPOINT METHODS (Auth Required)
    // ============================================

    /**
     * Get sheet data (protected endpoint)
     * @param {string} [sheet] - Sheet name (default: Sheet4)
     * @param {Object} [options] - Additional options
     * @param {boolean} [options.encrypt=false] - Encrypt response
     * @returns {Promise<Object>} Sheet data
     */
    SecureSheets.getData = async function(sheet, options = {}) {
        const params = {
            action: 'getData'
        };

        if (sheet) {
            params.sheet = sheet;
        }

        if (options.encrypt) {
            params.encrypt = 'true';
        }

        return SecureSheets.makeRequest(params, options);
    };

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Check API health
     * @returns {Promise<Object>} Health status
     */
    SecureSheets.healthCheck = async function() {
        try {
            const response = await fetch(SecureSheets.config.scriptUrl);
            return await response.json();
        } catch (error) {
            throw new Error('SecureSheets: Health check failed - ' + error.message);
        }
    };

    /**
     * Get current configuration (without sensitive data)
     * @returns {Object} Public config
     */
    SecureSheets.getConfig = function() {
        return {
            scriptUrl: SecureSheets.config.scriptUrl,
            rateLimitEnabled: SecureSheets.config.rateLimitEnabled,
            maxRequests: SecureSheets.config.maxRequests,
            enableCache: SecureSheets.config.enableCache,
            enforceHttps: SecureSheets.config.enforceHttps,
            debug: SecureSheets.config.debug,
            version: SecureSheets.version
        };
    };

    /**
     * Reset rate limit counter
     */
    SecureSheets.resetRateLimit = function() {
        SecureSheets.requestCount = 0;
        SecureSheets.requestWindow = Date.now();
        
        if (SecureSheets.config.debug) {
            console.log('SecureSheets: Rate limit reset');
        }
    };

    /**
     * Get rate limit status
     * @returns {Object} Rate limit info
     */
    SecureSheets.getRateLimitStatus = function() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const resetTime = new Date(SecureSheets.requestWindow + oneHour);
        
        return {
            enabled: SecureSheets.config.rateLimitEnabled,
            currentRequests: SecureSheets.requestCount,
            maxRequests: SecureSheets.config.maxRequests,
            remaining: Math.max(0, SecureSheets.config.maxRequests - SecureSheets.requestCount),
            resetsAt: resetTime.toISOString(),
            resetsIn: Math.max(0, resetTime - now)
        };
    };

    /**
     * Clear cache
     * @param {string} [key] - Specific key to clear (clears all if omitted)
     */
    SecureSheets.clearCache = function(key) {
        if (key) {
            SecureSheets.cache.delete(key);
        } else {
            SecureSheets.cache.clear();
        }
        
        if (SecureSheets.config.debug) {
            console.log('SecureSheets: Cache cleared' + (key ? ` (${key})` : ' (all)'));
        }
    };

    /**
     * Decrypt data received from server
     * @param {string} encryptedData - Base64 encoded encrypted data
     * @param {string} key - Encryption key (32 chars)
     * @returns {Object} Decrypted data
     */
    SecureSheets.decryptData = function(encryptedData, key) {
        try {
            // Decode base64
            const decoded = atob(encryptedData);
            
            // XOR decrypt
            let decrypted = '';
            for (let i = 0; i < decoded.length; i++) {
                decrypted += String.fromCharCode(
                    decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
                );
            }
            
            return JSON.parse(decrypted);
        } catch (error) {
            throw new Error('SecureSheets: Decryption failed - ' + error.message);
        }
    };

    // ============================================
    // EXPORT
    // ============================================
    window.SecureSheets = SecureSheets;

    // AMD/CommonJS compatibility
    if (typeof define === 'function' && define.amd) {
        define([], function() { return SecureSheets; });
    } else if (typeof module === 'object' && module.exports) {
        module.exports = SecureSheets;
    }

    // Log initialization
    console.log(`SecureSheets Client v${SecureSheets.version} loaded`);

})(window);