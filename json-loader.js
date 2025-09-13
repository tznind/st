/**
 * JSON Data Loader - Loads JSON files and populates window variables
 * Compatible with file:// URLs
 */

window.JsonLoader = (function() {
    'use strict';

    /**
     * Load a JSON file and assign it to a window variable
     * For file:// URLs, we need to load the data via script tags instead of fetch
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
     * Discover JSON files in the data/moves directory
     * @returns {Promise<Array>} Promise that resolves to array of filenames
     */
    async function discoverMoveFiles() {
        try {
            // Try to fetch the directory listing (this works with some servers)
            // As fallback, we'll try common patterns
            const response = await fetch('data/moves/');
            if (response.ok) {
                const html = await response.text();
                // Extract .json filenames from directory listing HTML
                const matches = html.match(/href="([^"]+\.json)"/g) || [];
                return matches.map(match => match.match(/"([^"]+)"/)[1]);
            }
        } catch (error) {
            console.warn('Could not auto-discover move files, trying known patterns:', error);
        }
        
        // Fallback: try to load common filename patterns
        const commonPatterns = [
            'navigator.json', 'mech-adept.json', 'lord-commander.json',
            'rogue-trader.json', 'seneschal.json', 'explorator.json',
            'missionary.json', 'arch-militant.json', 'void-master.json'
        ];
        
        const existingFiles = [];
        for (const filename of commonPatterns) {
            try {
                const response = await fetch(`data/moves/${filename}`, { method: 'HEAD' });
                if (response.ok) {
                    existingFiles.push(filename);
                }
            } catch (error) {
                // File doesn't exist, continue
            }
        }
        
        return existingFiles;
    }

    /**
     * Load all role move files by discovering JSON files in data/moves/
     * @returns {Promise} Promise that resolves when all role moves are loaded
     */
    async function loadAllRoleMoves() {
        // Get list of JSON files in the moves directory
        const moveFiles = await discoverMoveFiles();
        
        const roleConfigs = moveFiles.map(fileName => {
            // Convert filename to variable name (e.g., "navigator.json" -> "NavigatorMoves")
            const baseName = fileName.replace('.json', '');
            const variableName = baseName
                .split('-')
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join('') + 'Moves';
            
            return {
                filePath: `data/moves/${fileName}`,
                variableName: variableName
            };
        });

        return loadMultipleJsonData(roleConfigs);
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
     * Load all game data (stats, availability map, and moves)
     * @returns {Promise} Promise that resolves when all data is loaded
     */
    async function loadAllGameData() {
        try {
            // Load stats and availability data first
            await Promise.all([
                loadStatsData(),
                loadAvailabilityMap()
            ]);

            // Then load all role moves
            await loadAllRoleMoves();

            console.log('All game data loaded successfully');
            return true;
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
        loadAllGameData
    };
})();
