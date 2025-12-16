/**
 * Clock Module - Handles interactive clock elements with SVG images
 * Each clock cycles through SVG faces on click and persists state via hidden inputs
 */

window.Clock = (function() {
    'use strict';

    /**
     * Initialize all clocks on the page
     */
    function initializeClocks() {
        const clocks = document.querySelectorAll('.clock');
        clocks.forEach(clock => {
            setupClock(clock);
        });
    }

    /**
     * Setup a single clock element
     * @param {HTMLElement} clockElement - The clock div element
     */
    function setupClock(clockElement) {
        // Prevent double initialization
        if (clockElement.dataset.clockInitialized === 'true') {
            return;
        }
        
        const folder = clockElement.getAttribute('data-clock-folder');
        const faces = parseInt(clockElement.getAttribute('data-clock-faces'), 10);
        
        if (!folder || isNaN(faces)) {
            console.error('Clock element missing required data attributes', clockElement);
            return;
        }

        // Find or create associated hidden input for persistence
        const inputId = clockElement.id + '-value';
        let input = document.getElementById(inputId);
        
        if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.id = inputId;
            input.value = '0';
            clockElement.parentNode.insertBefore(input, clockElement.nextSibling);
        }

        // Make focusable and accessible
        clockElement.setAttribute('tabindex', '0');
        clockElement.setAttribute('role', 'button');
        clockElement.setAttribute('aria-label', `Clock - click to advance (current value: ${input.value})`);
        
        // Initialize display from current value
        updateClockDisplay(clockElement, folder, parseInt(input.value, 10) || 0);

        // Function to advance the clock
        const advanceClock = () => {
            let currentValue = parseInt(input.value, 10) || 0;
            let nextValue = (currentValue + 1) % (faces + 1); // 0 to faces inclusive
            
            input.value = nextValue;
            updateClockDisplay(clockElement, folder, nextValue);
            
            // Update aria-label
            clockElement.setAttribute('aria-label', `Clock - click to advance (current value: ${nextValue})`);

            // Trigger change event on the hidden input so persistence picks it up
            const event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);
        };

        // Function to decrement the clock
        const decrementClock = () => {
            let currentValue = parseInt(input.value, 10) || 0;
            let nextValue = currentValue === 0 ? faces : currentValue - 1;
            
            input.value = nextValue;
            updateClockDisplay(clockElement, folder, nextValue);
            
            // Update aria-label
            clockElement.setAttribute('aria-label', `Clock - click to advance (current value: ${nextValue})`);

            // Trigger change event on the hidden input so persistence picks it up
            const event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);
        };

        // Add click handler to advance clock
        clockElement.addEventListener('click', advanceClock);
        
        // Add right-click handler to decrement clock
        clockElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            decrementClock();
        });
        
        // Add keyboard handler for accessibility
        clockElement.addEventListener('keydown', (event) => {
            if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                advanceClock();
            }
        });
        
        // Mark as initialized to prevent double setup
        clockElement.dataset.clockInitialized = 'true';
    }

    /**
     * Update the clock display to show the correct SVG
     * @param {HTMLElement} clockElement - The clock div element
     * @param {string} folder - Path to the clock SVG folder
     * @param {number} value - Current clock value (0-faces)
     */
    function updateClockDisplay(clockElement, folder, value) {
        const svgPath = `${folder}/${value}.svg`;

        // Show global loading indicator
        if (window.Utils) {
            window.Utils.showLoading('Loading clock...');
        }

        // Preload image before changing display to avoid flicker
        const img = new Image();

        img.onload = () => {
            clockElement.style.backgroundImage = `url('${svgPath}')`;
            clockElement.style.backgroundSize = 'contain';
            clockElement.style.backgroundRepeat = 'no-repeat';
            clockElement.style.backgroundPosition = 'center';

            // Hide global loading indicator
            if (window.Utils) {
                window.Utils.hideLoading();
            }
        };

        img.onerror = () => {
            console.error(`Failed to load clock image: ${svgPath}`);

            // Hide loading indicator
            if (window.Utils) {
                window.Utils.hideLoading();
            }

            // Show error state on the clock element
            clockElement.classList.add('clock-error');
            clockElement.style.backgroundImage = 'none';
            clockElement.textContent = '✗';
            clockElement.title = `Failed to load: ${svgPath}`;
        };

        img.src = svgPath;
    }

    /**
     * Refresh all clock displays from their current input values
     * Called after persistence loads to update visuals
     */
    function refreshClockDisplays() {
        const clocks = document.querySelectorAll('.clock');
        clocks.forEach(clock => {
            const folder = clock.getAttribute('data-clock-folder');
            const inputId = clock.id + '-value';
            const input = document.getElementById(inputId);
            
            if (input && folder) {
                const value = parseInt(input.value, 10) || 0;
                updateClockDisplay(clock, folder, value);
            }
        });
    }

    // Public API
    return {
        initializeClocks: initializeClocks,
        setupClock: setupClock,
        refreshClockDisplays: refreshClockDisplays
    };
})();
