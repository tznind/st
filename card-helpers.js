/**
 * Card Helper Framework
 * Provides utilities and lifecycle management to make card development easier
 */

window.CardHelpers = (function() {
    'use strict';

    // Registry of initialized cards
    const initializedCards = new Set();

    /**
     * Register a card for automatic initialization
     * @param {string} cardId - ID of the card
     * @param {function} initFunction - Function to call when card is ready
     */
    function registerCard(cardId, initFunction) {
        // Wait for the card to be rendered in DOM
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) { // Element node
                        const cardElement = node.querySelector(`[data-card-id="${cardId}"]`) || 
                                          (node.getAttribute && node.getAttribute('data-card-id') === cardId ? node : null);
                        
                        if (cardElement && !initializedCards.has(cardId)) {
                            initializedCards.add(cardId);
                            observer.disconnect();
                            
                            // Initialize after a short delay to ensure DOM is fully ready
                            setTimeout(() => {
                                try {
                                    initFunction();
                                    console.log(`Card ${cardId} initialized via CardHelpers`);
                                } catch (error) {
                                    console.error(`Error initializing card ${cardId}:`, error);
                                }
                            }, 50);
                            break;
                        }
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Safe element selection with error handling
     * @param {string} id - Element ID to select
     * @returns {Element|null} Element or null if not found
     */
    function getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Card element not found: ${id}`);
        }
        return element;
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
        ValidationPatterns,
        DependencyPatterns
    };

})();