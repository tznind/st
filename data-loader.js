/**
 * Data Loader - Loads JSON data files for Commander character sheets
 */

/**
 * Initialize all game data (stats, availability map, and moves)
 * @returns {Promise} Promise that resolves when all data is loaded
 */
window.initializeMovesData = async function() {
    try {
        if (!window.JsonLoader) {
            throw new Error('JsonLoader not available');
        }
        
        console.log('Loading game data from JSON files...');
        
        // Load all game data
        await window.JsonLoader.loadAllGameData();
        
        // Combine moves from all roles (dynamically discover loaded move variables)
        window.moves = [];
        
        // Look for all variables ending with "Moves" and combine them
        for (const key in window) {
            if (key.endsWith('Moves') && Array.isArray(window[key])) {
                console.log(`Found move data: ${key} with ${window[key].length} moves`);
                window.moves = window.moves.concat(window[key]);
            }
        }
        
        console.log('All game data initialized:', window.moves.length, 'moves loaded');
        
        // Dispatch event to notify that data is ready
        window.dispatchEvent(new CustomEvent('movesDataReady'));
        
    } catch (error) {
        console.error('Failed to load game data:', error);
        throw error;
    }
};
