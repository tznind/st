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

                // IMPORTANT: Clock initialization creates hidden inputs for persistence
                // We need to reload from URL to populate these newly created inputs
                // and then refresh the visual displays
                window.Persistence.loadFromURL(form);
                window.Clock.refreshClockDisplays();
            }

            // Handle initial navigation from URL hash (e.g., shared links with #move-xxx)
            if (window.location.hash.startsWith('#move-')) {
                const moveId = window.location.hash.substring(6); // Remove '#move-' prefix
                const moveElement = document.querySelector(`[data-move-id="${moveId}"]`);
                if (moveElement) {
                    const category = moveElement.closest('.move-category');
                    if (category) {
                        const categoryHeader = category.querySelector('.category-header-text');
                        const categoryName = categoryHeader ? categoryHeader.textContent.trim() : '';
                        if (categoryName) {
                            // Don't update history since we're loading from an existing hash
                            navigateToMove(moveId, categoryName, false);
                        }
                    }
                }
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
                <div class="help-text"></div>
            </div>
        `;

        // Insert formatted HTML separately to avoid escaping
        const textContainer = modal.querySelector('.help-text');
        textContainer.innerHTML = formattedText;

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
     * Show table of contents modal with all available moves
     */
    function showContentsModal() {
        // Get current roles and their available moves
        const currentRoles = window.Utils ? window.Utils.getCurrentRoles() : [];
        if (!currentRoles || currentRoles.length === 0 || !window.moves) {
            alert('Please select a role first');
            return;
        }

        // Get merged availability for current roles
        const mergedAvailability = window.Utils ? window.Utils.mergeRoleAvailability(currentRoles) : {};

        // Check if hiding untaken moves
        const hideUntakenCheckbox = document.getElementById('hide_untaken');
        const hideUntaken = hideUntakenCheckbox && hideUntakenCheckbox.checked;
        const urlParams = new URLSearchParams(location.search);

        // Group moves by category (similar to how they're rendered)
        const categorized = window.MovesCore ?
            window.MovesCore.groupMovesByCategory(window.moves, mergedAvailability, hideUntaken, urlParams) :
            new Map();

        if (categorized.size === 0) {
            alert('No moves available');
            return;
        }

        // Sort categories
        const sortedCategories = window.MovesCore ?
            window.MovesCore.sortCategories(Array.from(categorized.keys())) :
            Array.from(categorized.keys()).sort();

        // Build the contents HTML
        let contentsHTML = '<div class="contents-list">';
        sortedCategories.forEach(categoryName => {
            const moves = categorized.get(categoryName);

            // Sort moves by weight (same as rendering logic)
            const sortedMoves = moves.slice().sort((a, b) => {
                const weightA = a.weight !== undefined ? a.weight : 0;
                const weightB = b.weight !== undefined ? b.weight : 0;
                return weightA - weightB;
            });

            contentsHTML += `<div class="contents-category">`;
            contentsHTML += `<h4>${categoryName}</h4>`;
            contentsHTML += `<ul>`;
            sortedMoves.forEach(move => {
                // Strip HTML tags from title for display
                const displayTitle = move.title.replace(/<[^>]*>/g, '');
                contentsHTML += `<li><a href="#" class="contents-move-link" data-move-id="${move.id}" data-move-category="${categoryName}">${displayTitle}</a></li>`;
            });
            contentsHTML += `</ul>`;
            contentsHTML += `</div>`;
        });
        contentsHTML += '</div>';

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'role-description-modal contents-modal';
        modal.innerHTML = `
            <div class="role-description-content contents-content">
                <button class="role-description-close" aria-label="Close">&times;</button>
                <h3>Table of Contents</h3>
                ${contentsHTML}
            </div>
        `;

        // Add click handlers for move links
        modal.querySelectorAll('.contents-move-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const moveId = link.getAttribute('data-move-id');
                const categoryName = link.getAttribute('data-move-category');
                modal.remove();
                navigateToMove(moveId, categoryName);
            });
        });

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

        // Show contents button
        const showContentsButton = document.getElementById('show-contents');
        if (showContentsButton) {
            showContentsButton.addEventListener('click', showContentsModal);
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

        // Glossary term handler - automatically handles any .glossary-term with data attributes
        // Terms are automatically generated by TextFormatter when formatting bold/italic text
        document.addEventListener('click', function(e) {
            const glossaryTerm = e.target.closest('.glossary-term');
            if (!glossaryTerm) return;

            const title = glossaryTerm.getAttribute('data-term-title');
            const text = glossaryTerm.getAttribute('data-term-text');

            if (title && text) {
                // Close any existing modals before opening a new one
                document.querySelectorAll('.role-description-modal').forEach(modal => modal.remove());

                showHelpModal(title, text);
                e.preventDefault();
                e.stopPropagation();
            }
        });

        // Hide help checkbox handler
        const hideHelpCheckbox = document.getElementById('hide_help');
        if (hideHelpCheckbox) {
            // Set initial state from checkbox
            document.body.classList.toggle('hide-help', hideHelpCheckbox.checked);

            // Toggle class when checkbox changes
            hideHelpCheckbox.addEventListener('change', function() {
                document.body.classList.toggle('hide-help', this.checked);
            });
        }

        // Move reference handler - automatically handles clicking on move references
        // Move references are automatically generated by TextFormatter when formatting bold text that matches a move title
        document.addEventListener('click', function(e) {
            const moveReference = e.target.closest('.move-reference');
            if (!moveReference) return;

            const moveId = moveReference.getAttribute('data-move-id');
            const categoryName = moveReference.getAttribute('data-move-category');

            if (moveId && categoryName) {
                // Close any existing modals before navigating
                document.querySelectorAll('.role-description-modal').forEach(modal => modal.remove());

                // Navigate to the move
                navigateToMove(moveId, categoryName);
                e.preventDefault();
                e.stopPropagation();
            }
        });

        // Browser back/forward navigation handler
        window.addEventListener('popstate', function(e) {
            if (e.state && e.state.moveId && e.state.categoryName) {
                // Navigate to the move from history state (don't update history again)
                navigateToMove(e.state.moveId, e.state.categoryName, false);
            } else if (window.location.hash.startsWith('#move-')) {
                // Handle direct navigation or fallback to hash
                const moveId = window.location.hash.substring(6); // Remove '#move-' prefix
                const moveElement = document.querySelector(`[data-move-id="${moveId}"]`);
                if (moveElement) {
                    const category = moveElement.closest('.move-category');
                    if (category) {
                        const categoryHeader = category.querySelector('.category-header-text');
                        const categoryName = categoryHeader ? categoryHeader.textContent.trim() : '';
                        if (categoryName) {
                            navigateToMove(moveId, categoryName, false);
                        }
                    }
                }
            }
        });

        // Note: Other event handlers (role changes, checkbox changes, etc.)
        // are now handled automatically by the persistence system
    }

    /**
     * Navigate to a specific move by expanding its category and scrolling to it
     * @param {string} moveId - The ID of the move to navigate to
     * @param {string} categoryName - The category containing the move
     * @param {boolean} updateHistory - Whether to add this navigation to browser history (default: true)
     */
    function navigateToMove(moveId, categoryName, updateHistory = true) {
        const movesContainer = document.getElementById('moves');
        if (!movesContainer) {
            console.warn('Moves container not found');
            return;
        }

        // Find the category header
        const categoryHeaders = Array.from(movesContainer.querySelectorAll('.category-header'));
        const categoryHeader = categoryHeaders.find(header => {
            const headerText = header.querySelector('.category-header-text');
            return headerText && headerText.textContent.trim() === categoryName;
        });

        // Expand the category if it's collapsed
        if (categoryHeader && categoryHeader.classList.contains('collapsed')) {
            if (window.MovesCore) {
                window.MovesCore.toggleCategoryCollapse(categoryHeader);
            }
        }

        // Find the move element by its data-move-id attribute
        const moveElement = movesContainer.querySelector(`.move[data-move-id="${moveId}"]`);

        if (moveElement) {
            // Add to browser history if requested
            if (updateHistory) {
                const url = new URL(window.location);
                url.hash = `move-${moveId}`;
                window.history.pushState({ moveId, categoryName }, '', url);
            }

            // Scroll to the move with smooth animation
            moveElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Add a brief highlight effect
            moveElement.classList.add('highlight-move');
            setTimeout(() => {
                moveElement.classList.remove('highlight-move');
            }, 2000);
        } else {
            console.warn(`Move with ID "${moveId}" not found in category "${categoryName}"`);
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
        clearApplication,
        copyURLWithFeedback
    };

})();