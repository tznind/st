/**
 * Validation Module - Checks for DOM errors like duplicate IDs
 * Runs periodic checks and displays warnings to the user
 */

window.Validation = (function() {
    'use strict';

    // Configuration
    const CHECK_INTERVAL = 5000; // Check every 5 seconds
    let checkTimer = null;
    let currentErrors = [];

    /**
     * Check for duplicate IDs in the DOM
     * @returns {Array} Array of error objects
     */
    function checkDuplicateIds() {
        const errors = [];
        const idMap = new Map();

        // Get all elements with an id attribute
        const elementsWithId = document.querySelectorAll('[id]');

        elementsWithId.forEach(element => {
            const id = element.id;

            if (idMap.has(id)) {
                // Found a duplicate!
                idMap.get(id).push(element);
            } else {
                idMap.set(id, [element]);
            }
        });

        // Build error reports for duplicates
        idMap.forEach((elements, id) => {
            if (elements.length > 1) {
                errors.push({
                    type: 'duplicate_id',
                    severity: 'error',
                    id: id,
                    count: elements.length,
                    elements: elements,
                    message: `Duplicate ID "${id}" found ${elements.length} times`,
                    details: elements.map((el, index) => {
                        const tag = el.tagName.toLowerCase();
                        const classes = el.className ? `.${el.className.split(' ').join('.')}` : '';
                        const parent = el.parentElement ? el.parentElement.tagName.toLowerCase() : 'unknown';
                        return `  ${index + 1}. <${tag}${classes}> in <${parent}>`;
                    }).join('\n')
                });
            }
        });

        return errors;
    }

    /**
     * Check for duplicate move IDs across different move files
     * @returns {Array} Array of error objects
     */
    function checkDuplicateMoveIds() {
        const errors = [];

        // Check if moveSourceMap is available
        if (!window.moveSourceMap) {
            return errors; // Data not loaded yet
        }

        // Find moves that appear in multiple files
        Object.entries(window.moveSourceMap).forEach(([moveId, sources]) => {
            if (sources.length > 1) {
                // This move ID appears in multiple files
                const fileList = sources.map(s => `${s.role} (${s.file})`).join('\n  ');

                errors.push({
                    type: 'duplicate_move_id',
                    severity: 'error',
                    moveId: moveId,
                    sources: sources,
                    count: sources.length,
                    message: `Move ID "${moveId}" defined in ${sources.length} different files`,
                    details: `Move "${moveId}" appears in:\n  ${fileList}\n\nThis will cause unpredictable behavior. Each move should have a unique ID across all files.`
                });
            }
        });

        return errors;
    }

    /**
     * Check for move IDs containing underscores (breaks suffix extraction)
     * @returns {Array} Array of error objects
     */
    function checkMoveIdUnderscores() {
        const errors = [];

        if (!window.moves || !Array.isArray(window.moves)) {
            return errors;
        }

        for (const move of window.moves) {
            if (move.id && move.id.includes('_')) {
                errors.push({
                    type: 'invalid_move_id',
                    message: `Move ID "${move.id}" contains underscores`,
                    details: `Move IDs should use hyphens instead of underscores to ensure proper suffix extraction for duplicate cards. Change "${move.id}" to "${move.id.replace(/_/g, '-')}"`
                });
            }
        }

        return errors;
    }

    /**
     * Run all validation checks
     * @returns {Array} Combined array of all errors
     */
    function runAllChecks() {
        const allErrors = [];

        // Check for duplicate IDs in DOM
        const duplicateIdErrors = checkDuplicateIds();
        allErrors.push(...duplicateIdErrors);

        // Check for duplicate move IDs across files
        const duplicateMoveIdErrors = checkDuplicateMoveIds();
        allErrors.push(...duplicateMoveIdErrors);

        // Check for move IDs with underscores
        const underscoreErrors = checkMoveIdUnderscores();
        allErrors.push(...underscoreErrors);

        // Future: Add more checks here
        // - Check for broken references
        // - Check for missing required attributes
        // etc.

        return allErrors;
    }

    /**
     * Update the warning button display
     * @param {Array} errors - Array of error objects
     */
    function updateWarningDisplay(errors) {
        const warningButton = document.getElementById('validation-warning');
        const warningCount = warningButton?.querySelector('.warning-count');

        if (!warningButton) return;

        if (errors.length > 0) {
            warningButton.style.display = 'inline-flex';
            if (warningCount) {
                warningCount.textContent = errors.length;
            }

            // Update title with error summary
            const errorTypes = [...new Set(errors.map(e => e.type))];
            warningButton.title = `${errors.length} validation error${errors.length === 1 ? '' : 's'} found. Click to view details.`;
        } else {
            warningButton.style.display = 'none';
        }
    }

    /**
     * Show popup with error details
     * @param {Array} errors - Array of error objects
     */
    function showErrorPopup(errors) {
        if (errors.length === 0) {
            alert('No validation errors found!');
            return;
        }

        // Build error message
        let message = `VALIDATION ERRORS (${errors.length}):\n`;
        message += '═'.repeat(60) + '\n\n';

        errors.forEach((error, index) => {
            message += `${index + 1}. ${error.message}\n`;
            if (error.details) {
                message += error.details + '\n';
            }
            message += '\n';
        });

        message += '═'.repeat(60) + '\n';
        message += 'These errors may cause functionality issues.\n';
        message += 'Please report this to the developer if you see this message.';

        // Show in alert for now (could be replaced with a custom modal)
        alert(message);

        // Also log to console for debugging
        console.group('🚨 Validation Errors');
        errors.forEach(error => {
            console.error(error.message, error.elements);
        });
        console.groupEnd();
    }

    /**
     * Perform a validation check and update display
     */
    function performCheck() {
        currentErrors = runAllChecks();
        updateWarningDisplay(currentErrors);

        // Log if errors found (for development)
        if (currentErrors.length > 0) {
            console.warn(`Validation: Found ${currentErrors.length} error(s)`);
        }
    }

    /**
     * Start periodic validation checks
     */
    function startPeriodicChecks() {
        // Run initial check
        setTimeout(performCheck, 2000); // Wait 2s for initial DOM to settle

        // Set up periodic checks
        checkTimer = setInterval(performCheck, CHECK_INTERVAL);

        console.log(`Validation: Periodic checks started (every ${CHECK_INTERVAL / 1000}s)`);
    }

    /**
     * Stop periodic validation checks
     */
    function stopPeriodicChecks() {
        if (checkTimer) {
            clearInterval(checkTimer);
            checkTimer = null;
            console.log('Validation: Periodic checks stopped');
        }
    }

    /**
     * Initialize validation system
     */
    function initialize() {
        console.log('Validation system initializing...');

        // Set up click handler for warning button
        const warningButton = document.getElementById('validation-warning');
        if (warningButton) {
            warningButton.addEventListener('click', () => {
                showErrorPopup(currentErrors);
            });
        }

        // Start periodic checks
        startPeriodicChecks();

        console.log('Validation system initialized');
    }

    // Public API
    return {
        initialize,
        checkDuplicateIds,
        checkDuplicateMoveIds,
        runAllChecks,
        performCheck,
        startPeriodicChecks,
        stopPeriodicChecks,
        showErrorPopup,
        getCurrentErrors: () => currentErrors
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.Validation.initialize);
} else {
    window.Validation.initialize();
}
