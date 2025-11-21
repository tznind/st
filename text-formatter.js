/**
 * Text Formatter - Basic markdown-style text formatting
 * Supports **bold** and *italic* without external dependencies
 */
window.TextFormatter = (function() {
    'use strict';

    /**
     * Format text with basic markdown-style syntax
     * Supports: **bold** and *italic*
     * @param {string} text - The text to format
     * @returns {string} HTML string with formatting applied
     */
    function format(text) {
        if (!text || typeof text !== 'string') {
            return text;
        }

        // Escape HTML to prevent XSS
        let formatted = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        // Apply bold (**text**) first
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // Apply italic (*text*) - single asterisks not already part of bold
        // Use a simpler approach: match *text* where text doesn't contain asterisks
        formatted = formatted.replace(/\*([^*]+?)\*/g, '<em>$1</em>');

        // Convert double newlines to paragraph breaks
        formatted = formatted.replace(/\n\n/g, '</p><p>');
        
        // Convert single newlines to line breaks
        formatted = formatted.replace(/\n/g, '<br>');

        return formatted;
    }

    // Public API
    return {
        format
    };
})();
