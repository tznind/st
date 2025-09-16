/**
 * Cards Module - Handles loading and rendering card templates with custom CSS/JS
 * Cards are loaded from data/cards/[cardname]/ folders with card.json definitions
 */

window.Cards = (function() {
    'use strict';

    // Cache for loaded card data
    const cardCache = new Map();
    const loadedStyles = new Set();
    const loadedScripts = new Set();

    /**
     * Load a card's definition and files
     * @param {string} cardId - ID of the card to load
     * @returns {Promise<Object>} Card data with HTML content
     */
    async function loadCard(cardId) {
        if (cardCache.has(cardId)) {
            return cardCache.get(cardId);
        }

        try {
            // Load card definition
            const definitionResponse = await fetch(`data/cards/${cardId}/card.json`);
            if (!definitionResponse.ok) {
                throw new Error(`Failed to load card definition: ${cardId}`);
            }
            
            const cardDef = await definitionResponse.json();
            
            // Load HTML content
            const htmlResponse = await fetch(`${cardDef.path}/${cardDef.files.html}`);
            if (!htmlResponse.ok) {
                throw new Error(`Failed to load card HTML: ${cardId}`);
            }
            
            const html = await htmlResponse.text();
            
            // Load CSS if it exists and hasn't been loaded yet
            if (cardDef.files.css && !loadedStyles.has(cardId)) {
                await loadCardCSS(cardDef.path, cardDef.files.css, cardId);
            }
            
            // Load JavaScript if it exists and hasn't been loaded yet
            if (cardDef.files.js && !loadedScripts.has(cardId)) {
                await loadCardScript(cardDef.path, cardDef.files.js, cardId);
            }
            
            const cardData = {
                ...cardDef,
                html: html
            };
            
            cardCache.set(cardId, cardData);
            return cardData;
            
        } catch (error) {
            console.error(`Error loading card ${cardId}:`, error);
            return {
                id: cardId,
                title: `${cardId} (Error)`,
                html: `<div class="card card-error">
                    <h3>Card Error</h3>
                    <p>Failed to load card: ${cardId}</p>
                    <p class="error-details">${error.message}</p>
                </div>`
            };
        }
    }

    /**
     * Load and inject card CSS
     * @param {string} cardPath - Path to the card folder
     * @param {string} cssFile - CSS filename
     * @param {string} cardId - Card ID for tracking
     */
    async function loadCardCSS(cardPath, cssFile, cardId) {
        try {
            const response = await fetch(`${cardPath}/${cssFile}`);
            if (response.ok) {
                const css = await response.text();
                
                // Create and inject style element
                const style = document.createElement('style');
                style.setAttribute('data-card', cardId);
                style.textContent = css;
                document.head.appendChild(style);
                
                loadedStyles.add(cardId);
                console.log(`Loaded CSS for card: ${cardId}`);
            }
        } catch (error) {
            console.warn(`Failed to load CSS for card ${cardId}:`, error);
        }
    }

    /**
     * Load and execute card JavaScript
     * @param {string} cardPath - Path to the card folder
     * @param {string} jsFile - JavaScript filename  
     * @param {string} cardId - Card ID for tracking
     */
    async function loadCardScript(cardPath, jsFile, cardId) {
        try {
            const response = await fetch(`${cardPath}/${jsFile}`);
            if (response.ok) {
                const script = document.createElement('script');
                script.setAttribute('data-card', cardId);
                script.src = `${cardPath}/${jsFile}`;
                document.head.appendChild(script);
                
                loadedScripts.add(cardId);
                console.log(`Loaded script for card: ${cardId}`);
            }
        } catch (error) {
            console.warn(`Failed to load script for card ${cardId}:`, error);
        }
    }

    /**
     * Render cards for a specific role
     * @param {string} role - The role to render cards for
     * @param {string} containerId - ID of the container to render cards into
     */
    async function renderCardsForRole(role, containerId = 'cards-container') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Cards container not found: ${containerId}`);
            return;
        }

        // Clear existing cards
        container.innerHTML = '';

        // Get card definitions for this role
        const cardDefs = getCardsForRole(role);
        if (!cardDefs || cardDefs.length === 0) {
            // Hide container if no cards
            container.style.display = 'none';
            return;
        }

        // Show container if we have cards
        container.style.display = 'block';

        try {
            // Load and render each card
            for (const cardDef of cardDefs) {
                const cardData = await loadCard(cardDef.id);
                
                const cardWrapper = document.createElement('div');
                cardWrapper.className = 'card-wrapper';
                cardWrapper.setAttribute('data-card-id', cardDef.id);
                cardWrapper.innerHTML = cardData.html;
                container.appendChild(cardWrapper);
            }

            // Cards are now rendered and ready for persistence
            console.log(`Rendered ${cardDefs.length} cards for role: ${role}`);
            
            // Note: Persistence refresh is handled by the caller

        } catch (error) {
            console.error('Error rendering cards:', error);
            container.innerHTML = '<div class="card card-error"><p>Error loading cards</p></div>';
        }
    }

    /**
     * Get list of card definitions for a role from cards data
     * @param {string} role - The role to get cards for
     * @returns {Array} Array of card objects with id and path
     */
    function getCardsForRole(role) {
        if (!window.cardsData || !window.cardsData[role]) {
            return [];
        }

        return window.cardsData[role] || [];
    }




    /**
     * Initialize cards system
     */
    function initialize() {
        // Cards are now managed by the moves system role change listener
        // No separate role change handling needed here
        console.log('Cards system initialized');
    }


    // Public API
    return {
        loadCard,
        renderCardsForRole,
        getCardsForRole,
        initialize
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.Cards.initialize);
} else {
    window.Cards.initialize();
}