/**
 * Dribble Card - Each instance gets a random color
 * Supports duplicate instances via takeFromAllowsDuplicates
 */

(function() {
    'use strict';

    // Array of vibrant colors for dribbles
    const DRIBBLE_COLORS = [
        '#FF6B6B', // Red
        '#4ECDC4', // Turquoise
        '#45B7D1', // Blue
        '#FFA07A', // Light Salmon
        '#98D8C8', // Mint
        '#F7DC6F', // Yellow
        '#BB8FCE', // Purple
        '#F8B500', // Orange
        '#52C234', // Green
        '#E91E63', // Pink
        '#00BCD4', // Cyan
        '#FF9800', // Deep Orange
        '#9C27B0', // Deep Purple
        '#8BC34A', // Light Green
        '#FF5722'  // Red Orange
    ];

    function initializeDribbleCard(container, suffix) {
        // Create scoped helpers for this specific card instance
        const helpers = suffix ?
            window.CardHelpers.createScopedHelpers(container, suffix) :
            window.CardHelpers;

        // Get the color dot element
        const colorDot = helpers.getElement('dribble_color');

        if (colorDot) {
            // Generate a random color
            const randomColor = DRIBBLE_COLORS[Math.floor(Math.random() * DRIBBLE_COLORS.length)];

            // Apply the color to the dot
            colorDot.style.color = randomColor;

            console.log(`Dribble initialized with color: ${randomColor} (suffix: ${suffix || 'none'})`);
        }
    }

    // Export initialization function
    window.CardInitializers = window.CardInitializers || {};
    window.CardInitializers.dribble = initializeDribbleCard;

})();
