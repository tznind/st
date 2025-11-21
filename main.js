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

            // Initialize clocks after layout is complete
            if (window.Clock) {
                window.Clock.initializeClocks();
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
     * Copy current URL to clipboard with visual feedback and character count
     */
    async function copyURLWithFeedback() {
        const button = document.getElementById('copy-url-button');
        if (!button) return;

        try {
            const url = await window.Persistence.copyURLToClipboard();
            const charCount = url.length;

            // Show success state
            button.classList.add('success');

            // Create and show character count flash
            showCharacterCountFlash(button, charCount);

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
     * Show role description modal
     * @param {string} roleSelectId - The ID of the role selector element
     */
    function showRoleDescription(roleSelectId) {
        const roleSelect = document.getElementById(roleSelectId);
        if (!roleSelect || !roleSelect.value) {
            alert('Please select a role first');
            return;
        }

        const roleName = roleSelect.value;
        const description = window.Utils.getRoleDescription(roleName);

        if (!description) {
            alert('No description available for this role');
            return;
        }

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'role-description-modal';
        const formattedDescription = window.TextFormatter ? window.TextFormatter.format(description) : description;
        modal.innerHTML = `
            <div class="role-description-content">
                <button class="role-description-close" aria-label="Close">&times;</button>
                <h3>${roleName}</h3>
                <p>${formattedDescription}</p>
            </div>
        `;

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Close on close button click
        const closeBtn = modal.querySelector('.role-description-close');
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });

        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        // Add to DOM
        document.body.appendChild(modal);
    }

    /**
     * Show generic help modal
     * @param {string} title - The title for the modal
     * @param {string} text - The description text
     */
    function showHelpModal(title, text) {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'role-description-modal';
        const formattedText = window.TextFormatter ? window.TextFormatter.format(text) : text;
        modal.innerHTML = `
            <div class="role-description-content">
                <button class="role-description-close" aria-label="Close">&times;</button>
                <h3>${title}</h3>
                <p>${formattedText}</p>
            </div>
        `;

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Close on close button click
        const closeBtn = modal.querySelector('.role-description-close');
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });

        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        // Add to DOM
        document.body.appendChild(modal);
    }

    /**
     * Show character count flash with color coding
     */
    function showCharacterCountFlash(button, charCount) {
        // Remove any existing flash
        const existingFlash = button.querySelector('.char-count-flash');
        if (existingFlash) {
            existingFlash.remove();
        }
        
        // Create flash element
        const flash = document.createElement('div');
        flash.className = 'char-count-flash';
        flash.textContent = `${charCount} chars`;
        
        // Add warning/danger classes based on character count
        if (charCount > 7500) {
            flash.classList.add('danger');
        } else if (charCount > 2000) {
            flash.classList.add('warning');
        }
        
        // Append to button
        button.appendChild(flash);
        
        // Show flash with smooth fade-in
        setTimeout(() => {
            flash.classList.add('show');
        }, 100);
        
        // Hide flash after 2 seconds with smooth fade-out
        setTimeout(() => {
            flash.classList.remove('show');
            // Remove element after fade completes
            setTimeout(() => {
                if (flash.parentNode) {
                    flash.parentNode.removeChild(flash);
                }
            }, 400);
        }, 2000);
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

        // Role help buttons - dynamically attach to all role selectors
        const roleSelectors = window.Utils.getRoleSelectors();
        roleSelectors.forEach(selector => {
            const helpButton = document.getElementById(`${selector.id}-help-button`);
            if (helpButton) {
                helpButton.addEventListener('click', () => showRoleDescription(selector.id));
            }
        });

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

        // Generic help button handler - automatically handles any .help-icon with data attributes
        // Usage: <button class="help-icon" data-help-title="Title" data-help-text="Description">?</button>
        document.addEventListener('click', function(e) {
            const helpButton = e.target.closest('.help-icon');
            if (!helpButton) return;

            const title = helpButton.getAttribute('data-help-title');
            const text = helpButton.getAttribute('data-help-text');

            if (title && text) {
                showHelpModal(title, text);
                e.preventDefault();
                e.stopPropagation();
            }
        });

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