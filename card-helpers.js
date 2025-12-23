/**
 * Card Helper Framework
 * Provides utilities and lifecycle management to make card development easier
 */

window.CardHelpers = (function() {
    'use strict';

    // Registry of initialized cards and their DOM elements
    const initializedCards = new Map();

    /**
     * Register a card for automatic initialization
     * @param {string} cardId - ID of the card
     * @param {function} initFunction - Function to call when card is ready
     */
    function registerCard(cardId, initFunction) {
        console.log(`Registering card: ${cardId}`);
        
        // Create a persistent observer that handles both addition and removal
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                // Handle added nodes
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) { // Element node
                        const cardElement = node.querySelector(`[data-card-id="${cardId}"]`) || 
                                          (node.getAttribute && node.getAttribute('data-card-id') === cardId ? node : null);
                        
                        if (cardElement) {
                            const existingElement = initializedCards.get(cardId);
                            
                            // Only initialize if this is a new card element or the existing one is no longer in DOM
                            if (!existingElement || !document.body.contains(existingElement)) {
                                console.log(`Initializing card: ${cardId}${existingElement ? ' (DOM recreated)' : ' (first time)'}`);
                                
                                // Store reference to this card element
                                initializedCards.set(cardId, cardElement);
                                
                                // Initialize after a short delay to ensure DOM is fully ready
                                setTimeout(() => {
                                    try {
                                        // Pass container and null suffix (registerCard is for regular cards, not duplicates)
                                        initFunction(cardElement, null);
                                        console.log(`Card ${cardId} initialized via CardHelpers`);
                                    } catch (error) {
                                        console.error(`Error initializing card ${cardId}:`, error);
                                    }
                                }, 50);
                            }
                        }
                    }
                }
                
                // Handle removed nodes
                for (const node of mutation.removedNodes) {
                    if (node.nodeType === 1) { // Element node
                        const cardElement = node.querySelector ? 
                                          (node.querySelector(`[data-card-id="${cardId}"]`) || 
                                           (node.getAttribute && node.getAttribute('data-card-id') === cardId ? node : null)) : null;
                        
                        if (cardElement) {
                            const storedElement = initializedCards.get(cardId);
                            if (storedElement === cardElement) {
                                console.log(`Card ${cardId} DOM removed, ready for re-initialization`);
                                initializedCards.delete(cardId);
                            }
                        }
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Store the observer reference in case we need to clean up later
        if (!window.cardObservers) window.cardObservers = new Map();
        window.cardObservers.set(cardId, observer);
    }

    /**
     * Safe element selection with error handling
     * Supports scoped selection for duplicate cards
     * @param {string} id - Element ID to select (base ID without suffix)
     * @param {HTMLElement} container - Optional container to search within
     * @param {string} suffix - Optional suffix for duplicate instances
     * @returns {Element|null} Element or null if not found
     */
    function getElement(id, container = null, suffix = null) {
        // Apply suffix if provided
        const fullId = suffix ? `${id}_${suffix}` : id;

        // Search within container if provided, otherwise use document
        const element = container ?
            container.querySelector(`#${fullId}`) :
            document.getElementById(fullId);

        if (!element) {
            console.warn(`Card element not found: ${fullId}${container ? ' (in container)' : ''}`);
        }
        return element;
    }

    /**
     * Create scoped helpers for a specific card instance
     * This allows card JS to work with both regular and duplicate instances
     * @param {HTMLElement} container - Container element for this card
     * @param {string} suffix - Suffix for this instance (null for non-duplicates)
     * @returns {Object} Scoped helper functions
     */
    function createScopedHelpers(container = null, suffix = null) {
        return {
            // Scoped getElement
            getElement: (id) => getElement(id, container, suffix),

            // Scoped addEventListener
            addEventListener: (elementId, event, handler) => {
                const element = getElement(elementId, container, suffix);
                if (element) {
                    element.addEventListener(event, handler);
                }
            },

            // Scoped getValue
            getValue: (id) => {
                const el = getElement(id, container, suffix);
                return el ? el.value : null;
            },

            // Scoped setValue
            setValue: (id, value) => {
                const el = getElement(id, container, suffix);
                if (el) {
                    el.value = value;
                    savePersistence();
                }
            },

            // Scoped setChecked
            setChecked: (id, checked) => {
                const el = getElement(id, container, suffix);
                if (el) {
                    el.checked = checked;
                    savePersistence();
                }
            },

            // Scoped isChecked
            isChecked: (id) => {
                const el = getElement(id, container, suffix);
                return el ? el.checked : false;
            },

            // Expose container and suffix for advanced use
            container,
            suffix,

            // Re-export all other helpers
            savePersistence,
            ValidationPatterns,
            DependencyPatterns,

            // Scoped setupAutoFill
            setupAutoFill: (selectId, optionsMap, confirmMessage) => {
                const scopedHelpers = createScopedHelpers(container, suffix);
                scopedHelpers.addEventListener(selectId, 'change', function() {
                    const selectedValue = this.value;
                    const defaults = optionsMap[selectedValue];

                    if (defaults) {
                        const message = confirmMessage ? confirmMessage(selectedValue, defaults) :
                                       `Auto-fill typical values for ${selectedValue.replace('_', ' ')}?`;

                        if (confirm(message)) {
                            for (const [fieldId, value] of Object.entries(defaults)) {
                                const field = scopedHelpers.getElement(fieldId);
                                if (field && !field.value) {
                                    field.value = value;
                                }
                            }
                            savePersistence();
                        }
                    }
                });
            },

            // Scoped setupVisualValidation
            setupVisualValidation: (inputId, validator) => {
                const scopedHelpers = createScopedHelpers(container, suffix);
                scopedHelpers.addEventListener(inputId, 'input', function() {
                    const result = validator(this.value);

                    if (result && result.style) {
                        Object.assign(this.style, result.style);
                    }
                });
            },

            // Scoped setupDependency
            setupDependency: (triggerFieldId, event, dependencyCheck) => {
                const scopedHelpers = createScopedHelpers(container, suffix);
                scopedHelpers.addEventListener(triggerFieldId, event, function() {
                    dependencyCheck(this, scopedHelpers);
                });
            },

            // Dynamic Table Helpers

            /**
             * Add a row to a dynamic table with optional values
             * @param {string} tableId - Base table ID (without suffix)
             * @param {Object} values - Optional object with field values {fieldName: value}
             */
            addTableRow: (tableId, values = {}) => {
                const fullTableId = suffix ? `${tableId}_${suffix}` : tableId;
                if (window.DynamicTable && window.DynamicTable.addRow) {
                    window.DynamicTable.addRow(fullTableId, values);
                }
            },

            /**
             * Clear all rows from a dynamic table
             * @param {string} tableId - Base table ID (without suffix)
             */
            clearTable: (tableId) => {
                const fullTableId = suffix ? `${tableId}_${suffix}` : tableId;
                if (window.DynamicTable && window.DynamicTable.clearTable) {
                    window.DynamicTable.clearTable(fullTableId);
                }
            },

            /**
             * Get all data from a dynamic table
             * @param {string} tableId - Base table ID (without suffix)
             * @returns {Array} Array of row objects
             */
            getTableData: (tableId) => {
                const fullTableId = suffix ? `${tableId}_${suffix}` : tableId;
                if (window.DynamicTable && window.DynamicTable.getTableData) {
                    return window.DynamicTable.getTableData(fullTableId);
                }
                return [];
            },

            /**
             * Set table data from an array of objects
             * @param {string} tableId - Base table ID (without suffix)
             * @param {Array} data - Array of row objects {fieldName: value}
             */
            setTableData: (tableId, data) => {
                const fullTableId = suffix ? `${tableId}_${suffix}` : tableId;
                if (window.DynamicTable && window.DynamicTable.setTableData) {
                    window.DynamicTable.setTableData(fullTableId, data);
                }
            },

            /**
             * Add a track counter to the card
             * @param {string} containerId - ID of container element to add track to
             * @param {Array} trackConfigs - Array of track configs (same format as moves/stats)
             * @returns {HTMLElement} The created track container
             *
             * Example:
             * helpers.addTrack('loyalty-container', [
             *   { name: 'Loyalty', max: 3, shape: 'circle' }
             * ]);
             */
            addTrack: (containerId, trackConfigs) => {
                if (!window.Track || !trackConfigs || !Array.isArray(trackConfigs)) {
                    console.warn('addTrack: Invalid parameters or Track module not available');
                    return null;
                }

                const containerElement = getElement(containerId, container, suffix);
                if (!containerElement) {
                    console.warn(`addTrack: Container not found: ${containerId}`);
                    return null;
                }

                // Create a pseudo-move object for the Track system
                const fullContainerId = suffix ? `${containerId}_${suffix}` : containerId;
                const pseudoMove = {
                    id: fullContainerId,
                    tracks: trackConfigs
                };

                const urlParams = new URLSearchParams(location.search);
                const trackDisplay = window.Track.createTrackDisplay(pseudoMove, urlParams);

                if (trackDisplay) {
                    containerElement.appendChild(trackDisplay);
                    // Track display is fully initialized with event handlers - no need to call initializeTrackCounters
                }

                return trackDisplay;
            }
        };
    }

    /**
     * Safe event listener attachment
     * @param {string} elementId - ID of element to attach to
     * @param {string} event - Event type
     * @param {function} handler - Event handler function
     */
    function addEventListener(elementId, event, handler) {
        const element = getElement(elementId);
        if (element) {
            element.addEventListener(event, handler);
        }
    }

    /**
     * Trigger persistence save
     */
    function savePersistence() {
        if (window.Persistence) {
            const form = document.querySelector('form');
            if (form) {
                window.Persistence.saveToURL(form);
            }
        }
    }

    /**
     * Auto-fill form fields from defaults object
     * @param {Object} fieldDefaults - Object mapping field IDs to values
     * @param {boolean} onlyEmpty - Only fill empty fields (default: true)
     */
    function autoFillFields(fieldDefaults, onlyEmpty = true) {
        for (const [fieldId, value] of Object.entries(fieldDefaults)) {
            const field = getElement(fieldId);
            if (field && (!onlyEmpty || !field.value)) {
                field.value = value;
            }
        }
        savePersistence();
    }

    /**
     * Set up auto-fill based on select dropdown
     * @param {string} selectId - ID of the select element
     * @param {Object} optionsMap - Map of option values to field defaults
     * @param {function} confirmMessage - Function to generate confirmation message
     */
    function setupAutoFill(selectId, optionsMap, confirmMessage) {
        addEventListener(selectId, 'change', function() {
            const selectedValue = this.value;
            const defaults = optionsMap[selectedValue];
            
            if (defaults) {
                const message = confirmMessage ? confirmMessage(selectedValue, defaults) : 
                               `Auto-fill typical values for ${selectedValue.replace('_', ' ')}?`;
                
                if (confirm(message)) {
                    autoFillFields(defaults);
                }
            }
        });
    }

    /**
     * Set up visual validation feedback
     * @param {string} inputId - ID of input to validate
     * @param {function} validator - Function that returns {valid: boolean, style: object}
     */
    function setupVisualValidation(inputId, validator) {
        addEventListener(inputId, 'input', function() {
            const result = validator(this.value);
            
            if (result && result.style) {
                Object.assign(this.style, result.style);
            }
        });
    }

    /**
     * Set up dependency checking between fields
     * @param {string} triggerFieldId - Field that triggers the check
     * @param {string} event - Event type ('change', 'input', etc.)
     * @param {function} dependencyCheck - Function to check dependencies
     */
    function setupDependency(triggerFieldId, event, dependencyCheck) {
        addEventListener(triggerFieldId, event, function() {
            dependencyCheck(this, {
                getValue: (id) => {
                    const el = getElement(id);
                    return el ? el.value : null;
                },
                setValue: (id, value) => {
                    const el = getElement(id);
                    if (el) {
                        el.value = value;
                        savePersistence();
                    }
                },
                setChecked: (id, checked) => {
                    const el = getElement(id);
                    if (el) {
                        el.checked = checked;
                        savePersistence();
                    }
                },
                isChecked: (id) => {
                    const el = getElement(id);
                    return el ? el.checked : false;
                }
            });
        });
    }

    /**
     * Create a button with specified properties
     * @param {Object} options - Button options
     * @returns {HTMLButtonElement} Created button
     */
    function createButton(options) {
        const button = document.createElement('button');
        button.type = 'button';
        
        if (options.text) button.textContent = options.text;
        if (options.title) button.title = options.title;
        if (options.className) button.className = options.className;
        if (options.style) Object.assign(button.style, options.style);
        if (options.onclick) button.addEventListener('click', options.onclick);
        
        return button;
    }

    /**
     * Add a utility button next to a field
     * @param {string} fieldId - ID of the field to attach button to
     * @param {Object} buttonOptions - Button configuration
     */
    function addUtilityButton(fieldId, buttonOptions) {
        const field = getElement(fieldId);
        if (field && field.parentElement) {
            const button = createButton(buttonOptions);
            field.parentElement.appendChild(button);
        }
    }

    /**
     * Common validation patterns
     */
    const ValidationPatterns = {
        /**
         * Create a numeric range validator with visual feedback
         * @param {Array} ranges - Array of {max, color, bgColor} objects
         */
        numericRange: (ranges) => (value) => {
            const num = parseInt(value);
            if (!num) return { style: { backgroundColor: '', color: '' } };
            
            for (const range of ranges) {
                if (num <= range.max) {
                    return {
                        valid: range.valid !== false,
                        style: {
                            backgroundColor: range.bgColor || '',
                            color: range.color || ''
                        }
                    };
                }
            }
            return { style: { backgroundColor: '', color: '' } };
        }
    };

    // Track if hide-when-untaken has been initialized to prevent duplicate listeners
    let hideWhenUntakenInitialized = false;

    /**
     * Initialize hide-when-untaken functionality
     * Automatically hides/shows elements based on data-hide-when-untaken attribute
     *
     * Usage in card HTML:
     * <div data-hide-when-untaken="checkbox_id">
     *   This element will be hidden when checkbox_id is unchecked and "hide untaken moves" is enabled
     * </div>
     */
    function initializeHideWhenUntaken() {
        // Find the global hide_untaken checkbox
        const hideUntakenCheckbox = document.getElementById('hide_untaken');
        if (!hideUntakenCheckbox) return;

        // Function to update visibility of all elements with data-hide-when-untaken
        function updateHideWhenUntaken() {
            const hideUntaken = hideUntakenCheckbox.checked;
            const elementsToToggle = document.querySelectorAll('[data-hide-when-untaken]');

            elementsToToggle.forEach(element => {
                const checkboxId = element.getAttribute('data-hide-when-untaken');
                const checkbox = document.getElementById(checkboxId);

                if (checkbox) {
                    // Hide if: hide_untaken is checked AND the referenced checkbox is unchecked
                    if (hideUntaken && !checkbox.checked) {
                        element.style.display = 'none';
                    } else {
                        element.style.display = '';
                    }
                } else {
                    console.warn(`Hide-when-untaken: Checkbox not found: ${checkboxId}`);
                }
            });
        }

        // Only add event listeners once
        if (!hideWhenUntakenInitialized) {
            // Listen for changes to hide_untaken checkbox
            hideUntakenCheckbox.addEventListener('change', updateHideWhenUntaken);

            // Listen for changes to any checkbox that might be referenced
            document.addEventListener('change', (event) => {
                const target = event.target;
                if (target.type === 'checkbox' && target.id) {
                    // Check if any element references this checkbox
                    const referencingElements = document.querySelectorAll(`[data-hide-when-untaken="${target.id}"]`);
                    if (referencingElements.length > 0) {
                        updateHideWhenUntaken();
                    }
                }
            });

            hideWhenUntakenInitialized = true;
        }

        // Always run update when called (to handle newly rendered elements)
        updateHideWhenUntaken();
    }

    /**
     * Common dependency patterns
     */
    const DependencyPatterns = {
        /**
         * Require minimum stat value for equipment
         * @param {string} statField - ID of stat field to check
         * @param {number} minValue - Minimum required value
         * @param {string} message - Confirmation message
         */
        requireMinStat: (statField, minValue, message) => (triggerElement, helpers) => {
            if (triggerElement.checked) {
                const statValue = parseInt(helpers.getValue(statField)) || 0;
                if (statValue < minValue) {
                    const adjustMessage = message || `This requires ${statField.replace('_', ' ')} ${minValue}+. Increase stat?`;
                    if (confirm(adjustMessage)) {
                        helpers.setValue(statField, Math.max(minValue, minValue + 5));
                    } else {
                        triggerElement.checked = false;
                    }
                }
            }
        },

        /**
         * Conflicting checkboxes (only one can be true)
         * @param {string} conflictFieldId - ID of conflicting field
         * @param {string} message - Confirmation message
         */
        conflictingCheckboxes: (conflictFieldId, message) => (triggerElement, helpers) => {
            if (triggerElement.checked && helpers.isChecked(conflictFieldId)) {
                if (confirm(message)) {
                    helpers.setChecked(conflictFieldId, false);
                }
            }
        }
    };

    // Public API
    return {
        registerCard,
        getElement,
        addEventListener,
        savePersistence,
        autoFillFields,
        setupAutoFill,
        setupVisualValidation,
        setupDependency,
        addUtilityButton,
        createButton,
        createScopedHelpers,  // NEW: For duplicate card support
        initializeHideWhenUntaken,  // NEW: Auto hide-when-untaken functionality
        ValidationPatterns,
        DependencyPatterns
    };

})();