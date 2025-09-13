/**
 * Moves Module - Main coordinator for move rendering and event handling
 */

window.Moves = (function() {
    'use strict';

    /**
     * Initialize moves system
     */
    function initialize() {
        // Set up event listeners for takefrom checkboxes (let persistence handle regular checkboxes)
        setupMoveEventListeners();
        
        // Listen for role changes to re-render moves
        setupRoleChangeListener();
        
        // Listen for availableMap updates
        setupAvailableMapUpdateListener();
    }

    /**
     * Set up event listeners for move checkboxes and takefrom functionality
     */
    function setupMoveEventListeners() {
        document.addEventListener('change', (event) => {
            const target = event.target;
            
            // Only handle special takefrom checkbox logic, let persistence handle the rest
            if (target.id && target.id.startsWith('move_')) {
                handleTakeFromMoveIfNeeded(target);
            }
        });
    }

    /**
     * Handle takefrom move checkbox changes (only if the move has takefrom)
     */
    function handleTakeFromMoveIfNeeded(checkbox) {
        const moveId = extractMoveId(checkbox.id);
        
        // Check if this is a takefrom move that needs special handling
        const move = window.moves && window.moves.find(m => m.id === moveId);
        if (move && move.takefrom && window.TakeFrom) {
            window.TakeFrom.handleTakeFromMoveToggle(moveId, checkbox.checked);
        }
    }

    /**
     * Extract move ID from checkbox ID (handles single and multiple checkboxes)
     */
    function extractMoveId(checkboxId) {
        // Remove 'move_' prefix and any instance numbers (_1, _2, etc.) or pick suffixes
        return checkboxId.replace('move_', '').replace(/_\d+$/, '').replace(/_pick_\d+$/, '');
    }

    /**
     * Set up listener for role changes
     */
    function setupRoleChangeListener() {
        const roleSelect = document.getElementById('role');
        if (roleSelect) {
            roleSelect.addEventListener('change', (event) => {
                const selectedRole = event.target.value;
                renderMovesForRole(selectedRole);
                
                // Restore any learned moves from the URL
                restoreLearnedMoves(selectedRole);
            });
        }
    }

    /**
     * Set up listener for availableMap updates
     */
    function setupAvailableMapUpdateListener() {
        window.addEventListener('availableMapUpdated', (event) => {
            const { role } = event.detail;
            if (role === window.Utils.getCurrentRole()) {
                renderMovesForRole(role);
            }
        });
    }

    /**
     * Render moves for a specific role
     */
    function renderMovesForRole(role) {
        if (window.MovesCore) {
            window.MovesCore.renderMovesForRole(role);
            
            // After rendering moves, refresh persistence to handle new checkboxes
            if (window.Persistence) {
                const form = document.querySelector('form');
                if (form) {
                    // Add a small delay to ensure DOM is fully updated
                    setTimeout(() => {
                        window.Persistence.refreshPersistence(form);
                    }, 50);
                }
            }
        }
    }

    /**
     * Restore learned moves from URL parameters when role changes
     */
    function restoreLearnedMoves(role) {
        if (!role || !window.availableMap || !window.availableMap[role]) return;
        
        const urlParams = new URLSearchParams(location.search);
        const learnedMoves = new Set();
        
        // Find all takefrom move selections in the URL
        for (const [key, value] of urlParams) {
            if (key.includes('takefrom_') && key.includes('_move') && value) {
                learnedMoves.add(value);
            }
        }
        
        // Add learned moves to the availableMap
        learnedMoves.forEach(moveId => {
            if (window.TakeFrom) {
                window.TakeFrom.addLearnedMoveQuiet(role, moveId);
            }
        });
    }

    // Public API
    return {
        initialize,
        renderMovesForRole
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.Moves.initialize);
} else {
    window.Moves.initialize();
}
