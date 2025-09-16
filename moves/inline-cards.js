/**
 * Inline Cards Module - Unified system for displaying cards inline with moves
 * Replaces duplicated logic from grantcard.js and takefrom.js
 */

window.InlineCards = (function() {
    'use strict';

    /**
     * Display a card inline within a container
     * @param {string} containerId - ID of the container to render the card into
     * @param {string} cardId - ID of the card to display
     * @param {string} className - CSS class for the card wrapper (optional)
     */
    async function displayCard(containerId, cardId, className = 'granted-card') {
        const container = document.getElementById(containerId);
        if (!container || !cardId) return;

        try {
            if (window.Cards) {
                const cardData = await window.Cards.loadCard(cardId);
                
                container.innerHTML = '';
                const cardDiv = document.createElement("div");
                cardDiv.className = className;
                cardDiv.innerHTML = cardData.html;
                container.appendChild(cardDiv);
                
                // Make sure the parent granted-card-options container is visible
                const parentContainer = container.closest('.granted-card-options');
                if (parentContainer) {
                    parentContainer.style.display = 'block';
                }
                
                // Refresh persistence to capture new card inputs
                refreshPersistence();
                
                console.log(`Displayed card '${cardId}' inline in container '${containerId}'`);
            }
        } catch (error) {
            console.error(`Error loading inline card '${cardId}':`, error);
            container.innerHTML = '<div class="card-error">Error loading card</div>';
        }
    }

    /**
     * Hide/clear a card from an inline container
     * @param {string} containerId - ID of the container to clear
     */
    function hideCard(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
            
            // Also hide the parent granted-card-options container (which contains "Grants:" heading)
            const parentContainer = container.closest('.granted-card-options');
            if (parentContainer) {
                parentContainer.style.display = 'none';
            }
        }
    }

    /**
     * Create a card container element for inline display
     * @param {string} containerId - ID for the container
     * @param {string} headingText - Heading text (e.g., "Grants:")
     * @returns {HTMLElement} Container element
     */
    function createCardContainer(containerId, headingText = 'Grants:') {
        const cardDiv = document.createElement("div");
        cardDiv.className = "granted-card-options";
        
        const heading = document.createElement("strong");
        heading.textContent = headingText;
        cardDiv.appendChild(heading);
        
        // Container for the actual card
        const grantedCardContainer = document.createElement("div");
        grantedCardContainer.className = "granted-card-container";
        grantedCardContainer.id = containerId;
        cardDiv.appendChild(grantedCardContainer);
        
        return cardDiv;
    }

    /**
     * Check if any checkbox for a move is checked
     * @param {string} moveId - ID of the move to check
     * @returns {boolean} True if any checkbox is checked
     */
    function isAnyMoveCheckboxChecked(moveId) {
        // Check single checkbox
        const singleCheckbox = document.getElementById(`move_${moveId}`);
        if (singleCheckbox && singleCheckbox.checked) return true;
        
        // Check multiple checkboxes
        let index = 1;
        while (true) {
            const checkbox = document.getElementById(`move_${moveId}_${index}`);
            if (!checkbox) break;
            if (checkbox.checked) return true;
            index++;
        }
        return false;
    }

    /**
     * Handle display/hide of cards based on move checkbox state
     * @param {string} moveId - ID of the move
     * @param {string} cardId - ID of the card to display
     * @param {string} containerId - ID of the container
     * @param {boolean} forceCheck - Force check state (optional)
     */
    function toggleCardDisplay(moveId, cardId, containerId, forceCheck = null) {
        const isChecked = forceCheck !== null ? forceCheck : isAnyMoveCheckboxChecked(moveId);
        
        if (isChecked) {
            displayCard(containerId, cardId);
        } else {
            hideCard(containerId);
        }
    }

    /**
     * Restore inline cards for a role (called during initialization)
     * @param {string} role - Current role
     * @param {function} moveFilter - Function to filter which moves to check
     */
    function restoreInlineCards(role, moveFilter = null) {
        if (!window.moves || !role) return;

        console.log('Restoring inline cards for role:', role);
        
        // Find all relevant moves and check if they're selected
        const relevantMoves = window.moves.filter(move => {
            if (!move.grantsCard) return false;
            return moveFilter ? moveFilter(move) : true;
        });

        relevantMoves.forEach(move => {
            console.log(`Checking move ${move.id} for inline card restoration`);
            if (isAnyMoveCheckboxChecked(move.id)) {
                console.log(`Restoring inline card for move ${move.id}`);
                const containerId = `granted_card_${move.id}`;
                displayCard(containerId, move.grantsCard);
            }
        });
    }

    /**
     * Refresh persistence (with delay to ensure DOM is updated)
     */
    function refreshPersistence() {
        if (window.Persistence) {
            const form = document.querySelector('form');
            setTimeout(() => {
                if (form) {
                    window.Persistence.refreshPersistence(form);
                }
            }, 100);
        }
    }

    // Public API
    return {
        displayCard,
        hideCard,
        createCardContainer,
        isAnyMoveCheckboxChecked,
        toggleCardDisplay,
        restoreInlineCards
    };

})();