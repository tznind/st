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
            // Extract suffix from checkbox ID if this is a multiple instance
            // Checkbox ID format: move_{moveId}_{instance} or move_{moveId}
            const suffix = extractInstanceSuffix(checkbox.id, moveId);
            const containerId = suffix
                ? `granted_card_${moveId}_${suffix}`
                : `granted_card_${moveId}`;

            console.log(`Toggling granted card: moveId=${moveId}, suffix=${suffix}, containerId=${containerId}, checked=${checkbox.checked}`);
            window.InlineCards.toggleCardDisplay(moveId, move.grantsCard, containerId, checkbox.checked);
        }

        // Check if this move has tracking
        if (move && move.track && window.Track) {
            window.Track.handleTrackedMoveToggle(moveId, checkbox.checked);
        }

    }

    /**
     * Extract instance suffix from checkbox ID
     * e.g., "move_squads_1" with moveId "squads" returns "1"
     * e.g., "move_squads" with moveId "squads" returns null
     */
    function extractInstanceSuffix(checkboxId, moveId) {
        const prefix = `move_${moveId}`;
        if (checkboxId === prefix) {
            return null; // No suffix
        }
        if (checkboxId.startsWith(prefix + '_')) {
            return checkboxId.substring(prefix.length + 1);
        }
        return null;
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
