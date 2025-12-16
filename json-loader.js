/**
 * JSON Data Loader - Loads JSON files using paths from availability map
 * Compatible with file:// URLs  
 */

window.JsonLoader = (function() {
    'use strict';

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
            const response = await fetch(filePath);
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
        
        for (const [roleName, roleData] of Object.entries(window.availableMap)) {
            if (roleData._movesFile) {
                // Convert role name to variable name (e.g., "Mech Adept" -> "MechAdeptMoves")
                const variableName = roleName
                    .split(' ')
                    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                    .join('') + 'Moves';
                
                roleConfigs.push({
                    filePath: roleData._movesFile,
                    variableName: variableName,
                    roleName: roleName
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
     * Load stats configuration
     * @returns {Promise} Promise that resolves when stats data is loaded
     */
    async function loadStatsData() {
        return loadJsonData('data/stats.json', 'hexStats');
    }

    /**
     * Load role availability map
     * @returns {Promise} Promise that resolves when availability map is loaded
     */
    async function loadAvailabilityMap() {
        return loadJsonData('data/availability.json', 'availableMap');
    }

    /**
     * Load categories configuration
     * @returns {Promise} Promise that resolves when categories data is loaded
     */
    async function loadCategoriesData() {
        return loadJsonData('data/categories.json', 'categoriesConfig');
    }

    /**
     * Load terms glossary
     * @returns {Promise} Promise that resolves when terms data is loaded
     */
    async function loadTermsData() {
        return loadJsonData('data/terms.json', 'termsGlossary');
    }

    /**
     * Load aliases configuration (optional - gracefully handles missing file)
     * @returns {Promise} Promise that resolves when aliases data is loaded
     */
    async function loadAliasesData() {
        try {
            return await loadJsonData('data/aliases.json', 'aliasesConfig');
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
