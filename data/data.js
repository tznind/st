/**
 * Main Data File - Stats, roles, and consolidated moves
 */

// Hex stats template
window.hexStats = [
  { id: "mettle", title: "METTLE" },
  { id: "physique", title: "PHYSIQUE" },
  { id: "influence", title: "INFLUENCE" },
  { id: "expertise", title: "EXPERTISE" },
  { id: "conviction", title: "CONVICTION" }
];

// Map roles → move IDs → initial checked state
window.availableMap = {
    "Navigator": {
        "a1b2c3": true,
        "d4e5f6": false,
        "g7h8i9": true,
        "1587dd": false,
        "nav001": false
    },
    "Mech Adept": {
        "m1a2b3": false,
        "m4c5d6": false,
        "m7e8f9": false,
        "85757e": false
    },
    "Lord Commander": {
        "l1a2b3": false,
        "l4c5d6": false,
        "l7e8f9": false,
        "lc001": true,
        "adapt1": false
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
            loadScript('data/navigator.js'),
            loadScript('data/mech-adept.js'),
            loadScript('data/lord-commander.js')
        ]);
        
        // Combine moves from all roles
        window.moves = [];
        
        if (window.NavigatorMoves) {
            window.moves = window.moves.concat(window.NavigatorMoves);
        }
        
        if (window.MechAdeptMoves) {
            window.moves = window.moves.concat(window.MechAdeptMoves);
        }
        
        if (window.LordCommanderMoves) {
            window.moves = window.moves.concat(window.LordCommanderMoves);
        }
        
        console.log('Moves data initialized:', window.moves.length, 'moves loaded');
        
        // Dispatch event to notify that data is ready
        window.dispatchEvent(new CustomEvent('movesDataReady'));
        
    } catch (error) {
        console.error('Failed to load moves data:', error);
    }
};
