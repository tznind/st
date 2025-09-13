/**
 * Main Data File - Stats, roles, and consolidated moves
 */

// Hex stats template
window.hexStats = [
  { id: "strength", title: "STRENGTH" },
  { id: "dexterity", title: "DEXTERITY" },
  { id: "intelligence", title: "INTELLIGENCE" },
  { id: "wisdom", title: "WISDOM" },
  { id: "constitution", title: "CONSTITUTION" },
  { id: "charisma", title: "CHARISMA" }
];

// Map roles → move IDs → initial checked state
window.availableMap = {
    "Fox": {
        "l1a2b3": false,
        "d4e5f6": false,
        "g7h8i9": false,
        "1587dd": false,
        "a01221": false,
        "b01221": false,
        "ff0011": false,
        "ae0122": false,
        "fa0122": false,
        "de0122": false
    },
    "Marshal":{
        "j1k2l3": false,
    }
};

/**
 * Dynamically load a script file
 * @param {string} src - Script source path
 * @returns {Promise} Promise that resolves when script is loaded
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Initialize moves data by loading and combining all role-specific moves
 * This function loads the role files dynamically and then combines the moves
 */
window.initializeMovesData = async function() {
    try {
        // Load all role move files
        await Promise.all([
            loadScript('data/fox.js'),
            loadScript('data/marshal.js')
        ]);
        
        // Combine moves from all roles
        window.moves = [];
        
        if (window.FoxMoves) {
            window.moves = window.moves.concat(window.FoxMoves);
        }

        if (window.MarshalMoves) {
            window.moves = window.moves.concat(window.MarshalMoves);
        }
        
        console.log('Moves data initialized:', window.moves.length, 'moves loaded');
        
        // Dispatch event to notify that data is ready
        window.dispatchEvent(new CustomEvent('movesDataReady'));
        
    } catch (error) {
        console.error('Failed to load moves data:', error);
    }
};
