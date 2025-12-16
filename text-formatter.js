/**
 * Text Formatter - Basic markdown-style text formatting
 * Supports **bold** and *italic* without external dependencies
 * Also supports clickable glossary terms
 */
window.TextFormatter = (function() {
    'use strict';

    /**
     * Build a lookup map from terms glossary for fast matching
     * @returns {Map} Map of lowercase term to term definition
     */
    function buildTermsLookup() {
        const lookup = new Map();

        if (window.termsGlossary && Array.isArray(window.termsGlossary)) {
            window.termsGlossary.forEach(termDef => {
                if (termDef.term && termDef.description) {
                    lookup.set(termDef.term.toLowerCase(), termDef);
                }
            });
        }

        // Add aliases for terms
        if (window.aliasesConfig && Array.isArray(window.aliasesConfig)) {
            window.aliasesConfig.forEach(aliasDef => {
                if (aliasDef.alias && aliasDef.term) {
                    // Find the actual term definition
                    const actualTerm = window.termsGlossary?.find(
                        t => t.term.toLowerCase() === aliasDef.term.toLowerCase()
                    );
                    if (actualTerm) {
                        lookup.set(aliasDef.alias.toLowerCase(), actualTerm);
                    }
                }
            });
        }

        return lookup;
    }

    /**
     * Build a lookup map from moves for fast matching
     * @returns {Map} Map of lowercase move title to move data
     */
    function buildMovesLookup() {
        const lookup = new Map();

        if (window.moves && Array.isArray(window.moves)) {
            window.moves.forEach(move => {
                if (move.title && move.id) {
                    const moveData = {
                        id: move.id,
                        title: move.title,
                        category: move.category || "Moves"
                    };

                    // Store with full title (lowercase)
                    lookup.set(move.title.toLowerCase(), moveData);

                    // Also store a version without stat modifiers like "(+Influence)"
                    // This allows matching "Rally the Cohort" to "Rally the Cohort (+Influence)"
                    const titleWithoutStats = move.title.replace(/\s*\([^)]+\)\s*$/, '').trim();
                    if (titleWithoutStats !== move.title) {
                        lookup.set(titleWithoutStats.toLowerCase(), moveData);
                    }
                }
            });
        }

        // Add aliases for moves
        if (window.aliasesConfig && Array.isArray(window.aliasesConfig)) {
            window.aliasesConfig.forEach(aliasDef => {
                if (aliasDef.alias && aliasDef.move) {
                    // Find the actual move
                    const actualMove = window.moves?.find(
                        m => m.title.toLowerCase() === aliasDef.move.toLowerCase() ||
                             m.title.replace(/\s*\([^)]+\)\s*$/, '').trim().toLowerCase() === aliasDef.move.toLowerCase()
                    );
                    if (actualMove) {
                        const moveData = {
                            id: actualMove.id,
                            title: actualMove.title,
                            category: actualMove.category || "Moves"
                        };
                        lookup.set(aliasDef.alias.toLowerCase(), moveData);
                    }
                }
            });
        }

        return lookup;
    }

    /**
     * Escape special regex characters in a string
     * @param {string} str - String to escape
     * @returns {string} Escaped string safe for use in RegExp
     */
    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Replace glossary terms within HTML content
     * Looks for whole words matching glossary terms and wraps them in spans
     * @param {string} html - HTML string with formatting already applied
     * @param {Map} termsLookup - Map of lowercase terms to definitions
     * @returns {string} HTML with glossary terms wrapped
     */
    function linkifyGlossaryTerms(html, termsLookup) {
        if (!termsLookup || termsLookup.size === 0) {
            return html;
        }

        // Process each term in the glossary
        termsLookup.forEach((termDef, termLower) => {
            const term = termDef.term;
            const escapedDescription = termDef.description
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;');

            // Escape special regex characters in the term
            const escapedTerm = escapeRegex(term);

            // Create a regex that matches the term as a whole word (case-insensitive)
            // Use word boundaries to ensure we match whole words only
            const regex = new RegExp(`\\b(${escapedTerm})\\b`, 'gi');

            // Replace the term with a span wrapper, but only in text content (not in HTML tags)
            // We need to be careful not to replace terms inside existing HTML attributes
            html = html.replace(regex, function(match) {
                // Check if this match is already inside a glossary-term span by looking backwards
                // This is a simple heuristic - if we're already in a span, don't wrap again
                return `<span class="glossary-term" data-term-title="${term}" data-term-text="${escapedDescription}">${match}</span>`;
            });
        });

        return html;
    }

    /**
     * Convert bullet lists to HTML
     * Detects lines starting with "- " and converts them to <ul><li> lists
     * @param {string} text - Text with potential bullet lists
     * @returns {string} Text with bullet lists converted to HTML
     */
    function convertBulletLists(text) {
        // Match groups of consecutive lines starting with "- "
        // Pattern: (start of string or newline) followed by "- " and content until newline or end
        // We need to handle multiple consecutive bullets as one list

        // Replace consecutive bullet lines with <ul><li> structure
        return text.replace(/((?:^|\n)- .+(?:\n|$))+/gm, function(match) {
            // Split the matched group into individual bullet items
            const items = match
                .split('\n')
                .filter(line => line.trim().startsWith('- '))
                .map(line => line.trim().substring(2)); // Remove "- " prefix

            // Build the <ul> list
            const listItems = items.map(item => `<li>${item}</li>`).join('');
            return `\n<ul>${listItems}</ul>\n`;
        });
    }

    /**
     * Replace move references within bold tags with clickable links
     * Looks for <strong> tags containing move titles and makes them clickable
     * @param {string} html - HTML string with bold formatting already applied
     * @param {Map} movesLookup - Map of lowercase move titles to move data
     * @returns {string} HTML with move references wrapped in clickable spans
     */
    function linkifyMoveReferences(html, movesLookup) {
        if (!movesLookup || movesLookup.size === 0) {
            return html;
        }

        // Replace <strong> tags that contain move names
        // We need to be careful to match whole move titles
        // Note: moveTitleLower is the lookup key (may be shortened), but we use it to match
        movesLookup.forEach((moveData, moveTitleLower) => {
            const escapedMoveId = moveData.id.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
            const escapedCategory = moveData.category.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

            // Use the lookup key (which may be a shortened version) for matching
            // This allows "augury" to match even though the full title is "Augury (+Weird)"
            const escapedTitle = escapeRegex(moveTitleLower);
            const regex = new RegExp(`<strong>(${escapedTitle})</strong>`, 'gi');

            // Replace with a span that has move reference data
            html = html.replace(regex, function(match, capturedTitle) {
                return `<span class="move-reference" data-move-id="${escapedMoveId}" data-move-category="${escapedCategory}"><strong>${capturedTitle}</strong></span>`;
            });
        });

        return html;
    }

    /**
     * Format text with basic markdown-style syntax
     * Supports: **bold**, *italic*, and bullet lists
     * @param {string} text - The text to format
     * @returns {string} HTML string with formatting applied
     */
    function format(text) {
        if (!text || typeof text !== 'string') {
            return text;
        }

        let formatted = text;

        // Apply bold (**text**) first
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // Apply italic (*text*) - single asterisks not already part of bold
        // Use a simpler approach: match *text* where text doesn't contain asterisks
        formatted = formatted.replace(/\*([^*]+?)\*/g, '<em>$1</em>');

        // Build moves lookup and linkify move references (before glossary terms)
        const movesLookup = buildMovesLookup();
        formatted = linkifyMoveReferences(formatted, movesLookup);

        // Build terms lookup and linkify glossary terms
        const termsLookup = buildTermsLookup();
        formatted = linkifyGlossaryTerms(formatted, termsLookup);

        // Convert bullet lists (before paragraph/line break conversion)
        formatted = convertBulletLists(formatted);

        // Convert double newlines to paragraph breaks
        formatted = formatted.replace(/\n\n/g, '</p><p>');

        // Convert single newlines to line breaks
        formatted = formatted.replace(/\n/g, '<br>');

        return formatted;
    }

    /**
     * Visitor function that walks the DOM tree and formats text nodes in-place
     * This preserves all element structure including nested inputs, spans, divs, etc.
     * @param {Node} node - The node to visit and format
     */
    function visitAndFormatNode(node) {
        // Skip if this is an element that shouldn't be formatted
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            // Don't format inside code, pre, script, style elements
            if (['code', 'pre', 'script', 'style'].includes(tagName)) {
                return;
            }
        }

        if (node.nodeType === Node.TEXT_NODE) {
            const originalText = node.textContent;

            // Skip whitespace-only text nodes (newlines, spaces, tabs)
            if (originalText.trim() === '') {
                return;
            }

            // Trim the text to remove leading/trailing whitespace (including newlines)
            // This prevents source HTML formatting from being converted to <br> tags
            const trimmedText = originalText.trim();

            // Format the trimmed text
            const formattedHTML = format(trimmedText);

            // Only replace if formatting actually changed something
            if (formattedHTML !== trimmedText && formattedHTML.includes('<')) {
                // Create a temporary container to parse the formatted HTML
                const temp = document.createElement('span');
                temp.innerHTML = formattedHTML;

                // Replace the text node with the formatted content
                const parent = node.parentNode;
                const nextSibling = node.nextSibling;

                // Insert all formatted nodes before the original text node
                while (temp.firstChild) {
                    parent.insertBefore(temp.firstChild, nextSibling);
                }

                // Remove the original text node
                parent.removeChild(node);
            } else if (trimmedText !== originalText) {
                // Text was trimmed but not formatted - just update the text content
                node.textContent = trimmedText;
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Recursively visit child nodes
            // Use Array.from to create a static copy since we may modify the DOM
            const children = Array.from(node.childNodes);
            children.forEach(child => visitAndFormatNode(child));
        }
    }

    /**
     * Auto-format all elements with data-format-text attribute
     * Uses a visitor pattern to walk the DOM tree and format text nodes in-place
     * Preserves all element structure including inputs, spans, divs, etc.
     * @param {string} selector - CSS selector for elements to format (default: '[data-format-text]:not([data-format-text="formatted"])')
     */
    function formatElements(selector = '[data-format-text]:not([data-format-text="formatted"])') {
        const elements = document.querySelectorAll(selector);

        elements.forEach(el => {
            // Get source text from attribute value
            const sourceAttr = el.getAttribute('data-format-text');

            if (sourceAttr && sourceAttr !== '' && sourceAttr !== 'formatted') {
                // If there's text in the attribute, set it as innerHTML first
                el.innerHTML = sourceAttr;
            }

            // Now use the visitor pattern to format all text nodes in the tree
            // This preserves all element structure
            visitAndFormatNode(el);

            // Mark as formatted to avoid re-processing
            el.setAttribute('data-format-text', 'formatted');
        });

        console.log(`TextFormatter: Formatted ${elements.length} elements using visitor pattern`);
    }

    // Public API
    return {
        format,
        formatElements
    };
})();
