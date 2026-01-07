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
     * Update the clock display to show the correct SVG (with translation support)
     * @param {HTMLElement} clockElement - The clock div element
     * @param {string} folder - Path to the clock SVG folder
     * @param {number} value - Current clock value (0-faces)
     */
    function updateClockDisplay(clockElement, folder, value) {
        // Get current language and construct paths
        const currentLang = window.JsonLoader ? window.JsonLoader.getCurrentLanguage() : 'en';
        const basePath = `${folder}/${value}.svg`;
        const translatedPath = currentLang !== 'en' ? basePath.replace(/^data\//, `data/${currentLang}/`) : basePath;

        // Clear error state when loading a new image
        clockElement.classList.remove('clock-error');
        clockElement.textContent = '';
        clockElement.title = '';

        // Show global loading indicator
        if (window.Utils) {
            window.Utils.showLoading('Loading clock...');
        }

        // Load image with retry logic
        loadImageWithRetry(translatedPath, basePath, currentLang, 0)
            .then(imgSrc => {
                // Clear error state on successful load
                clockElement.classList.remove('clock-error');
                clockElement.textContent = '';
                clockElement.title = '';

                clockElement.style.backgroundImage = `url('${imgSrc}')`;
                clockElement.style.backgroundSize = 'contain';
                clockElement.style.backgroundRepeat = 'no-repeat';
                clockElement.style.backgroundPosition = 'center';

                // Hide global loading indicator
                if (window.Utils) {
                    window.Utils.hideLoading();
                }
            })
            .catch(errorSrc => {
                console.error(`Failed to load clock image after retries: ${errorSrc}`);

                // Hide loading indicator
                if (window.Utils) {
                    window.Utils.hideLoading();
                }

                // Show error state on the clock element
                clockElement.classList.add('clock-error');
                clockElement.style.backgroundImage = 'none';
                clockElement.textContent = '✗';
                clockElement.title = `Failed to load: ${errorSrc}`;
            });
    }

    /**
     * Load an image with retry logic using exponential backoff
     * @param {string} primaryPath - Primary image path to try
     * @param {string} fallbackPath - Fallback path if primary fails
     * @param {string} currentLang - Current language code
     * @param {number} retryCount - Current retry attempt number
     * @param {number} maxRetries - Maximum number of retries (default: 3)
     * @returns {Promise<string>} Promise resolving to successful image src or rejecting with error src
     */
    function loadImageWithRetry(primaryPath, fallbackPath, currentLang, retryCount = 0, maxRetries = 3) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                resolve(img.src);
            };

            img.onerror = () => {
                // If translated version failed and we haven't tried base yet, try base
                if (img.src.includes(`data/${currentLang}/`) && currentLang !== 'en') {
                    console.log(`Translation not found: ${primaryPath}, trying base: ${fallbackPath}`);

                    // Try fallback path without retry
                    loadImageWithRetry(fallbackPath, fallbackPath, 'en', 0, maxRetries)
                        .then(resolve)
                        .catch(reject);
                } else if (retryCount < maxRetries) {
                    // Retry with exponential backoff (1s, 2s, 4s)
                    const delay = Math.pow(2, retryCount) * 1000;
                    console.log(`Retrying image load (attempt ${retryCount + 1}/${maxRetries}) after ${delay}ms: ${img.src}`);

                    // Non-blocking retry using setTimeout
                    setTimeout(() => {
                        loadImageWithRetry(img.src, fallbackPath, currentLang, retryCount + 1, maxRetries)
                            .then(resolve)
                            .catch(reject);
                    }, delay);
                } else {
                    // All retries exhausted
                    reject(img.src);
                }
            };

            // Start loading the image
            img.src = primaryPath;
        });
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
