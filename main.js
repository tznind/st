/**
 * Main Application - Character Sheet
 * Initialization and event handling for the character sheet application
 */

(function() {
    'use strict';

    /**
     * Initialize the application after all dependencies are loaded
     */
    async function initializeApp() {
        const form = document.querySelector('form');
        const roleSelect = document.getElementById('role');
        
        if (!form || !roleSelect) {
            throw new Error('Required form elements not found');
        }

        try {
            // Initialize moves data from separate role files
            await window.initializeMovesData();
            
            // Render stats
            window.renderStats('#stats-container', window.hexStats);
            
            // Populate role options
            Object.keys(window.availableMap).forEach(role => {
                const option = document.createElement('option');
                option.value = role;
                option.textContent = role;
                roleSelect.appendChild(option);
            });
            
            // Initialize persistence first
            window.Persistence.setupAutoPersistence(form);
            
            // Load initial state from URL
            window.Persistence.loadFromURL(form);
            
            // Render initial moves and cards based on selected role
            const initialRole = roleSelect.value;
            if (initialRole) {
                await renderRoleContent(initialRole, true);
            }

            console.log('Application initialized successfully');

        } catch (error) {
            console.error('Failed to initialize application:', error);
            throw error;
        }
    }

    /**
     * Render all content for a role (cards and moves)
     * @param {string} role - The role to render content for
     * @param {boolean} isInitialLoad - Whether this is the initial page load
     */
    async function renderRoleContent(role, isInitialLoad = false) {
        if (!role) return;

        // Render cards first (async)
        if (window.Cards) {
            await window.Cards.renderCardsForRole(role);
        }
        
        // Then render moves (without persistence refresh during initial load)
        if (window.Moves) {
            window.Moves.renderMovesForRole(role, !isInitialLoad);
        }
        
        // Learned moves are restored automatically by their takefrom sections
        
        // Handle card grants for the role
        if (window.GrantCard) {
            window.GrantCard.handleRoleChange(role);
        }
        
        // Refresh persistence after everything loads (longer delay for initial load)
        const delay = isInitialLoad ? 500 : 100;
        setTimeout(() => {
            const form = document.querySelector('form');
            if (form && window.Persistence) {
                window.Persistence.refreshPersistence(form);
            }
        }, delay);
    }

    /**
     * Clear all application state and UI
     */
    function clearApplication() {
        const form = document.querySelector('form');
        if (form && window.Persistence) {
            window.Persistence.clearState(form);
        }
        
        // Clear moves display (includes inline cards)
        const movesContainer = document.getElementById('moves');
        if (movesContainer) {
            movesContainer.innerHTML = '';
        }
        
        // Clear cards display
        const cardsContainer = document.getElementById('cards-container');
        if (cardsContainer) {
            cardsContainer.innerHTML = '';
        }
    }

    /**
     * Copy current URL to clipboard with visual feedback
     */
    async function copyURLWithFeedback() {
        const button = document.getElementById('copy-url-button');
        if (!button) return;

        try {
            await window.Persistence.copyURLToClipboard();
            
            // Show success state
            button.classList.add('success');
            
            // Reset after 2 seconds
            setTimeout(() => {
                button.classList.remove('success');
            }, 2000);
            
        } catch (error) {
            console.error('Failed to copy URL:', error);
            alert('Failed to copy URL to clipboard');
        }
    }

    /**
     * Handle hide untaken moves toggle - only re-render moves, not cards
     */
    function handleHideUntakenToggle() {
        const roleSelect = document.getElementById('role');
        if (!roleSelect) return;

        const currentRole = roleSelect.value;
        if (currentRole) {
            // Only re-render moves, not cards (cards shouldn't change when hiding/showing moves)
            if (window.Moves) {
                window.Moves.renderMovesForRole(currentRole);
            }
            if (window.GrantCard) {
                window.GrantCard.handleRoleChange(currentRole);
            }
            
            // Refresh persistence after moves are re-rendered
            setTimeout(() => {
                const form = document.querySelector('form');
                if (form && window.Persistence) {
                    window.Persistence.refreshPersistence(form);
                }
            }, 100);
        }
    }

    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Role dropdown change
        const roleSelect = document.getElementById('role');
        if (roleSelect) {
            roleSelect.addEventListener('change', async (event) => {
                const newRole = event.target.value;
                if (newRole) {
                    await renderRoleContent(newRole);
                } else {
                    // Clear content when no role selected
                    const movesContainer = document.getElementById('moves');
                    const cardsContainer = document.getElementById('cards-container');
                    if (movesContainer) movesContainer.innerHTML = '';
                    if (cardsContainer) cardsContainer.innerHTML = '';
                }
            });
        }
        
        // Clear button
        const clearButton = document.getElementById('clear-button');
        if (clearButton) {
            clearButton.addEventListener('click', clearApplication);
        }

        // Copy URL button
        const copyButton = document.getElementById('copy-url-button');
        if (copyButton) {
            copyButton.addEventListener('click', copyURLWithFeedback);
        }

        // Hide untaken moves checkbox
        const hideUntakenCheckbox = document.getElementById('hide_untaken');
        if (hideUntakenCheckbox) {
            hideUntakenCheckbox.addEventListener('change', handleHideUntakenToggle);
        }
    }

    /**
     * Start the application
     */
    async function startApplication() {
        try {
            await initializeApp();
            setupEventListeners();
        } catch (error) {
            console.error('Failed to start application:', error);
            alert('Failed to initialize the character sheet. Please refresh the page.');
        }
    }

    // Auto-start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startApplication);
    } else {
        startApplication();
    }


    // Export for debugging/testing
    window.CharacterSheet = {
        renderRoleContent,
        clearApplication,
        copyURLWithFeedback
    };

})();