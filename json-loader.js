/**
 * JSON Data Loader - Loads JSON files using paths from availability map
 * Compatible with file:// URLs  
 */

window.JsonLoader = (function() {
    'use strict';

    // Cache for loaded modules config
    let modulesConfig = null;

    /**
     * Get current language (from URL parameter ?lang= or default to 'en')
     * @returns {string} Language code (e.g., 'en', 'es', 'fr')
     */
    function getCurrentLanguage() {
        // Check URL parameter (?lang=es)
        const params = new URLSearchParams(window.location.search);
        const langParam = params.get('lang');

        // Return language from URL or default to English
        return langParam || 'en';
    }

    /**
     * Get enabled module IDs from URL parameters
     * Supports both formats:
     *   - Checkbox style: &module_example-module=1
     *   - Legacy style: &module=moduleid or &module=id1,id2,id3
     * @returns {Array<string>} Array of enabled module IDs
     */
    function getEnabledModules() {
        const params = new URLSearchParams(window.location.search);
        const enabledModules = [];

        // Check for checkbox-style params (module_{id}=1)
        for (const [key, value] of params.entries()) {
            if (key.startsWith('module_') && value === '1') {
                const moduleId = key.substring(7); // Remove 'module_' prefix
                if (moduleId && !enabledModules.includes(moduleId)) {
                    enabledModules.push(moduleId);
                }
            }
        }

        // Also support legacy &module= param for backwards compatibility
        const moduleParam = params.get('module');
        if (moduleParam) {
            const legacyModules = moduleParam.split(',').map(id => id.trim()).filter(id => id);
            legacyModules.forEach(id => {
                if (!enabledModules.includes(id)) {
                    enabledModules.push(id);
                }
            });
        }

        return enabledModules;
    }

    /**
     * Load modules configuration from data/modules.json (with translation support)
     * @returns {Promise<Object>} Modules configuration object
     */
    async function loadModulesConfig() {
        if (modulesConfig) {
            return modulesConfig;
        }

        try {
            const response = await fetchWithTranslations('data/modules.json');
            if (response.ok) {
                modulesConfig = await response.json();
                console.log('Loaded modules config:', modulesConfig);
                return modulesConfig;
            }
        } catch (error) {
            console.log('No modules.json found or failed to load:', error.message);
        }

        modulesConfig = { modules: [] };
        return modulesConfig;
    }

    /**
     * Merge module availability data into base availability map
     * Module data is merged per-role, with module moves and settings added to existing roles
     * @param {Object} baseMap - Base availability map
     * @param {Object} moduleMap - Module's availability data
     * @param {string} moduleId - Module ID for logging
     * @returns {Object} Merged availability map
     */
    function mergeModuleAvailability(baseMap, moduleMap, moduleId) {
        const result = { ...baseMap };

        for (const [roleName, roleData] of Object.entries(moduleMap)) {
            if (result[roleName]) {
                // Role exists - merge module data into it
                // Track additional moves files from modules
                const existingMovesFiles = result[roleName]._movesFiles || [];
                if (result[roleName]._movesFile && !existingMovesFiles.includes(result[roleName]._movesFile)) {
                    existingMovesFiles.push(result[roleName]._movesFile);
                }

                // Add module's moves file
                if (roleData._movesFile) {
                    existingMovesFiles.push(roleData._movesFile);
                }

                // Merge cards arrays
                const existingCards = result[roleName].cards || [];
                const moduleCards = roleData.cards || [];
                const mergedCards = [...existingCards, ...moduleCards.filter(c => !existingCards.includes(c))];

                // Merge all properties
                result[roleName] = {
                    ...result[roleName],
                    ...roleData,
                    _movesFiles: existingMovesFiles.length > 0 ? existingMovesFiles : undefined,
                    cards: mergedCards.length > 0 ? mergedCards : undefined
                };

                // Keep original _movesFile for backwards compatibility
                if (baseMap[roleName]._movesFile) {
                    result[roleName]._movesFile = baseMap[roleName]._movesFile;
                }

                console.log(`Merged module ${moduleId} into role ${roleName}`);
            } else {
                // New role from module - add it directly
                result[roleName] = roleData;
                console.log(`Added new role ${roleName} from module ${moduleId}`);
            }
        }

        return result;
    }

    /**
     * Deep merge two objects recursively
     * @param {Object} base - Base object
     * @param {Object} override - Override object
     * @returns {Object} Merged object
     */
    function deepMerge(base, override) {
        if (!override) return base;
        if (Array.isArray(base) && Array.isArray(override)) {
            // For arrays, merge by index
            return base.map((item, idx) => {
                if (typeof item === 'object' && typeof override[idx] === 'object') {
                    return deepMerge(item, override[idx]);
                }
                return override[idx] !== undefined ? override[idx] : item;
            });
        }
        if (typeof base === 'object' && typeof override === 'object') {
            const result = { ...base };
            Object.keys(override).forEach(key => {
                if (typeof base[key] === 'object' && typeof override[key] === 'object') {
                    result[key] = deepMerge(base[key], override[key]);
                } else {
                    result[key] = override[key];
                }
            });
            return result;
        }
        return override;
    }

    /**
     * Merge translation data into base data by ID
     * @param {Array} baseData - Base data (English)
     * @param {Array} translationData - Translation data
     * @returns {Array} Merged data with translations applied
     */
    function mergeTranslations(baseData, translationData) {
        if (!translationData || !Array.isArray(translationData)) {
            return baseData;
        }

        // Create a map of translations by ID for quick lookup
        const translationMap = {};
        translationData.forEach(item => {
            if (item.id) {
                translationMap[item.id] = item;
            }
        });

        // Merge translations into base data
        return baseData.map(baseItem => {
            const translation = translationMap[baseItem.id];
            return translation ? deepMerge(baseItem, translation) : baseItem;
        });
    }

    /**
     * Fetch with retry logic using exponential backoff
     * @param {string} url - URL to fetch
     * @param {number} retryCount - Current retry attempt number
     * @param {number} maxRetries - Maximum number of retries (default: 3)
     * @returns {Promise<Response>} Fetch response
     */
    async function fetchWithRetry(url, retryCount = 0, maxRetries = 3) {
        try {
            const response = await fetch(url);

            // If successful, return the response
            if (response.ok) {
                return response;
            }

            // If 404, don't retry (file doesn't exist)
            if (response.status === 404) {
                return response;
            }

            // For other errors (500, 503, network issues), retry
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (error) {
            if (retryCount < maxRetries) {
                // Retry with exponential backoff (1s, 2s, 4s)
                const delay = Math.pow(2, retryCount) * 1000;
                console.log(`Retrying fetch (attempt ${retryCount + 1}/${maxRetries}) after ${delay}ms: ${url}`);

                // Non-blocking retry using setTimeout wrapped in Promise
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchWithRetry(url, retryCount + 1, maxRetries);
            } else {
                // All retries exhausted, throw the error
                console.error(`Failed to fetch after ${maxRetries} retries: ${url}`, error);
                throw error;
            }
        }
    }

    /**
     * Fetch a file with translation fallback support and retry logic
     * Automatically detects if path is already translated and normalizes it
     * Tries translated path first (data/{lang}/...), then falls back to base path (data/...)
     * @param {string} path - File path (can be base like "data/cards/ship/card.json" or already translated like "data/es/cards/ship/card.css")
     * @returns {Promise<Response>} Fetch response
     */
    async function fetchWithTranslations(path) {
        // Normalize to base path (remove any existing language prefix)
        const basePath = path.replace(/^data\/[a-z]{2}\//, 'data/');
        const currentLang = getCurrentLanguage();

        // If not English, try translated version first
        if (currentLang !== 'en') {
            const translatedPath = basePath.replace(/^data\//, `data/${currentLang}/`);
            const response = await fetchWithRetry(translatedPath);

            if (response.ok) {
                console.log(`Loaded translation: ${translatedPath}`);
                return response;
            }

            console.log(`Translation not found: ${translatedPath} (using base)`);
        }

        // Fall back to base path (English) with retry
        return fetchWithRetry(basePath);
    }

    /**
     * Load a JSON file and assign it to a window variable
     * @param {string} filePath - Path to the JSON file
     * @param {string} variableName - Name of the window variable to assign to
     * @returns {Promise} Promise that resolves when the JSON is loaded
     */
    async function loadJsonData(filePath, variableName) {
        // Check if we're running from file:// protocol
        if (location.protocol === 'file:') {
            throw new Error(`Cannot use fetch with file:// protocol for ${filePath}. Use embedded data instead.`);
        }

        try {
            const response = await fetchWithRetry(filePath);
            if (!response.ok) {
                throw new Error(`Failed to load ${filePath}: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            window[variableName] = data;
            console.log(`Loaded ${variableName} from ${filePath}:`, data.length || 'object', typeof data === 'object' ? 'loaded' : 'items');
            return data;
        } catch (error) {
            console.error(`Error loading ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Load a JSON file with optional translation support
     * @param {string} filePath - Path to the base JSON file
     * @param {string} variableName - Name of the window variable to assign to
     * @param {boolean} mergeById - If true, merge arrays by ID; if false, replace entirely (default: true)
     * @returns {Promise} Promise that resolves when the JSON is loaded (with translations if available)
     */
    async function loadJsonDataWithTranslations(filePath, variableName, mergeById = true) {
        // Load base data first
        let data = await loadJsonData(filePath, variableName);

        // Load translations if language is not English
        const currentLang = getCurrentLanguage();
        if (currentLang !== 'en') {
            // Convert path like "data/stats.json" to "data/es/stats.json"
            const translationPath = filePath.replace(/^data\//, `data/${currentLang}/`);

            try {
                const response = await fetchWithRetry(translationPath);
                if (response.ok) {
                    const translationData = await response.json();

                    // Merge by ID or replace entirely based on parameter
                    if (mergeById && Array.isArray(data) && Array.isArray(translationData)) {
                        data = mergeTranslations(data, translationData);
                    } else {
                        data = translationData;
                    }

                    window[variableName] = data;
                    console.log(`Loaded translation: ${translationPath}`);
                } else {
                    console.log(`Translation not found: ${translationPath} (using English)`);
                }
            } catch (error) {
                console.log(`Translation not available: ${translationPath} (using English)`);
            }
        }

        return data;
    }

    /**
     * Load multiple JSON files in parallel
     * @param {Array} fileConfigs - Array of {filePath, variableName} objects
     * @returns {Promise} Promise that resolves when all files are loaded
     */
    async function loadMultipleJsonData(fileConfigs) {
        const promises = fileConfigs.map(config => 
            loadJsonData(config.filePath, config.variableName)
        );
        
        return Promise.all(promises);
    }

    /**
     * Load all role move files using paths from availability map
     * @returns {Promise} Promise that resolves when all role moves are loaded
     */
    async function loadAllRoleMoves() {
        if (!window.availableMap) {
            throw new Error('availableMap not loaded - cannot determine move file paths');
        }
        
        const roleConfigs = [];
        
        const loadedPaths = new Set(); // Avoid loading same file twice

        for (const [roleName, roleData] of Object.entries(window.availableMap)) {
            // Load primary moves file
            if (roleData._movesFile && !loadedPaths.has(roleData._movesFile)) {
                const variableName = roleName
                    .split(' ')
                    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                    .join('') + 'Moves';

                roleConfigs.push({
                    filePath: roleData._movesFile,
                    variableName: variableName,
                    roleName: roleName
                });
                loadedPaths.add(roleData._movesFile);
            }

            // Load additional moves files from modules (_movesFiles array)
            if (roleData._movesFiles && Array.isArray(roleData._movesFiles)) {
                roleData._movesFiles.forEach((filePath, i) => {
                    if (!loadedPaths.has(filePath)) {
                        const variableName = roleName
                            .split(' ')
                            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                            .join('') + 'ModuleMoves' + i;

                        roleConfigs.push({
                            filePath: filePath,
                            variableName: variableName,
                            roleName: roleName
                        });
                        loadedPaths.add(filePath);
                    }
                });
            }
        }
        
        if (roleConfigs.length === 0) {
            console.warn('No move files specified in availability map');
            return;
        }
        
        console.log(`Loading ${roleConfigs.length} move files from availability map`);

        // Load all move files and combine them
        const loadedData = await loadMultipleJsonData(roleConfigs);

        // Load translations if language is not English
        const currentLang = getCurrentLanguage();
        if (currentLang !== 'en') {
            console.log(`Loading translations for language: ${currentLang}`);

            // Try to load translation files for each role
            for (const config of roleConfigs) {
                // Convert path like "data/moves/lord-commander.json" to "data/es/moves/lord-commander.json"
                const translationPath = config.filePath.replace(/^data\//, `data/${currentLang}/`);

                try {
                    const response = await fetchWithRetry(translationPath);
                    if (response.ok) {
                        const translationData = await response.json();
                        // Merge translations into the loaded moves
                        const baseMoves = window[config.variableName];
                        window[config.variableName] = mergeTranslations(baseMoves, translationData);
                        console.log(`Loaded translation: ${translationPath}`);
                    } else {
                        console.log(`Translation not found: ${translationPath} (using English)`);
                    }
                } catch (error) {
                    console.log(`Translation not available: ${translationPath} (using English)`);
                }
            }
        }

        // Combine all move arrays into a single array and normalize categories
        const allMoves = [];
        const moveSourceMap = {}; // Track which file each move comes from

        roleConfigs.forEach(config => {
            const moves = window[config.variableName];
            if (Array.isArray(moves)) {
                console.log(`${config.variableName} contains:`, moves.map(m => m.id));
                // Normalize moves: set category to "Moves" if not specified
                const normalizedMoves = moves.map(move => {
                    // Track source file for validation
                    if (!moveSourceMap[move.id]) {
                        moveSourceMap[move.id] = [];
                    }
                    moveSourceMap[move.id].push({
                        file: config.filePath,
                        role: config.roleName
                    });

                    if (!move.category) {
                        return { ...move, category: "Moves" };
                    }
                    return move;
                });
                allMoves.push(...normalizedMoves);
            }
        });

        // Store the source map globally for validation
        window.moveSourceMap = moveSourceMap;
        
        console.log(`Combined ${allMoves.length} total moves`);
        return allMoves;
    }

    /**
     * Load stats configuration (with translations - merge by ID)
     * @returns {Promise} Promise that resolves when stats data is loaded
     */
    async function loadStatsData() {
        return loadJsonDataWithTranslations('data/stats.json', 'hexStats', true);
    }

    /**
     * Load role availability map (with translation support - complete replacement)
     * Also loads and merges any enabled modules
     * @returns {Promise} Promise that resolves when availability map is loaded
     */
    async function loadAvailabilityMap() {
        // Load base availability map
        let data = await loadJsonDataWithTranslations('data/availability.json', 'availableMap', false);

        // Check for enabled modules
        const enabledModuleIds = getEnabledModules();
        if (enabledModuleIds.length === 0) {
            return data;
        }

        // Load modules config
        const config = await loadModulesConfig();
        if (!config.modules || config.modules.length === 0) {
            console.warn('Modules requested but no modules.json found');
            return data;
        }

        // Load and merge each enabled module
        for (const moduleId of enabledModuleIds) {
            const moduleInfo = config.modules.find(m => m.id === moduleId);
            if (!moduleInfo) {
                console.warn(`Module not found: ${moduleId}`);
                continue;
            }

            // Use fetchWithTranslations to load module availability with language support
            const availabilityPath = `${moduleInfo.path}/availability.json`;
            try {
                const response = await fetchWithTranslations(availabilityPath);
                if (response.ok) {
                    const moduleData = await response.json();
                    data = mergeModuleAvailability(data, moduleData, moduleId);
                    console.log(`Loaded module: ${moduleId}`);
                } else {
                    console.warn(`Failed to load module ${moduleId}: ${response.status}`);
                }
            } catch (error) {
                console.error(`Error loading module ${moduleId}:`, error);
            }
        }

        // Update the global variable with merged data
        window.availableMap = data;
        return data;
    }

    /**
     * Load categories configuration (with translation support - complete replacement)
     * @returns {Promise} Promise that resolves when categories data is loaded
     */
    async function loadCategoriesData() {
        return loadJsonDataWithTranslations('data/categories.json', 'categoriesConfig', false);
    }

    /**
     * Load terms glossary (with translation support - complete replacement)
     * @returns {Promise} Promise that resolves when terms data is loaded
     */
    async function loadTermsData() {
        return loadJsonDataWithTranslations('data/terms.json', 'termsGlossary', false);
    }

    /**
     * Load aliases configuration (optional - gracefully handles missing file, with translation support)
     * @returns {Promise} Promise that resolves when aliases data is loaded
     */
    async function loadAliasesData() {
        try {
            return await loadJsonDataWithTranslations('data/aliases.json', 'aliasesConfig', false);
        } catch (error) {
            console.warn('Aliases file not found, using empty aliases');
            window.aliasesConfig = [];
            return [];
        }
    }


    /**
     * Load all game data (stats, availability map, and moves)
     * @returns {Promise} Promise that resolves when all data is loaded
     */
    async function loadAllGameData() {
        try {
            // Load stats, availability, categories, terms, and aliases data first
            await Promise.all([
                loadStatsData(),
                loadAvailabilityMap(),
                loadCategoriesData(),
                loadTermsData(),
                loadAliasesData()
            ]);

            // Load all role moves and return the combined array
            const allMoves = await loadAllRoleMoves();

            console.log('All game data loaded successfully');
            return allMoves;
        } catch (error) {
            console.error('Failed to load game data:', error);
            throw error;
        }
    }

    // Public API
    return {
        getCurrentLanguage,
        getEnabledModules,
        loadModulesConfig,
        fetchWithTranslations,
        loadJsonData,
        loadMultipleJsonData,
        loadAllRoleMoves,
        loadStatsData,
        loadAvailabilityMap,
        loadCategoriesData,
        loadTermsData,
        loadAliasesData,
        loadAllGameData
    };
})();
