/**
 * Inline Cards Module - Unified system for displaying cards inline with moves
 * Replaces duplicated logic from grantcard.js and takeFrom.js
 */

window.InlineCards = (function() {
    'use strict';

    /**
     * Suffix all id and for attributes in HTML string
     * @param {string} html - HTML string to transform
     * @param {string} suffix - Suffix to append to IDs
     * @returns {string} Transformed HTML
     */
    function suffixHTMLIds(html, suffix) {
        if (!suffix) return html;

        // Replace id="xxx" with id="xxx_suffix"
        html = html.replace(/\bid="([^"]+)"/g, (match, id) => {
            return `id="${id}_${suffix}"`;
        });

        // Replace for="xxx" with for="xxx_suffix" (for label elements)
        html = html.replace(/\bfor="([^"]+)"/g, (match, forId) => {
            return `for="${forId}_${suffix}"`;
        });

        // Replace data-table-add="xxx" with data-table-add="xxx_suffix" (for dynamic tables)
        html = html.replace(/\bdata-table-add="([^"]+)"/g, (match, tableId) => {
            return `data-table-add="${tableId}_${suffix}"`;
        });

        // Also handle id='xxx' and for='xxx' (single quotes)
        html = html.replace(/\bid='([^']+)'/g, (match, id) => {
            return `id='${id}_${suffix}'`;
        });

        html = html.replace(/\bfor='([^']+)'/g, (match, forId) => {
            return `for='${forId}_${suffix}'`;
        });

        // Also handle data-table-add='xxx' (single quotes)
        html = html.replace(/\bdata-table-add='([^']+)'/g, (match, tableId) => {
            return `data-table-add='${tableId}_${suffix}'`;
        });

        return html;
    }

    /**
     * Extract suffix from a container ID
     * @param {string} containerId - Container ID (e.g., "learned_granted_card_ac001_2" or "granted_card_squads_1")
     * @returns {string|null} Suffix if found (e.g., "2"), null otherwise
     */
    function extractSuffixFromContainerId(containerId) {
        // Pattern 1: learned_granted_card_{moveId}_{suffix} (from takeFrom with duplicates)
        let match = containerId.match(/^learned_granted_card_[^_]+_(\d+)$/);
        if (match) return match[1];

        // Pattern 2: granted_card_{moveId}_{suffix} (from grantsCard with duplicates)
        match = containerId.match(/^granted_card_[^_]+_(\d+)$/);
        if (match) return match[1];

        return null;
    }

    /**
     * Display a card inline within a container
     * @param {string} containerId - ID of the container to render the card into
     * @param {string} cardId - ID of the card to display
     * @param {string} className - CSS class for the card wrapper (optional)
     */
    async function displayCard(containerId, cardId, className = 'granted-card') {
        console.log(`InlineCards.displayCard called: containerId=${containerId}, cardId=${cardId}`);
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`InlineCards.displayCard: Container not found: ${containerId}`);
            return;
        }
        if (!cardId) {
            console.error(`InlineCards.displayCard: No cardId provided`);
            return;
        }

        console.log(`InlineCards.displayCard: Container found, attempting to load card ${cardId}`);

        // Show loading state in the container
        container.innerHTML = '<div class="card-loading">Loading card...</div>';

        try {
            if (window.Cards) {
                console.log(`InlineCards.displayCard: Calling window.Cards.loadCard for ${cardId}`);
                const cardData = await window.Cards.loadCard(cardId);
                console.log(`InlineCards.displayCard: Card data loaded for ${cardId}`, cardData);

                container.innerHTML = '';
                const cardDiv = document.createElement("div");
                cardDiv.className = className;
                cardDiv.setAttribute('data-card-id', cardId);

                // Check if this is a learned move with a suffix
                const suffix = extractSuffixFromContainerId(containerId);
                let cardHTML = cardData.html;

                // If we have a suffix, transform all IDs in the card HTML
                if (suffix) {
                    console.log(`InlineCards.displayCard: Suffixing card IDs with: ${suffix}`);
                    cardHTML = suffixHTMLIds(cardHTML, suffix);
                }

                cardDiv.innerHTML = cardHTML;
                container.appendChild(cardDiv);

                // Make sure the parent granted-card-options container is visible
                const parentContainer = container.closest('.granted-card-options');
                if (parentContainer) {
                    console.log(`InlineCards.displayCard: Setting parent container display to block`);
                    parentContainer.style.display = 'block';
                }

                // Try to initialize card-specific functionality
                // Pass the cardDiv as container and suffix (if any) to the init function
                initializeCardFunctionality(cardId, cardDiv, suffix);

                // Format any elements with data-format-text attribute
                setTimeout(() => {
                    if (window.TextFormatter && window.TextFormatter.formatElements) {
                        window.TextFormatter.formatElements();
                    }
                }, 50);

                // Refresh persistence to restore URL parameters for the newly added card inputs
                setTimeout(() => {
                    const form = document.querySelector('form');
                    if (form && window.Persistence) {
                        console.log(`InlineCards.displayCard: Refreshing persistence for card ${cardId}`);
                        window.Persistence.refreshPersistence(form);
                    }
                }, 50);

                console.log(`Displayed card '${cardId}' inline in container '${containerId}'`);
            } else {
                console.error(`InlineCards.displayCard: window.Cards not available`);
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
     * Uses new CardInitializers export pattern with fallback to old convention
     * @param {string} cardId - ID of the card to initialize
     * @param {HTMLElement} container - Container element for this card instance
     * @param {string|null} suffix - Suffix for this instance (null for non-duplicates)
     */
    function initializeCardFunctionality(cardId, container, suffix = null) {
        // Use a short timeout to ensure DOM is fully ready
        setTimeout(function() {
            console.log(`Inline Cards: Attempting to initialize card functionality for: ${cardId} (suffix: ${suffix})`);

            // Ensure CardInitializers namespace exists
            window.CardInitializers = window.CardInitializers || {};

            // Look for exported initialization function (new pattern)
            const initFunction = window.CardInitializers[cardId];
            if (typeof initFunction === 'function') {
                try {
                    console.log(`Inline Cards: Calling CardInitializers['${cardId}'](container, suffix)...`);
                    // Pass container and suffix to the init function
                    // This allows the card JS to scope its queries and handle duplicates
                    initFunction(container, suffix);
                    console.log(`Inline Cards: Card ${cardId} initialized successfully`);
                } catch (error) {
                    console.error(`Inline Cards: Error initializing card ${cardId}:`, error);
                }
            } else {
                console.log(`Inline Cards: No new-style initialization function found for card: ${cardId}`);

                // Fallback to old convention-based approach for backwards compatibility
                const functionName = 'initialize' + cardId
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join('');

                console.log(`Inline Cards: Looking for old-style function: ${functionName}`);

                if (typeof window[functionName] === 'function') {
                    console.log(`Inline Cards: Falling back to old convention: ${functionName}(container, suffix)`);
                    // Pass parameters for backwards compatibility
                    window[functionName](container, suffix);
                } else {
                    console.log(`Inline Cards: No initialization needed for ${cardId}`);
                }
            }
        }, 100); // Increased timeout to ensure card DOM is ready
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