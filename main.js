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
            
            // MUST populate role selectors immediately after data loads
            // This needs to happen before loading from URL so role values can be restored
            populateRoleSelectors();
            
            // Initialize persistence system
            window.Persistence.setupAutoPersistence(form);
            
            // Load initial state from URL (now that role selectors are populated)
            window.Persistence.loadFromURL(form);
            
            // Use the new unified layout system to render everything
            if (window.Layout) {
                await window.Layout.layoutApplication();
            }

            console.log('Application initialized successfully');

        } catch (error) {
            console.error('Failed to initialize application:', error);
            throw error;
        }
    }

    /**
     * Populate role selectors with available roles
     */
    function populateRoleSelectors() {
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
                    // Use all available roles if * is specified (excluding special roles like Everyone)
                    rolesToAdd = Object.keys(window.availableMap).filter(role => role !== 'Everyone');
                } else {
                    // Filter to only include roles that exist in availableMap (excluding special roles)
                    rolesToAdd = allowedRolesList.filter(role => window.availableMap.hasOwnProperty(role) && role !== 'Everyone');
                }
            } else {
                // No data-roles attribute, use all available roles (excluding special roles like Everyone)
                rolesToAdd = Object.keys(window.availableMap).filter(role => role !== 'Everyone');
            }
            
            // Add role options
            rolesToAdd.forEach(role => {
                const option = document.createElement('option');
                option.value = role;
                option.textContent = role;
                selector.appendChild(option);
            });
        });
    }

    /**
     * Clear all application state and UI
     */
    function clearApplication() {
        const form = document.querySelector('form');
        if (form && window.Persistence) {
            // Clear URL parameters first
            window.Persistence.clearState(form);
            
            // Then refresh the entire layout
            if (window.Layout) {
                window.Layout.layoutApplication();
            }
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
     * Set up event listeners
     */
    function setupEventListeners() {
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
        
        // Collapse all moves button
        const collapseAllButton = document.getElementById('collapse-all-moves');
        if (collapseAllButton) {
            collapseAllButton.addEventListener('click', function() {
                if (window.MovesCore) {
                    window.MovesCore.collapseAllMoves();
                }
                if (window.Cards) {
                    window.Cards.collapseAllCards();
                }
            });
        }
        
        // Expand all moves button
        const expandAllButton = document.getElementById('expand-all-moves');
        if (expandAllButton) {
            expandAllButton.addEventListener('click', function() {
                if (window.MovesCore) {
                    window.MovesCore.expandAllMoves();
                }
                if (window.Cards) {
                    window.Cards.expandAllCards();
                }
            });
        }

        // Note: Other event handlers (role changes, checkbox changes, etc.) 
        // are now handled automatically by the persistence system
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
        clearApplication,
        copyURLWithFeedback
    };

})();