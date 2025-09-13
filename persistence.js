/**
 * Persistence Module - Handles saving and loading form state to/from URL parameters
 * Works with any form inputs without needing to know specific field names
 */

window.Persistence = (function() {
    'use strict';

    /**
     * Get all persistable form inputs from a form
     * @param {HTMLFormElement} form - The form to scan for inputs
     * @returns {Array} Array of input elements that should be persisted
     */
    function getPersistableInputs(form) {
        // Get all inputs that have an id and should be persisted
        const selectors = [
            'input[type="text"]',
            'input[type="number"]', 
            'input[type="email"]',
            'input[type="url"]',
            'input[type="tel"]',
            'input[type="search"]',
            'input[type="password"]',
            'input[type="hidden"]',
            'input[type="checkbox"]',
            'select',
            'textarea'
        ];
        
        const inputs = [];
        selectors.forEach(selector => {
            const elements = form.querySelectorAll(selector);
            elements.forEach(element => {
                // Only include elements with an id (needed for persistence)
                if (element.id) {
                    inputs.push(element);
                }
            });
        });
        
        return inputs;
    }

    /**
     * Save current form state to URL parameters
     * @param {HTMLFormElement} form - The form to save
     */
    function saveToURL(form) {
        const params = new URLSearchParams(location.search);
        const inputs = getPersistableInputs(form);
        
        inputs.forEach(input => {
            let value;
            
            // Handle checkboxes differently - use checked state
            if (input.type === 'checkbox') {
                value = input.checked ? '1' : '0';
                if (input.checked) {
                    params.set(input.id, '1');
                } else {
                    // For move checkboxes, only save unchecked state if it overrides a default
                    if (input.id.startsWith('move_')) {
                        // Check if this move has a default 'true' state that we're overriding
                        const needsExplicitZero = checkIfDefaultIsTrue(input.id);
                        if (needsExplicitZero) {
                            params.set(input.id, '0');
                        } else {
                            params.delete(input.id); // Remove unchecked non-defaults
                        }
                    } else {
                        params.delete(input.id);
                    }
                }
            } else {
                // Handle regular inputs
                value = input.value || '';
                if (value) {
                    params.set(input.id, value);
                } else {
                    // Remove empty values from URL to keep it clean
                    params.delete(input.id);
                }
            }
        });
        
        // Update URL without page reload
        const newUrl = params.toString() ? '?' + params.toString() : location.pathname;
        history.replaceState({}, '', newUrl);
    }

    /**
     * Load form state from URL parameters
     * @param {HTMLFormElement} form - The form to populate
     * @returns {Object} Object containing the loaded values by input id
     */
    function loadFromURL(form) {
        const params = new URLSearchParams(location.search);
        const inputs = getPersistableInputs(form);
        const loadedValues = {};
        
        inputs.forEach(input => {
            if (params.has(input.id)) {
                const value = params.get(input.id);
                
                if (input.type === 'checkbox') {
                    // For checkboxes, set checked state
                    // Handle both '1' (checked) and '0' (explicitly unchecked)
                    input.checked = value === '1';
                    loadedValues[input.id] = input.checked;
                } else {
                    // For regular inputs, set value
                    input.value = value;
                    loadedValues[input.id] = value;
                }
            }
        });
        
        return loadedValues;
    }

    /**
     * Clear all form values and remove from URL
     * @param {HTMLFormElement} form - The form to clear
     */
    function clearState(form) {
        const inputs = getPersistableInputs(form);
        
        // Clear form inputs
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });
        
        // Clear URL parameters
        history.replaceState({}, '', location.pathname);
    }

    // Track if we've already set up delegation
    let delegationSetup = false;
    
    /**
     * Set up automatic persistence for a form using event delegation
     * @param {HTMLFormElement} form - The form to monitor
     * @param {Function} onStateChange - Optional callback when state changes
     */
    function setupAutoPersistence(form, onStateChange) {
        // Set up event delegation only once
        if (!delegationSetup) {
            // Use event delegation on the form to handle all input changes
            form.addEventListener('change', (event) => {
                const target = event.target;
                if (target.id && shouldPersist(target)) {
                    saveToURL(form);
                    if (onStateChange) {
                        const value = target.type === 'checkbox' ? target.checked : target.value;
                        onStateChange(target.id, value);
                    }
                }
            });
            
            form.addEventListener('input', (event) => {
                const target = event.target;
                if (target.id && shouldPersist(target) && target.type !== 'checkbox' && target.tagName.toLowerCase() !== 'select') {
                    saveToURL(form);
                    if (onStateChange) {
                        onStateChange(target.id, target.value);
                    }
                }
            });
            
            delegationSetup = true;
        }
    }
    
    /**
     * Check if an input should be persisted
     */
    function shouldPersist(input) {
        const persistableTypes = ['text', 'number', 'email', 'url', 'tel', 'search', 'password', 'hidden', 'checkbox'];
        const persistableElements = ['select', 'textarea'];
        
        return (persistableTypes.includes(input.type) || persistableElements.includes(input.tagName.toLowerCase())) && input.id;
    }

    /**
     * Get current URL as a shareable string
     * @returns {string} Current page URL
     */
    function getCurrentURL() {
        return window.location.href;
    }

    /**
     * Copy current URL to clipboard
     * @returns {Promise} Promise that resolves when copying is complete
     */
    function copyURLToClipboard() {
        const url = getCurrentURL();
        return navigator.clipboard.writeText(url).then(() => {
            return url;
        });
    }

    /**
     * Check if a move has a default 'true' state in availableMap
     * @param {string} inputId - The input ID (e.g. 'move_a1b2c3')
     * @returns {boolean} True if this move defaults to checked
     */
    function checkIfDefaultIsTrue(inputId) {
        if (!inputId.startsWith('move_') || !window.availableMap) return false;
        
        // Extract move ID, handling multiple instances (move_id_1 -> move_id)
        const moveId = inputId.replace('move_', '').replace(/_\d+$/, '').replace(/_pick_\d+$/, '');
        const currentRole = getCurrentRole();
        
        if (currentRole && window.availableMap[currentRole]) {
            return window.availableMap[currentRole][moveId] === true;
        }
        return false;
    }
    
    /**
     * Get current role (helper function)
     */
    function getCurrentRole() {
        const roleSelect = document.getElementById('role');
        return roleSelect ? roleSelect.value : null;
    }
    
    /**
     * Refresh persistence after dynamic content changes
     * @param {HTMLFormElement} form - The form to refresh
     * @param {Function} onStateChange - Optional callback when state changes
     */
    function refreshPersistence(form, onStateChange) {
        // With event delegation, we don't need to re-setup listeners
        // Just load existing state for any new checkboxes/inputs
        loadFromURL(form);
    }

    // Public API
    return {
        saveToURL: saveToURL,
        loadFromURL: loadFromURL,
        clearState: clearState,
        setupAutoPersistence: setupAutoPersistence,
        refreshPersistence: refreshPersistence,
        getCurrentURL: getCurrentURL,
        copyURLToClipboard: copyURLToClipboard,
        getPersistableInputs: getPersistableInputs
    };
})();
