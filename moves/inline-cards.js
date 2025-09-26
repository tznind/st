/**
 * Inline Cards Module - Unified system for displaying cards inline with moves
 * Replaces duplicated logic from grantcard.js and takeFrom.js
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
                cardDiv.setAttribute('data-card-id', cardId);
                cardDiv.innerHTML = cardData.html;
                container.appendChild(cardDiv);
                
                // Make sure the parent granted-card-options container is visible
                const parentContainer = container.closest('.granted-card-options');
                if (parentContainer) {
                    parentContainer.style.display = 'block';
                }
                
                // Try to initialize card-specific functionality
                initializeCardFunctionality(cardId);
                
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
     * Initialize card-specific functionality after card HTML is inserted
     * Uses convention-based approach: looks for window.initialize[PascalCaseCardId] function
     * @param {string} cardId - ID of the card to initialize
     */
    function initializeCardFunctionality(cardId) {
        // Use a short timeout to ensure DOM is fully ready
        setTimeout(function() {
            console.log(`Attempting to initialize card functionality for: ${cardId}`);
            
            // Convert kebab-case card ID to PascalCase function name
            // Examples: 'ship' -> 'Ship', 'robotic-companion' -> 'RoboticCompanion'
            const functionName = 'initialize' + cardId
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join('');
            
            console.log(`Looking for initialization function: ${functionName}`);
            
            // Try to call the convention-based initialization function
            if (typeof window[functionName] === 'function') {
                console.log(`Calling ${functionName}...`);
                window[functionName]();
            } else {
                console.log(`${functionName} function not found - card may not need special initialization`);
            }
        }, 10);
    }
    
    /**
     * Handle display/hide of cards based on move checkbox state
     * @param {string} moveId - ID of the move
     * @param {string} cardId - ID of the card to display
     * @param {string} containerId - ID of the container
     * @param {boolean} isChecked - Whether the move is checked
     */
    function toggleCardDisplay(moveId, cardId, containerId, isChecked) {
        if (isChecked) {
            displayCard(containerId, cardId);
        } else {
            hideCard(containerId);
        }
    }


    // Public API
    return {
        displayCard,
        hideCard,
        createCardContainer,
        toggleCardDisplay
    };

})();