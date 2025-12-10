/**
 * ============================================================================
 * SECURESHEETS CLIENT LIBRARY v1.3.0
 * Compatible with SecureSheets Server v3.9.0
 * ============================================================================
 * 
 * A secure JavaScript client for interacting with SecureSheets API
 * 
 * NEW IN v1.3.0 (Server v3.9.0 Compatibility):
 * - Cell-based data access support (B4, B7 allowed cells)
 * - Enhanced origin validation for exact matching
 * - Updated endpoint structure
 * - Improved error code handling
 * - Support for new security features
 * - Multi-sheet batch operations
 * - Enhanced protection system awareness
 * 
 * Dependencies:
 * - CryptoJS (for HMAC-SHA256): 
 *   https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js
 * 
 * @author SecureSheets Team
 * @version 1.3.0
 * @license MIT
 * ============================================================================
 */

(function(window) {
    'use strict';

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

    console.log(`SecureSheets Client v${SecureSheets.version} loaded (Server v${SecureSheets.serverVersion})`);

})(window);

/**
 * ============================================================================
 * USAGE EXAMPLES FOR v1.3.0 (Server v3.9.0)
 * ============================================================================
 * 
 * 1. BASIC SETUP
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * // Configure with origin for exact domain validation
 * SecureSheets.configure({
 *   scriptUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
 *   apiToken: 'your-api-token',
 *   hmacSecret: 'your-hmac-secret',
 *   origin: window.location.origin, // Required for v3.9.0
 *   debug: true
 * });
 * 
 * 
 * 2. AUTO-DISCOVERY SETUP (Recommended)
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * await SecureSheets.configureWithDiscovery({
 *   scriptUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
 *   apiToken: 'your-api-token',
 *   hmacSecret: 'your-hmac-secret',
 *   origin: window.location.origin
 * });
 * 
 * 
 * 3. PUBLIC ENDPOINTS (Domain Validation Required)
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * // Health check
 * const health = await SecureSheets.healthCheck();
 * console.log('Server:', health.status); // 'healthy' or 'online'
 * 
 * // Server configuration
 * const config = await SecureSheets.getServerConfig();
 * console.log('Version:', config.version); // '3.9.0'
 * console.log('Features:', config.features);
 * 
 * // Scrolling messages (Sheet3, rows 1-90)
 * const messages = await SecureSheets.getScrollingMessages();
 * console.log('Messages:', messages.data);
 * 
 * // Doodle events (Sheet3, rows 100+)
 * const doodles = await SecureSheets.getDoodleEvents();
 * console.log('Doodles:', doodles.data);
 * 
 * // Modal content (Sheet5 or Sheet6)
 * const modal = await SecureSheets.getModalContent('Sheet5', 'B37');
 * console.log('Modal:', modal.data);
 * 
 * // Batch request
 * const batch = await SecureSheets.getBatch(['scrolling', 'doodle']);
 * console.log('Batch:', batch.results);
 * 
 * 
 * 4. PROTECTED ENDPOINTS (HMAC Required)
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * // Get single sheet (Sheet2, Sheet4)
 * const sheet2 = await SecureSheets.getData('Sheet2');
 * console.log('Sheet2 data:', sheet2.data);
 * 
 * // Get multiple sheets
 * const multiSheet = await SecureSheets.getData(['Sheet2', 'Sheet4']);
 * console.log('Multi-sheet:', multiSheet.sheets);
 * 
 * // Get cell data (B4 or B7 only - allowed in v3.9.0)
 * const cellB4 = await SecureSheets.getCellData('B4');
 * console.log('Cell B4:', cellB4.data);
 * console.log('Token:', cellB4.token);
 * console.log('Signature:', cellB4.signature);
 * 
 * const cellB7 = await SecureSheets.getCellData('B7');
 * console.log('Cell B7:', cellB7.data);
 * 
 * 
 * 5. NEW v3.9.0 FEATURES
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * // Check server features
 * if (SecureSheets.hasFeature('cellBasedAccess')) {
 *   console.log('Cell-based access supported');
 *   const apiToken = await SecureSheets.getCellData('B4');
 *   const hmacSecret = await SecureSheets.getCellData('B7');
 * }
 * 
 * if (SecureSheets.hasFeature('ipFiltering')) {
 *   console.log('IP filtering enabled');
 * }
 * 
 * if (SecureSheets.hasFeature('csrfProtection')) {
 *   console.log('CSRF protection active');
 * }
 * 
 * // Check allowed cells
 * const serverInfo = SecureSheets.getServerInfo();
 * console.log('Allowed cells:', serverInfo.security.allowedDataCells);
 * // Output: ['B4', 'B7']
 * 
 * 
 * 6. SHEET PROTECTION AWARENESS
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * // v3.9.0 has strict sheet whitelisting
 * // Accessible sheets:
 * // - Public (domain validation): Sheet3, Sheet5, Sheet6
 * // - Protected (HMAC): Sheet2, Sheet4
 * // - Blocked (never accessible): Sheet1, Sheet7, ReadMe, SecurityLogs
 * 
 * try {
 *   // This will work (Sheet2 is protected, requires HMAC)
 *   const data = await SecureSheets.getData('Sheet2');
 *   
 *   // This will fail (Sheet1 is blocked)
 *   const blocked = await SecureSheets.getData('Sheet1');
 * } catch (error) {
 *   console.error('Error:', error.code); // ERR_SEC_003
 * }
 * 
 * 
 * 7. ERROR HANDLING (v3.9.0 Error Codes)
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * try {
 *   const data = await SecureSheets.getData('Sheet2');
 * } catch (error) {
 *   const formatted = SecureSheets.formatError(error);
 *   
 *   switch (error.code) {
 *     case 'ERR_AUTH_001':
 *       console.log('Authentication failed');
 *       break;
 *     case 'ERR_AUTH_002':
 *       console.log('Domain not authorized');
 *       break;
 *     case 'ERR_AUTH_005':
 *       console.log('Invalid signature');
 *       break;
 *     case 'ERR_AUTH_006':
 *       console.log('CSRF validation failed');
 *       break;
 *     case 'ERR_RATE_001':
 *       console.log('Rate limit exceeded');
 *       break;
 *     case 'ERR_SEC_003':
 *       console.log('Access denied to sheet');
 *       break;
 *     default:
 *       console.log('Error:', formatted.message);
 *   }
 * }
 * 
 * 
 * 8. CONNECTION TESTING
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * const testResults = await SecureSheets.testConnection();
 * 
 * if (testResults.success) {
 *   console.log('✅ All tests passed!');
 *   console.log('Server version:', testResults.server.version);
 *   console.log('Health:', testResults.tests.health.passed);
 *   console.log('Config:', testResults.tests.config.passed);
 *   console.log('Auth:', testResults.tests.auth.passed);
 * } else {
 *   console.error('❌ Connection test failed');
 *   console.error('Tests:', testResults.tests);
 * }
 * 
 * 
 * 9. COMPLETE DASHBOARD EXAMPLE
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * async function loadDashboard() {
 *   try {
 *     // Configure
 *     await SecureSheets.configureWithDiscovery({
 *       scriptUrl: 'https://script.google.com/macros/s/YOUR_ID/exec',
 *       apiToken: 'your-token',
 *       hmacSecret: 'your-secret',
 *       origin: window.location.origin
 *     });
 *     
 *     // Test connection
 *     const test = await SecureSheets.testConnection();
 *     if (!test.success) throw new Error('Connection failed');
 *     
 *     // Load public data (parallel)
 *     const [messages, doodles, modal] = await Promise.all([
 *       SecureSheets.getScrollingMessages(),
 *       SecureSheets.getDoodleEvents(),
 *       SecureSheets.getModalContent('Sheet5', 'B37')
 *     ]);
 *     
 *     // Load protected data
 *     const sheets = await SecureSheets.getData(['Sheet2', 'Sheet4']);
 *     
 *     // Display data
 *     displayMessages(messages.data);
 *     displayDoodles(doodles.data);
 *     displayModal(modal.data);
 *     displaySheets(sheets.sheets);
 *     
 *     console.log('✅ Dashboard loaded');
 *     
 *   } catch (error) {
 *     console.error('Dashboard error:', error);
 *     const formatted = SecureSheets.formatError(error);
 *     showError(formatted.message);
 *   }
 * }
 * 
 * 
 * 10. HTML INTEGRATION
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * <!DOCTYPE html>
 * <html>
 * <head>
 *   <title>SecureSheets v1.3.0 Demo</title>
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
 *   <script src="securesheets_v1_3_0.js"></script>
 * </head>
 * <body>
 *   <h1>SecureSheets Dashboard (v3.9.0)</h1>
 *   <div id="status"></div>
 *   <div id="data"></div>
 *   
 *   <script>
 *     (async () => {
 *       try {
 *         await SecureSheets.configureWithDiscovery({
 *           scriptUrl: 'https://script.google.com/macros/s/YOUR_ID/exec',
 *           apiToken: 'your-token',
 *           hmacSecret: 'your-secret',
 *           origin: window.location.origin
 *         });
 *         
 *         const test = await SecureSheets.testConnection();
 *         document.getElementById('status').textContent = 
 *           test.success ? '✅ Connected to v3.9.0' : '❌ Failed';
 *         
 *         const data = await SecureSheets.getData('Sheet2');
 *         document.getElementById('data').innerHTML = 
 *           '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
 *           
 *       } catch (error) {
 *         document.getElementById('status').textContent = 
 *           '❌ ' + error.message;
 *       }
 *     })();
 *   </script>
 * </body>
 * </html>
 * 
 * 
 * ============================================================================
 * KEY CHANGES IN v1.3.0 FOR SERVER v3.9.0
 * ============================================================================
 * 
 * ✅ ORIGIN PARAMETER REQUIRED
 *    - Must provide window.location.origin for domain validation
 *    - Server performs exact origin matching
 * 
 * ✅ CELL-BASED DATA ACCESS
 *    - New getCellData() method for B4 and B7
 *    - Returns data with HMAC token and signature
 *    - Only these cells are accessible via API
 * 
 * ✅ ENHANCED SHEET PROTECTION
 *    - Strict whitelist: Only 9 sheets allowed
 *    - Blocked sheets return ERR_SEC_003
 *    - Public sheets: Sheet3, Sheet5, Sheet6
 *    - Protected sheets: Sheet2, Sheet4
 * 
 * ✅ IMPROVED ERROR CODES
 *    - ERR_AUTH_001 through ERR_AUTH_006
 *    - ERR_SEC_001 through ERR_SEC_004
 *    - ERR_RATE_001, ERR_VAL_001-005
 *    - Better error messages
 * 
 * ✅ SIGNATURE GENERATION
 *    - Sorted parameter keys for consistency
 *    - Includes all request parameters
 *    - Server validates with constant-time comparison
 * 
 * ✅ HEALTH CHECK UPDATED
 *    - Returns 'healthy' status (v3.9.0 format)
 *    - Includes initialization check
 *    - Service name: 'SecureSheets API'
 * 
 * ✅ SERVER INFO FEATURES
 *    - Features object restructured
 *    - allowedDataCells in security section
 *    - modalSheets array available
 * 
 * ============================================================================
 * COMPATIBILITY NOTES
 * ============================================================================
 * 
 * Client v1.3.0 ↔ Server Compatibility:
 * 
 * Server v3.9.0   ✅ Full compatibility (all features)
 * Server v3.7-3.8 ⚠️  Partial (no cell-based access)
 * Server v3.6     ⚠️  Limited (basic features only)
 * Server v3.0-3.5 ❌ Not compatible
 * 
 * Recommended: Server v3.9.0 for full feature set
 * 
 * ============================================================================
 * SECURITY REMINDERS
 * ============================================================================
 * 
 * 1. Always set origin parameter to window.location.origin
 * 2. Never expose apiToken or hmacSecret in public code
 * 3. Use environment variables for credentials
 * 4. Enable CSRF protection for POST requests
 * 5. Only B4 and B7 cells are accessible via cellData
 * 6. Sheet1, Sheet7, ReadMe, SecurityLogs are NEVER accessible
 * 7. Test connection before production deployment
 * 8. Monitor SecurityLogs sheet for security events
 * 9. Respect rate limits (100/hour default)
 * 10. Use HTTPS only in production
 * 
 * ============================================================================
 * END OF SECURESHEETS CLIENT v1.3.0
 * ============================================================================
 */
    // CORE OBJECT
    // ============================================
    const SecureSheets = {
        version: '1.3.0',
        serverVersion: '3.9.0',
        config: {
            scriptUrl: '',
            apiToken: '',
            hmacSecret: '',
            origin: '',
            enableCSRF: true,
            enableNonce: true,
            rateLimitEnabled: true,
            maxRequests: 100,
            cacheTimeout: 300000, // 5 minutes
            debug: false
        },
        serverInfo: null,
        cache: new Map(),
        requestCount: 0,
        requestWindow: Date.now(),
        csrfToken: null,
        csrfExpiry: null,
        usedNonces: new Set()
    };

    // ============================================
    // CONFIGURATION METHODS
    // ============================================

    /**
     * Configure the SecureSheets client
     * @param {Object} options - Configuration options
     */
    SecureSheets.configure = function(options) {
        if (options.scriptUrl) SecureSheets.config.scriptUrl = options.scriptUrl;
        if (options.apiToken) SecureSheets.config.apiToken = options.apiToken;
        if (options.hmacSecret) SecureSheets.config.hmacSecret = options.hmacSecret;
        if (options.origin) SecureSheets.config.origin = options.origin;
        if (typeof options.enableCSRF === 'boolean') SecureSheets.config.enableCSRF = options.enableCSRF;
        if (typeof options.enableNonce === 'boolean') SecureSheets.config.enableNonce = options.enableNonce;
        if (typeof options.rateLimitEnabled === 'boolean') SecureSheets.config.rateLimitEnabled = options.rateLimitEnabled;
        if (options.maxRequests) SecureSheets.config.maxRequests = options.maxRequests;
        if (options.cacheTimeout) SecureSheets.config.cacheTimeout = options.cacheTimeout;
        if (typeof options.debug === 'boolean') SecureSheets.config.debug = options.debug;

        if (SecureSheets.config.debug) {
            console.log('SecureSheets v1.3.0: Configured for Server v3.9.0', {
                scriptUrl: SecureSheets.config.scriptUrl,
                origin: SecureSheets.config.origin,
                enableCSRF: SecureSheets.config.enableCSRF,
                enableNonce: SecureSheets.config.enableNonce
            });
        }
    };

    /**
     * Configure with auto-discovery
     * @param {Object} options - Configuration options
     * @returns {Promise<Object>} Server configuration
     */
    SecureSheets.configureWithDiscovery = async function(options) {
        SecureSheets.configure(options);

        try {
            const serverConfig = await SecureSheets.getServerConfig();
            SecureSheets.serverInfo = serverConfig;

            if (SecureSheets.config.debug) {
                console.log('SecureSheets: Auto-discovery complete', serverConfig);
            }

            return serverConfig;
        } catch (error) {
            console.warn('SecureSheets: Auto-discovery failed', error);
            return null;
        }
    };

    /**
     * Get current configuration
     * @returns {Object} Current configuration
     */
    SecureSheets.getConfig = function() {
        return { ...SecureSheets.config };
    };

    /**
     * Check if library is configured
     * @returns {boolean} Configuration status
     */
    SecureSheets.isConfigured = function() {
        return !!(SecureSheets.config.scriptUrl && 
                  SecureSheets.config.apiToken && 
                  SecureSheets.config.hmacSecret);
    };

    /**
     * Enable debug mode
     * @param {boolean} [enable=true] - Enable or disable debug mode
     */
    SecureSheets.setDebug = function(enable = true) {
        SecureSheets.config.debug = enable;
        console.log('SecureSheets: Debug mode ' + (enable ? 'enabled' : 'disabled'));
    };

    /**
     * Get library version
     * @returns {string} Version number
     */
    SecureSheets.getVersion = function() {
        return SecureSheets.version;
    };

    // ============================================
    // SERVER INFO METHODS
    // ============================================

    /**
     * Get server information
     * @returns {Object|null} Server information
     */
    SecureSheets.getServerInfo = function() {
        return SecureSheets.serverInfo;
    };

    /**
     * Check if server has a specific feature
     * @param {string} featureName - Feature name
     * @returns {boolean} Feature availability
     */
    SecureSheets.hasFeature = function(featureName) {
        if (!SecureSheets.serverInfo || !SecureSheets.serverInfo.features) {
            return false;
        }
        
        // Check in core features
        if (SecureSheets.serverInfo.features.core && 
            SecureSheets.serverInfo.features.core.includes(featureName)) {
            return true;
        }
        
        // Check in flat features object (v3.9.0 format)
        return SecureSheets.serverInfo.features[featureName] === true;
    };

    /**
     * Get server configuration from API
     * @returns {Promise<Object>} Server configuration
     */
    SecureSheets.getServerConfig = async function() {
        const params = new URLSearchParams({
            action: 'config'
        });
        
        if (SecureSheets.config.origin) {
            params.append('origin', SecureSheets.config.origin);
        }
        
        const url = SecureSheets.config.scriptUrl + '?' + params.toString();
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch server config: ' + response.statusText);
        }

        return await response.json();
    };

    // ============================================
    // AUTHENTICATION METHODS
    // ============================================

    /**
     * Generate HMAC signature
     * @param {string} message - Message to sign
     * @param {string} secret - Secret key
     * @returns {string} HMAC signature
     */
    SecureSheets.computeHMAC = function(message, secret) {
        if (typeof CryptoJS === 'undefined') {
            throw new Error('SecureSheets: CryptoJS required. Include: https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js');
        }

        const hmac = CryptoJS.HmacSHA256(message, secret);
        return CryptoJS.enc.Hex.stringify(hmac);
    };

    /**
     * Generate request signature for v3.9.0
     * @param {Object} params - Request parameters
     * @returns {string} Signature
     */
    SecureSheets.generateSignature = function(params) {
        const sortedKeys = Object.keys(params).sort();
        const signatureString = sortedKeys
            .map(key => key + '=' + String(params[key] || ''))
            .join('&');
        
        return SecureSheets.computeHMAC(signatureString, SecureSheets.config.hmacSecret);
    };

    /**
     * Generate nonce
     * @returns {string} Nonce
     */
    SecureSheets.generateNonce = function() {
        if (!SecureSheets.config.enableNonce) {
            return null;
        }

        let nonce;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            nonce = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
            attempts++;
        } while (SecureSheets.usedNonces.has(nonce) && attempts < maxAttempts);

        if (attempts >= maxAttempts) {
            throw new Error('SecureSheets: Failed to generate unique nonce');
        }

        SecureSheets.usedNonces.add(nonce);

        if (SecureSheets.usedNonces.size > 1000) {
            const firstNonce = SecureSheets.usedNonces.values().next().value;
            SecureSheets.usedNonces.delete(firstNonce);
        }

        return nonce;
    };

    /**
     * Get CSRF token
     * @returns {string} CSRF token
     */
    SecureSheets.getCSRFToken = function() {
        if (!SecureSheets.config.enableCSRF) {
            return null;
        }

        const now = Date.now();

        if (SecureSheets.csrfToken && SecureSheets.csrfExpiry && now < SecureSheets.csrfExpiry) {
            return SecureSheets.csrfToken;
        }

        const token = 'csrf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
        SecureSheets.csrfToken = token;
        SecureSheets.csrfExpiry = now + (30 * 60 * 1000);

        if (SecureSheets.config.debug) {
            console.log('SecureSheets: Generated new CSRF token');
        }

        return token;
    };

    /**
     * Clear CSRF token cache
     */
    SecureSheets.clearCSRFToken = function() {
        SecureSheets.csrfToken = null;
        SecureSheets.csrfExpiry = null;
    };

    // ============================================
    // RATE LIMITING
    // ============================================

    /**
     * Check rate limit
     * @returns {boolean} True if within rate limit
     */
    SecureSheets.checkRateLimit = function() {
        if (!SecureSheets.config.rateLimitEnabled) {
            return true;
        }

        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        if (now - SecureSheets.requestWindow > oneHour) {
            SecureSheets.requestCount = 0;
            SecureSheets.requestWindow = now;
        }

        if (SecureSheets.requestCount >= SecureSheets.config.maxRequests) {
            const resetTime = new Date(SecureSheets.requestWindow + oneHour);
            throw new Error(`SecureSheets: Rate limit exceeded. Resets at ${resetTime.toISOString()}`);
        }

        SecureSheets.requestCount++;
        return true;
    };

    /**
     * Reset rate limit counter
     */
    SecureSheets.resetRateLimit = function() {
        SecureSheets.requestCount = 0;
        SecureSheets.requestWindow = Date.now();
    };

    /**
     * Get rate limit status
     * @returns {Object} Rate limit information
     */
    SecureSheets.getRateLimitStatus = function() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const resetTime = new Date(SecureSheets.requestWindow + oneHour);
        
        return {
            client: {
                enabled: SecureSheets.config.rateLimitEnabled,
                currentRequests: SecureSheets.requestCount,
                maxRequests: SecureSheets.config.maxRequests,
                remaining: Math.max(0, SecureSheets.config.maxRequests - SecureSheets.requestCount),
                resetsAt: resetTime.toISOString(),
                resetsIn: Math.max(0, resetTime - now)
            },
            server: SecureSheets.serverInfo && SecureSheets.serverInfo.limits ? {
                remaining: SecureSheets.serverInfo.limits.remaining || null,
                resetsAt: SecureSheets.serverInfo.limits.resetsAt || null
            } : {
                remaining: null,
                resetsAt: null
            }
        };
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
        const cached = SecureSheets.cache.get(key);
        
        if (!cached) {
            return null;
        }

        const now = Date.now();
        if (now > cached.expiry) {
            SecureSheets.cache.delete(key);
            return null;
        }

        if (SecureSheets.config.debug) {
            console.log('SecureSheets: Cache hit for', key);
        }

        return cached.data;
    };

    /**
     * Set cached response
     * @param {string} key - Cache key
     * @param {Object} data - Data to cache
     */
    SecureSheets.setCached = function(key, data) {
        SecureSheets.cache.set(key, {
            data: data,
            expiry: Date.now() + SecureSheets.config.cacheTimeout
        });
    };

    /**
     * Clear cache
     * @param {string} [key] - Specific key to clear
     */
    SecureSheets.clearCache = function(key) {
        if (key) {
            SecureSheets.cache.delete(key);
        } else {
            SecureSheets.cache.clear();
        }
    };

    // ============================================
    // HTTP REQUEST METHODS
    // ============================================

    /**
     * Build URL with parameters
     * @private
     */
    function buildUrl(params) {
        const queryParams = new URLSearchParams();
        
        for (const key in params) {
            if (params.hasOwnProperty(key) && params[key] !== null && params[key] !== undefined) {
                queryParams.append(key, params[key]);
            }
        }
        
        return SecureSheets.config.scriptUrl + '?' + queryParams.toString();
    }

    /**
     * Make authenticated GET request
     * @param {Object} params - Request parameters
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Response data
     */
    SecureSheets.makeRequest = async function(params = {}, options = {}) {
        SecureSheets.checkRateLimit();

        // Add token
        params.token = SecureSheets.config.apiToken;
        
        // Add origin if configured
        if (SecureSheets.config.origin) {
            params.origin = SecureSheets.config.origin;
        }
        
        // Add timestamp
        params.timestamp = new Date().toISOString();

        // Check cache
        if (options.useCache !== false) {
            const cacheKey = JSON.stringify(params);
            const cached = SecureSheets.getCached(cacheKey);
            if (cached) {
                return cached;
            }
        }

        // Generate signature
        params.signature = SecureSheets.generateSignature(params);

        const url = buildUrl(params);

        if (SecureSheets.config.debug) {
            console.log('SecureSheets: Making request', params);
        }

        const response = await fetch(url);

        if (!response.ok) {
            return await SecureSheets.handleErrorResponse(response);
        }

        const data = await response.json();

        // Cache response
        if (options.useCache !== false) {
            const cacheKey = JSON.stringify(params);
            SecureSheets.setCached(cacheKey, data);
        }

        return data;
    };

    /**
     * Make authenticated POST request
     * @param {Object} body - Request body
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Response data
     */
    SecureSheets.makePostRequest = async function(body = {}, options = {}) {
        SecureSheets.checkRateLimit();

        // Add authentication
        body.token = SecureSheets.config.apiToken;
        
        if (SecureSheets.config.origin) {
            body.origin = SecureSheets.config.origin;
        }
        
        body.timestamp = new Date().toISOString();

        // Add CSRF token if enabled
        if (SecureSheets.config.enableCSRF) {
            body['csrf-token'] = SecureSheets.getCSRFToken();
        }

        // Generate signature
        body.signature = SecureSheets.generateSignature(body);

        if (SecureSheets.config.debug) {
            console.log('SecureSheets: Making POST request', body);
        }

        const response = await fetch(SecureSheets.config.scriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            return await SecureSheets.handleErrorResponse(response);
        }

        return await response.json();
    };

    // ============================================
    // PUBLIC API METHODS (NO AUTH)
    // ============================================

    /**
     * Health check endpoint
     * @returns {Promise<Object>} Health status
     */
    SecureSheets.healthCheck = async function() {
        const url = SecureSheets.config.scriptUrl + '?action=health';
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Health check failed: ' + response.statusText);
        }

        return await response.json();
    };

    /**
     * Get scrolling messages
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Scrolling messages data
     */
    SecureSheets.getScrollingMessages = async function(options = {}) {
        const params = {
            action: 'scrolling'
        };
        
        if (SecureSheets.config.origin) {
            params.origin = SecureSheets.config.origin;
        }
        
        const cacheKey = 'scrolling';
        
        if (options.useCache !== false) {
            const cached = SecureSheets.getCached(cacheKey);
            if (cached) return cached;
        }

        const url = buildUrl(params);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch scrolling messages: ' + response.statusText);
        }

        const data = await response.json();

        if (options.useCache !== false) {
            SecureSheets.setCached(cacheKey, data);
        }

        return data;
    };

    /**
     * Get doodle events
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Doodle events data
     */
    SecureSheets.getDoodleEvents = async function(options = {}) {
        const params = {
            action: 'doodle'
        };
        
        if (SecureSheets.config.origin) {
            params.origin = SecureSheets.config.origin;
        }
        
        const cacheKey = 'doodle';
        
        if (options.useCache !== false) {
            const cached = SecureSheets.getCached(cacheKey);
            if (cached) return cached;
        }

        const url = buildUrl(params);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch doodle events: ' + response.statusText);
        }

        const data = await response.json();

        if (options.useCache !== false) {
            SecureSheets.setCached(cacheKey, data);
        }

        return data;
    };

    /**
     * Get modal content
     * @param {string} sheet - Sheet name (Sheet5 or Sheet6)
     * @param {string} cell - Cell reference
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Modal content data
     */
    SecureSheets.getModalContent = async function(sheet, cell, options = {}) {
        const params = {
            action: 'modal',
            sheet: sheet,
            cell: cell
        };
        
        if (SecureSheets.config.origin) {
            params.origin = SecureSheets.config.origin;
        }
        
        const cacheKey = `modal:${sheet}:${cell}`;
        
        if (options.useCache !== false) {
            const cached = SecureSheets.getCached(cacheKey);
            if (cached) return cached;
        }

        const url = buildUrl(params);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch modal content: ' + response.statusText);
        }

        const data = await response.json();

        if (options.useCache !== false) {
            SecureSheets.setCached(cacheKey, data);
        }

        return data;
    };

    /**
     * Get batch data
     * @param {Array<string>} actions - Array of actions
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Batch results
     */
    SecureSheets.getBatch = async function(actions, options = {}) {
        const params = {
            action: 'batch',
            actions: actions.join(',')
        };
        
        if (SecureSheets.config.origin) {
            params.origin = SecureSheets.config.origin;
        }
        
        const cacheKey = 'batch:' + actions.join(',');
        
        if (options.useCache !== false) {
            const cached = SecureSheets.getCached(cacheKey);
            if (cached) return cached;
        }

        const url = buildUrl(params);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch batch data: ' + response.statusText);
        }

        const data = await response.json();

        if (options.useCache !== false) {
            SecureSheets.setCached(cacheKey, data);
        }

        return data;
    };

    // ============================================
    // PROTECTED API METHODS (AUTH REQUIRED)
    // ============================================

    /**
     * Get sheet data (requires HMAC)
     * @param {string|Array<string>} sheet - Sheet name(s)
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Sheet data
     */
    SecureSheets.getData = async function(sheet = null, options = {}) {
        const params = {
            action: 'getData'
        };
        
        if (sheet) {
            if (Array.isArray(sheet)) {
                params.sheets = sheet.join(',');
            } else {
                params.sheet = sheet;
            }
        }

        return await SecureSheets.makeRequest(params, options);
    };

    /**
     * Get cell data (B4 or B7 - requires HMAC)
     * @param {string} cell - Cell reference (B4 or B7)
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Cell data with signature
     */
    SecureSheets.getCellData = async function(cell, options = {}) {
        const params = {
            action: 'cellData',
            cell: cell.toUpperCase()
        };

        return await SecureSheets.makeRequest(params, options);
    };

    /**
     * Get multiple sheets data
     * @param {Array<string>} sheets - Array of sheet names
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Multi-sheet data
     */
    SecureSheets.getDataMultiSheet = async function(sheets, options = {}) {
        return await SecureSheets.getData(sheets, options);
    };

    /**
     * POST request for data
     * @param {Object} data - Request data
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Response data
     */
    SecureSheets.postData = async function(data, options = {}) {
        return await SecureSheets.makePostRequest(data, options);
    };

    // ============================================
    // SECURITY UTILITIES
    // ============================================

    /**
     * Verify webhook signature
     * @param {string} payload - Webhook payload
     * @param {string} signature - Signature from header
     * @param {string} secret - Webhook secret
     * @returns {boolean} True if valid
     */
    SecureSheets.verifyWebhookSignature = function(payload, signature, secret) {
        if (!payload || !signature || !secret) {
            return false;
        }

        try {
            const expectedSignature = SecureSheets.computeHMAC(payload, secret);
            
            if (signature.length !== expectedSignature.length) {
                return false;
            }
            
            let result = 0;
            for (let i = 0; i < signature.length; i++) {
                result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
            }
            
            return result === 0;
        } catch (error) {
            console.error('SecureSheets: Webhook verification failed:', error);
            return false;
        }
    };

    /**
     * Test connection to server
     * @returns {Promise<Object>} Connection test results
     */
    SecureSheets.testConnection = async function() {
        const results = {
            success: false,
            tests: {
                health: { passed: false, message: '' },
                config: { passed: false, message: '' },
                auth: { passed: false, message: '' }
            },
            server: null,
            timestamp: new Date().toISOString()
        };

        try {
            // Test 1: Health check
            try {
                const health = await SecureSheets.healthCheck();
                results.tests.health.passed = health.status === 'online' || health.status === 'healthy';
                results.tests.health.message = results.tests.health.passed ? 
                    'Server is online' : 'Server returned unexpected status';
                results.tests.health.data = health;
            } catch (error) {
                results.tests.health.message = 'Health check failed: ' + error.message;
            }

            // Test 2: Config endpoint
            try {
                const config = await SecureSheets.getServerConfig();
                results.tests.config.passed = config.success === true;
                results.tests.config.message = config.success ? 
                    'Config endpoint accessible' : 'Config returned error';
                results.tests.config.data = config;
                results.server = config;
            } catch (error) {
                results.tests.config.message = 'Config fetch failed: ' + error.message;
            }

            // Test 3: Authentication
            if (SecureSheets.isConfigured()) {
                try {
                    const data = await SecureSheets.getData(null, { useCache: false });
                    results.tests.auth.passed = data.status === 'success' || data.success === true;
                    results.tests.auth.message = results.tests.auth.passed ? 
                        'Authentication successful' : 'Authentication failed';
                    results.tests.auth.data = data;
                } catch (error) {
                    results.tests.auth.message = 'Authentication failed: ' + error.message;
                }
            } else {
                results.tests.auth.message = 'Skipped (not configured)';
            }

            results.success = results.tests.health.passed && results.tests.config.passed;
            return results;

        } catch (error) {
            results.error = error.message;
            return results;
        }
    };

    // ============================================
    // ERROR HANDLING
    // ============================================

    /**
     * Parse error response
     * @param {Object} errorData - Error data
     * @returns {Error} Error object
     */
    SecureSheets.parseError = function(errorData) {
        let message = 'SecureSheets: ';
        
        if (errorData.error) {
            message += errorData.error;
        }
        
        if (errorData.code) {
            message += ' (Code: ' + errorData.code + ')';
        }
        
        if (errorData.message && !errorData.error) {
            message += errorData.message;
        }
        
        const error = new Error(message);
        error.code = errorData.code;
        error.serverResponse = errorData;
        
        return error;
    };

    /**
     * Handle error response
     * @param {Response} response - Response object
     * @returns {Promise<never>} Throws error
     */
    SecureSheets.handleErrorResponse = async function(response) {
        let errorData;
        
        try {
            errorData = await response.json();
        } catch (e) {
            throw new Error(`SecureSheets: HTTP ${response.status} - ${response.statusText}`);
        }
        
        throw SecureSheets.parseError(errorData);
    };

    /**
     * Format error for display
     * @param {Error} error - Error object
     * @returns {Object} Formatted error
     */
    SecureSheets.formatError = function(error) {
        return {
            message: error.message,
            code: error.code || 'UNKNOWN_ERROR',
            details: error.serverResponse || null,
            timestamp: new Date().toISOString()
        };
    };

    // ============================================
    // NONCE MANAGEMENT
    // ============================================

    /**
     * Get nonce status
     * @returns {Object} Nonce info
     */
    SecureSheets.getNonceStatus = function() {
        return {
            enabled: SecureSheets.config.enableNonce,
            usedCount: SecureSheets.usedNonces.size,
            maxTracked: 1000
        };
    };

    /**
     * Clear used nonces
     */
    SecureSheets.clearNonces = function() {
        SecureSheets.usedNonces.clear();
    };

    // ============================================