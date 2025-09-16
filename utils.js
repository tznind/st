/**
 * Utility Functions - Common helpers for the Commander character sheet
 */

window.Utils = (function() {
    'use strict';

    /**
     * Debounce function to limit rapid function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Get current role from the form
     * @returns {string|null} Current selected role or null
     */
    function getCurrentRole() {
        const roleSelect = document.querySelector('#role');
        return roleSelect ? roleSelect.value : null;
    }

    // Public API
    return {
        debounce,
        getCurrentRole
    };
})();
