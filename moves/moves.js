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
        
        // Role changes are now handled centrally by main.js
        
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
     * Handle special move checkbox changes (takefrom, card granting, etc.)
     */
    function handleTakeFromMoveIfNeeded(checkbox) {
        const moveId = extractMoveId(checkbox.id);
        
        // Check if this is a takefrom move that needs special handling
        const move = window.moves && window.moves.find(m => m.id === moveId);
        if (move && move.takefrom && window.TakeFrom) {
            window.TakeFrom.handleTakeFromMoveToggle(moveId, checkbox.checked);
        }
        
        // Check if this move grants a card
        if (move && move.grantsCard && window.GrantCard) {
            window.GrantCard.handleCardGrantingMoveToggle(moveId, checkbox.checked);
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
     * Set up listener for role changes (now handled by main.js)
     * This is kept for backward compatibility but delegates to main system
     */
    function setupRoleChangeListener() {
        // Role change handling is now centralized in main.js
        // This function is kept for compatibility but does nothing
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
     * @param {string} role - The role to render moves for
     * @param {boolean} refreshPersistence - Whether to refresh persistence after rendering (default: true)
     */
    function renderMovesForRole(role, refreshPersistence = true) {
        if (window.MovesCore) {
            window.MovesCore.renderMovesForRole(role);
            
            // After rendering moves, refresh persistence to handle new checkboxes
            if (refreshPersistence && window.Persistence) {
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
