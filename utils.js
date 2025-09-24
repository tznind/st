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
     * Get current role from the form (backward compatibility)
     * @returns {string|null} Current selected role or null
     */
    function getCurrentRole() {
        const roleSelect = document.querySelector('#role');
        return roleSelect ? roleSelect.value : null;
    }

    /**
     * Get all currently selected roles from the form
     * @returns {Array<string>} Array of selected roles (non-empty values only)
     */
    function getCurrentRoles() {
        const roles = [];
        let index = 1;
        
        // Start with main role selector
        const mainRole = getCurrentRole();
        if (mainRole) {
            roles.push(mainRole);
        }
        
        // Check for additional role selectors (role2, role3, etc.)
        while (true) {
            const roleSelect = document.querySelector(`#role${index === 1 ? '2' : index + 1}`);
            if (!roleSelect) break; // No more role selectors found
            
            if (roleSelect.value) {
                roles.push(roleSelect.value);
            }
            index++;
        }
        
        return roles;
    }

    /**
     * Get all role selector elements from the form
     * @returns {Array<HTMLSelectElement>} Array of role select elements
     */
    function getRoleSelectors() {
        const selectors = [];
        
        // Main role selector
        const mainRole = document.querySelector('#role');
        if (mainRole) selectors.push(mainRole);
        
        // Additional role selectors
        let index = 2;
        while (true) {
            const roleSelect = document.querySelector(`#role${index}`);
            if (!roleSelect) break;
            selectors.push(roleSelect);
            index++;
        }
        
        return selectors;
    }

    /**
     * Merge availability maps from multiple roles
     * @param {Array<string>} roles - Array of role names
     * @returns {Object} Merged availability map
     */
    function mergeRoleAvailability(roles) {
        if (!window.availableMap || roles.length === 0) {
            return {};
        }
        
        const merged = {
            cards: [],
            _movesFiles: []
        };
        
        roles.forEach(role => {
            const roleData = window.availableMap[role];
            if (roleData) {
                // Merge cards
                if (roleData.cards) {
                    roleData.cards.forEach(card => {
                        if (!merged.cards.includes(card)) {
                            merged.cards.push(card);
                        }
                    });
                }
                
                // Track moves files
                if (roleData._movesFile && !merged._movesFiles.includes(roleData._movesFile)) {
                    merged._movesFiles.push(roleData._movesFile);
                }
                
                // Merge moves (any move marked true in any role becomes available)
                Object.keys(roleData).forEach(key => {
                    if (!key.startsWith('_') && key !== 'cards') {
                        // If any role has this move as true, it's available
                        if (roleData[key] === true) {
                            merged[key] = true;
                        } else if (merged[key] === undefined) {
                            merged[key] = roleData[key];
                        }
                    }
                });
            }
        });
        
        return merged;
    }

    /**
     * Check if a role matches a pattern (supports wildcards)
     * @param {string} role - The role name to check
     * @param {string} pattern - The pattern to match against (supports * wildcard)
     * @returns {boolean} True if the role matches the pattern
     */
    function roleMatchesPattern(role, pattern) {
        if (!role || !pattern) return false;
        
        // Convert to lowercase for case-insensitive matching
        const roleLower = role.toLowerCase();
        const patternLower = pattern.toLowerCase();
        
        // Handle exact match
        if (roleLower === patternLower) return true;
        
        // Handle wildcard patterns
        if (patternLower.includes('*')) {
            // Simple wildcard matching
            if (patternLower === '*') {
                return true; // Match everything
            }
            
            // Handle prefix wildcards like "the*"
            if (patternLower.endsWith('*')) {
                const prefix = patternLower.slice(0, -1);
                return roleLower.startsWith(prefix);
            }
            
            // Handle suffix wildcards like "*master"
            if (patternLower.startsWith('*')) {
                const suffix = patternLower.slice(1);
                return roleLower.endsWith(suffix);
            }
            
            // Handle middle wildcards (convert to regex)
            const regexPattern = patternLower.replace(/\*/g, '.*');
            const regex = new RegExp(`^${regexPattern}$`);
            return regex.test(roleLower);
        }
        
        return false;
    }
    
    /**
     * Get roles that match any of the given patterns
     * @param {Array<string>} patterns - Array of patterns to match against
     * @param {Array<string>} availableRoles - Array of available role names
     * @param {Array<string>} excludeRoles - Array of roles to exclude from results
     * @returns {Array<string>} Array of matching role names
     */
    function getMatchingRoles(patterns, availableRoles, excludeRoles = []) {
        if (!patterns || !Array.isArray(patterns) || patterns.length === 0) {
            return [];
        }
        
        if (!availableRoles || !Array.isArray(availableRoles)) {
            return [];
        }
        
        const excludeSet = new Set(excludeRoles.map(role => role.toLowerCase()));
        const matchingRoles = new Set();
        
        patterns.forEach(pattern => {
            availableRoles.forEach(role => {
                if (roleMatchesPattern(role, pattern) && !excludeSet.has(role.toLowerCase())) {
                    matchingRoles.add(role);
                }
            });
        });
        
        return Array.from(matchingRoles).sort();
    }
    
    /**
     * Get all available role names from the availableMap
     * @returns {Array<string>} Array of all available role names
     */
    function getAllAvailableRoles() {
        if (!window.availableMap) return [];
        return Object.keys(window.availableMap);
    }

    // Public API
    return {
        debounce,
        getCurrentRole,
        getCurrentRoles,
        getRoleSelectors,
        mergeRoleAvailability,
        roleMatchesPattern,
        getMatchingRoles,
        getAllAvailableRoles
    };
})();
