/**
 * GrantCard Module - Handles moves that grant cards (uses InlineCards system)
 */

window.GrantCard = (function() {
    'use strict';

    /**
     * Handle card-granting move checkbox changes
     */
    function handleCardGrantingMoveToggle(moveId, isChecked) {
        const move = window.moves && window.moves.find(m => m.id === moveId);
        if (!move || !move.grantsCard) return;

        // Use unified inline card system
        if (window.InlineCards) {
            const containerId = `granted_card_${moveId}`;
            window.InlineCards.toggleCardDisplay(moveId, move.grantsCard, containerId, isChecked);
        }
    }

    /**
     * Initialize for a role (called when role is selected)
     */
    function handleRoleChange(role) {
        if (role && window.InlineCards) {
            // Longer delay to ensure moves are fully rendered and checkboxes restored
            setTimeout(() => {
                window.InlineCards.restoreInlineCards(role);
            }, 400);
        }
    }

    return {
        handleCardGrantingMoveToggle,
        handleRoleChange
    };
})();
