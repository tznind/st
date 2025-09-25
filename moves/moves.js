/**
 * Moves Module - Main coordinator for move rendering and event handling
 */

window.Moves = (function() {
    'use strict';

    /**
     * Initialize moves system
     */
    function initialize() {
        // Set up event listeners for special move functionality (takeFrom, card granting)
        setupMoveEventListeners();
        
        // Role changes and regular checkboxes are now handled by persistence system
        // No additional setup needed
    }

    /**
     * Set up event listeners for move checkboxes and takeFrom functionality
     */
    function setupMoveEventListeners() {
        document.addEventListener('change', (event) => {
            const target = event.target;
            
            // Only handle special takeFrom checkbox logic, let persistence handle the rest
            if (target.id && target.id.startsWith('move_')) {
                handleTakeFromMoveIfNeeded(target);
            }
        });
    }

    /**
     * Handle special move checkbox changes (takeFrom, card granting, track, etc.)
     */
    function handleTakeFromMoveIfNeeded(checkbox) {
        const moveId = extractMoveId(checkbox);
        
        // Check if this is a takeFrom move that needs special handling
        const move = window.moves && window.moves.find(m => m.id === moveId);
        if (move && move.takeFrom && window.TakeFrom) {
            window.TakeFrom.handleTakeFromMoveToggle(moveId, checkbox.checked);
        }
        
        // Check if this move grants a card
        if (move && move.grantsCard && window.InlineCards) {
            const containerId = `granted_card_${moveId}`;
            window.InlineCards.toggleCardDisplay(moveId, move.grantsCard, containerId, checkbox.checked);
        }
        
        // Check if this move has tracking
        if (move && move.track && window.Track) {
            window.Track.handleTrackedMoveToggle(moveId, checkbox.checked);
        }
        
    }

    /**
     * Extract move ID from checkbox/radio element
     */
    function extractMoveId(element) {
        // Use the data attribute we set when creating the element
        return element.getAttribute('data-move-id');
    }

    // Public API
    return {
        initialize
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.Moves.initialize);
} else {
    window.Moves.initialize();
}
