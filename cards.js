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

    // Configuration for fetch middleware
    const FETCH_TIMEOUT = 10000; // 10 seconds
    const MAX_RETRIES = 2;
    const RETRY_DELAY_BASE = 500; // Base delay for exponential backoff

    // Store original fetch
    const originalFetch = window.fetch;

    /**
     * Fetch middleware with timeout and retry support
     * Automatically applied to all fetch calls in this module
     */
    const fetch = async (url, options = {}) => {
        let lastError;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            const controller = new AbortController();
            const signal = options.signal || controller.signal;
            const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

            try {
                const response = await originalFetch(url, { ...options, signal });
                clearTimeout(timeoutId);
                return response;
            } catch (error) {
                clearTimeout(timeoutId);
                lastError = error;

                // Don't retry if user explicitly aborted
                if (options.signal?.aborted) {
                    throw error;
                }

                if (attempt < MAX_RETRIES) {
                    // Exponential backoff: 500ms, 1000ms, 2000ms
                    const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
                    console.log(`Fetch failed for ${url}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    // Final attempt failed
                    if (error.name === 'AbortError') {
                        throw new Error(`Request timeout after ${FETCH_TIMEOUT}ms (${MAX_RETRIES + 1} attempts)`);
                    }
                    throw error;
                }
            }
        }

        throw lastError;
    };

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

            // Determine error type and provide helpful message
            let errorTitle = 'Card Loading Failed';
            let errorMessage = `Failed to load card: ${cardId}`;
            let errorHelp = '';

            if (error.message.includes('timeout')) {
                errorTitle = 'Card Loading Timeout';
                errorMessage = `The card "${cardId}" could not be loaded within the time limit.`;
                errorHelp = 'The remote server may be slow or unreachable. Please check your network connection and try refreshing the page.';
            } else if (error.message.includes('NetworkError') || error.name === 'TypeError' && error.message.includes('fetch')) {
                errorTitle = 'Network Error';
                errorMessage = `Unable to connect to load card: ${cardId}`;
                errorHelp = 'This may be due to a network issue or the remote server being unavailable. Please check your connection and try again.';
            } else if (error.message.includes('Failed to load card definition')) {
                errorMessage = `Card definition not found: ${cardId}`;
                errorHelp = 'The card configuration file could not be found. This may indicate an issue with the card setup.';
            }

            return {
                id: cardId,
                title: `${cardId} (Error)`,
                html: `<div class="card card-error">
                    <h3>${errorTitle}</h3>
                    <p><strong>${errorMessage}</strong></p>
                    ${errorHelp ? `<p class="error-help">${errorHelp}</p>` : ''}
                    <p class="error-details"><small>Technical details: ${error.message}</small></p>
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
     * Initialize rendered cards by calling their exported init functions
     * @param {Array} cardDefs - Array of card definitions that were rendered
     */
    function initializeRenderedCards(cardDefs) {
        // Ensure CardInitializers namespace exists
        window.CardInitializers = window.CardInitializers || {};

        cardDefs.forEach(cardDef => {
            const cardId = cardDef.id;

            // Find the rendered card element for this card
            const cardWrapper = document.querySelector(`.card-wrapper[data-card-id="${cardId}"]`);
            const cardElement = cardWrapper ? cardWrapper.querySelector('.card') : null;

            // Look for exported initialization function
            const initFunction = window.CardInitializers[cardId];
            if (typeof initFunction === 'function') {
                try {
                    console.log(`Initializing card: ${cardId}`);
                    // Pass container and null suffix (regular cards don't have duplicates)
                    initFunction(cardElement, null);
                    console.log(`Card ${cardId} initialized successfully`);
                } catch (error) {
                    console.error(`Error initializing card ${cardId}:`, error);
                }
            } else {
                // No initialization function found - that's okay, not all cards need one
                console.log(`No initialization function found for card: ${cardId} (this is fine if the card doesn't need custom logic)`);
            }
        });
    }


    /**
     * Get list of card definitions from merged availability map
     * @param {Object} mergedAvailability - Merged availability map containing cards array
     * @returns {Array} Array of card objects with id and path
     */
    function getCardsFromMergedAvailability(mergedAvailability) {
        if (!mergedAvailability || !mergedAvailability.cards) {
            return [];
        }

        // Convert card names to card objects with id and path
        return mergedAvailability.cards.map(cardName => ({
            id: cardName,
            path: `data/cards/${cardName}`
        }));
    }

    /**
     * Render cards for roles using merged availability
     * @param {Array<string>} roles - Array of roles to render cards for
     * @param {Object} mergedAvailability - Merged availability map
     * @param {string} containerId - ID of the container to render cards into
     */
    async function renderCardsForRole(roles, mergedAvailability, containerId = 'cards-container') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Cards container not found: ${containerId}`);
            return;
        }

        // Clear existing cards
        container.innerHTML = '';

        // Get card definitions from merged availability
        const cardDefs = getCardsFromMergedAvailability(mergedAvailability);
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
                cardWrapper.className = 'card-wrapper collapsed'; // Start collapsed
                cardWrapper.setAttribute('data-card-id', cardDef.id);
                
                // Create card element with collapse functionality
                const cardElement = createCollapsibleCard(cardData);
                cardWrapper.appendChild(cardElement);
                
                container.appendChild(cardWrapper);
            }

            // Cards are now rendered and ready for persistence
            console.log(`Rendered ${cardDefs.length} cards for roles: ${roles.join(', ')}`);

            // Initialize any cards that have initialization functions
            setTimeout(() => {
                initializeRenderedCards(cardDefs);

                // Format any elements with data-format-text attribute
                if (window.TextFormatter && window.TextFormatter.formatElements) {
                    window.TextFormatter.formatElements();
                }
            }, 100);

            // Note: Persistence refresh is handled by the caller

        } catch (error) {
            console.error('Error rendering cards:', error);
            container.innerHTML = '<div class="card card-error"><p>Error loading cards</p></div>';
        }
    }

    /**
     * Create a collapsible card element from card data
     * @param {Object} cardData - Card data with HTML and metadata
     * @returns {HTMLElement} Card element with collapse functionality
     */
    function createCollapsibleCard(cardData) {
        // Parse the card HTML to extract title and content
        const parser = new DOMParser();
        const doc = parser.parseFromString(cardData.html, 'text/html');
        const cardElement = doc.querySelector('.card');
        
        if (!cardElement) {
            // If no .card element found, return the HTML as-is
            const wrapper = document.createElement('div');
            wrapper.innerHTML = cardData.html;
            return wrapper.firstChild;
        }
        
        // Find the card title (h3 or .card-title)
        let titleElement = cardElement.querySelector('h3, .card-title');
        if (!titleElement) {
            // If no title found, create one from the card data
            titleElement = document.createElement('h3');
            titleElement.className = 'card-title';
            titleElement.textContent = cardData.title || cardData.id;
            cardElement.insertBefore(titleElement, cardElement.firstChild);
        }
        
        // Ensure title element has the right classes for styling
        if (!titleElement.classList.contains('card-title')) {
            titleElement.classList.add('card-title');
        }
        
        // Create collapse toggle button
        const collapseToggle = document.createElement('button');
        collapseToggle.className = 'card-collapse-toggle';
        collapseToggle.setAttribute('aria-label', `Toggle ${cardData.title || cardData.id} details`);
        collapseToggle.setAttribute('type', 'button');
        collapseToggle.innerHTML = '+'; // Plus sign (collapsed state - start collapsed)
        
        // Create content wrapper for everything except the title
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'card-content collapsed'; // Start collapsed
        
        // Move all content except the title to the content wrapper
        const allChildren = Array.from(cardElement.children);
        allChildren.forEach(child => {
            if (child !== titleElement) {
                contentWrapper.appendChild(child);
            }
        });
        
        // Add toggle button to title
        titleElement.appendChild(collapseToggle);
        
        // Add content wrapper after title
        cardElement.appendChild(contentWrapper);
        
        // Add click handlers for collapse/expand
        titleElement.addEventListener('click', function(e) {
            // Only handle clicks on the title itself or the toggle button
            if (e.target === titleElement || e.target === collapseToggle) {
                e.preventDefault();
                e.stopPropagation();
                toggleCardCollapse(collapseToggle);
            }
        });
        
        // Add keyboard accessibility
        titleElement.setAttribute('tabindex', '0');
        titleElement.setAttribute('role', 'button');
        titleElement.setAttribute('aria-expanded', 'false'); // Start collapsed
        
        titleElement.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleCardCollapse(collapseToggle);
            }
        });
        
        return cardElement;
    }
    
    /**
     * Toggle collapse/expand state for a single card
     * @param {HTMLElement} toggleButton - The collapse toggle button
     */
    function toggleCardCollapse(toggleButton) {
        const cardWrapper = toggleButton.closest('.card-wrapper');
        if (!cardWrapper) return;
        
        const contentContainer = cardWrapper.querySelector('.card-content');
        const titleElement = cardWrapper.querySelector('.card-title');
        if (!contentContainer) return;
        
        const isCurrentlyCollapsed = contentContainer.classList.contains('collapsed');
        
        if (isCurrentlyCollapsed) {
            // Expand - show minus sign
            contentContainer.classList.remove('collapsed');
            cardWrapper.classList.remove('collapsed');
            toggleButton.innerHTML = '-'; // Minus (expanded state)
            toggleButton.setAttribute('aria-label', toggleButton.getAttribute('aria-label').replace('Expand', 'Collapse'));
            if (titleElement) titleElement.setAttribute('aria-expanded', 'true');
        } else {
            // Collapse - show plus sign
            contentContainer.classList.add('collapsed');
            cardWrapper.classList.add('collapsed');
            toggleButton.innerHTML = '+'; // Plus (collapsed state)
            toggleButton.setAttribute('aria-label', toggleButton.getAttribute('aria-label').replace('Collapse', 'Expand'));
            if (titleElement) titleElement.setAttribute('aria-expanded', 'false');
        }
    }
    
    /**
     * Collapse all cards
     */
    function collapseAllCards() {
        const allCards = document.querySelectorAll('.card-wrapper');
        allCards.forEach(cardWrapper => {
            const contentContainer = cardWrapper.querySelector('.card-content');
            const toggleButton = cardWrapper.querySelector('.card-collapse-toggle');
            const titleElement = cardWrapper.querySelector('.card-title');
            
            if (contentContainer && toggleButton) {
                contentContainer.classList.add('collapsed');
                cardWrapper.classList.add('collapsed');
                toggleButton.innerHTML = '+'; // Plus (collapsed state)
                toggleButton.setAttribute('aria-label', toggleButton.getAttribute('aria-label').replace('Collapse', 'Expand'));
                if (titleElement) titleElement.setAttribute('aria-expanded', 'false');
            }
        });
    }
    
    /**
     * Expand all cards
     */
    function expandAllCards() {
        const allCards = document.querySelectorAll('.card-wrapper');
        allCards.forEach(cardWrapper => {
            const contentContainer = cardWrapper.querySelector('.card-content');
            const toggleButton = cardWrapper.querySelector('.card-collapse-toggle');
            const titleElement = cardWrapper.querySelector('.card-title');
            
            if (contentContainer && toggleButton) {
                contentContainer.classList.remove('collapsed');
                cardWrapper.classList.remove('collapsed');
                toggleButton.innerHTML = '-'; // Minus (expanded state)
                toggleButton.setAttribute('aria-label', toggleButton.getAttribute('aria-label').replace('Expand', 'Collapse'));
                if (titleElement) titleElement.setAttribute('aria-expanded', 'true');
            }
        });
    }
    
    /**
     * Get current collapse state of all cards
     * Returns a map of card IDs to their collapse state
     */
    function getCurrentCollapseState() {
        const collapseState = new Map();
        const allCards = document.querySelectorAll('.card-wrapper');
        
        allCards.forEach(cardWrapper => {
            const cardId = cardWrapper.getAttribute('data-card-id');
            const contentContainer = cardWrapper.querySelector('.card-content');
            
            if (cardId && contentContainer) {
                const isCollapsed = contentContainer.classList.contains('collapsed');
                collapseState.set(cardId, isCollapsed);
            }
        });
        
        console.log('Cards: Stored collapse state for', collapseState.size, 'cards');
        return collapseState;
    }
    
    /**
     * Restore collapse state for cards
     * @param {Map} collapseState - Map of card IDs to collapse state
     */
    function restoreCollapseState(collapseState) {
        if (!collapseState || collapseState.size === 0) {
            console.log('Cards: No collapse state to restore');
            return;
        }
        
        const allCards = document.querySelectorAll('.card-wrapper');
        let restoredCount = 0;
        
        allCards.forEach(cardWrapper => {
            const cardId = cardWrapper.getAttribute('data-card-id');
            const contentContainer = cardWrapper.querySelector('.card-content');
            const toggleButton = cardWrapper.querySelector('.card-collapse-toggle');
            const titleElement = cardWrapper.querySelector('.card-title');
            
            if (cardId && contentContainer && toggleButton) {
                const shouldBeCollapsed = collapseState.get(cardId);
                
                if (shouldBeCollapsed !== undefined) {
                    if (shouldBeCollapsed) {
                        // Collapse this card - show plus sign
                        contentContainer.classList.add('collapsed');
                        cardWrapper.classList.add('collapsed');
                        toggleButton.innerHTML = '+'; // Plus (collapsed state)
                        toggleButton.setAttribute('aria-label', toggleButton.getAttribute('aria-label').replace('Collapse', 'Expand'));
                        if (titleElement) titleElement.setAttribute('aria-expanded', 'false');
                    } else {
                        // Ensure this card is expanded - show minus sign
                        contentContainer.classList.remove('collapsed');
                        cardWrapper.classList.remove('collapsed');
                        toggleButton.innerHTML = '-'; // Minus (expanded state)
                        toggleButton.setAttribute('aria-label', toggleButton.getAttribute('aria-label').replace('Expand', 'Collapse'));
                        if (titleElement) titleElement.setAttribute('aria-expanded', 'true');
                    }
                    restoredCount++;
                }
            }
        });
        
        console.log('Cards: Restored collapse state for', restoredCount, 'cards');
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
        getCardsFromMergedAvailability,
        initialize,
        collapseAllCards,
        expandAllCards,
        getCurrentCollapseState,
        restoreCollapseState
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.Cards.initialize);
} else {
    window.Cards.initialize();
}