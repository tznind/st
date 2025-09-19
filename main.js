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
            
            // Populate role selectors with specified roles (or all roles if no data-roles attribute)
            const roleSelectors = window.Utils.getRoleSelectors();
            roleSelectors.forEach(selector => {
                // Clear existing options (except the first "Select..." option)
                while (selector.children.length > 1) {
                    selector.removeChild(selector.lastChild);
                }
                
                // Get allowed roles for this selector from data-roles attribute
                const allowedRoles = selector.getAttribute('data-roles');
                let rolesToAdd;
                
                if (allowedRoles) {
                    // Parse comma-separated list and trim whitespace
                    const allowedRolesList = allowedRoles.split(',').map(role => role.trim());
                    
                    // Check if wildcard * is present
                    if (allowedRolesList.includes('*')) {
                        // Use all available roles if * is specified
                        rolesToAdd = Object.keys(window.availableMap);
                    } else {
                        // Filter to only include roles that exist in availableMap
                        rolesToAdd = allowedRolesList.filter(role => window.availableMap.hasOwnProperty(role));
                    }
                } else {
                    // No data-roles attribute, use all available roles
                    rolesToAdd = Object.keys(window.availableMap);
                }
                
                // Add role options
                rolesToAdd.forEach(role => {
                    const option = document.createElement('option');
                    option.value = role;
                    option.textContent = role;
                    selector.appendChild(option);
                });
            });
            
            // Initialize persistence first
            window.Persistence.setupAutoPersistence(form);
            
            // Load initial state from URL
            window.Persistence.loadFromURL(form);
            
            // Render initial moves and cards based on selected roles
            const selectedRoles = window.Utils.getCurrentRoles();
            if (selectedRoles.length > 0) {
                await renderRoleContent(selectedRoles, true);
            }

            console.log('Application initialized successfully');

        } catch (error) {
            console.error('Failed to initialize application:', error);
            throw error;
        }
    }

    /**
     * Render all content for roles (cards and moves)
     * @param {Array<string>} roles - Array of roles to render content for
     * @param {boolean} isInitialLoad - Whether this is the initial page load
     */
    async function renderRoleContent(roles, isInitialLoad = false) {
        if (!Array.isArray(roles) || roles.length === 0) return;
        
        // Create merged availability map for multiple roles
        const mergedAvailability = window.Utils.mergeRoleAvailability(roles);
        
        // Render cards first (async) - use merged availability
        if (window.Cards) {
            await window.Cards.renderCardsForRole(roles, mergedAvailability);
        }
        
        // Then render moves (without persistence refresh during initial load)
        if (window.Moves) {
            window.Moves.renderMovesForRole(roles, mergedAvailability, !isInitialLoad);
        }
        
        // Learned moves are restored automatically by their takefrom sections
        // Card grants are now handled automatically by the persistence system
        
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
        const selectedRoles = window.Utils.getCurrentRoles();
        if (selectedRoles.length > 0) {
            const mergedAvailability = window.Utils.mergeRoleAvailability(selectedRoles);
            
            // Only re-render moves, not cards (cards shouldn't change when hiding/showing moves)
            if (window.Moves) {
                window.Moves.renderMovesForRole(selectedRoles, mergedAvailability);
            }
            // Card grants are handled automatically by the persistence system
            
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
     * Handle role selection change for any role selector
     */
    async function handleRoleChange() {
        const selectedRoles = window.Utils.getCurrentRoles();
        if (selectedRoles.length > 0) {
            await renderRoleContent(selectedRoles);
        } else {
            // Clear content when no roles selected
            const movesContainer = document.getElementById('moves');
            const cardsContainer = document.getElementById('cards-container');
            if (movesContainer) movesContainer.innerHTML = '';
            if (cardsContainer) cardsContainer.innerHTML = '';
        }
    }

    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Set up event listeners for all role selectors
        const roleSelectors = window.Utils.getRoleSelectors();
        roleSelectors.forEach(selector => {
            selector.addEventListener('change', handleRoleChange);
        });
        
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