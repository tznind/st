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
        
        // Load stats and availability data first
        await Promise.all([
            window.JsonLoader.loadStatsData(),
            window.JsonLoader.loadAvailabilityMap()
        ]);
        
        // Load all role moves and get the combined array
        window.moves = await window.JsonLoader.loadAllGameData();
        
        console.log('All game data initialized:', window.moves.length, 'moves loaded');
        
        // Dispatch event to notify that data is ready
        window.dispatchEvent(new CustomEvent('movesDataReady'));
        
    } catch (error) {
        console.error('Failed to load game data:', error);
        throw error;
    }
};
