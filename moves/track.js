/**
 * Track Module - Handles tracking temporary points for moves
 */

window.Track = (function() {
    'use strict';

    /**
     * Create a track counter display for a move
     */
    function createTrackDisplay(move, urlParams) {
        console.log('Track system: createTrackDisplay called for move:', move.id, 'tracks:', move.tracks);
        if (!move.tracks) {
            console.log('Track system: No tracks found for move:', move.id);
            return null;
        }
        
        const trackConfigs = move.tracks;
        console.log('Track system: Using track configs:', trackConfigs);
        
        // Determine if we should use grid layout (more than 3 tracks)
        const useGridLayout = trackConfigs.length > 3;
        
        const trackContainer = document.createElement('div');
        trackContainer.className = useGridLayout ? 'track-counter-grid' : 'track-counter';
        trackContainer.id = `track_${move.id}`;
        
        // Prevent any clicks in the track area from bubbling up
        trackContainer.addEventListener('click', (event) => {
            event.stopPropagation();
        });
        
        // Create each track counter
        trackConfigs.forEach((trackConfig, index) => {
            const trackId = trackConfigs.length > 1 ? `${move.id}_${index}` : move.id;
            console.log(`Track: trackId=${trackId}, move=${move.id}, index=${index}, numTracks=${trackConfigs.length}`);
            const currentValue = getCurrentTrackValue(trackId, urlParams);
            // Check if there's a dynamic max in the URL, otherwise use default
            const defaultMax = trackConfig.max || 5;
            const maxValue = getTrackMaxValue(trackId, urlParams, defaultMax);
            console.log(`Track: For ${trackId}, defaultMax=${defaultMax}, urlMax=${urlParams.get('track_' + trackId + '_max')}, using maxValue=${maxValue}`);
            console.log(`Track: trackConfig.dynamic=${trackConfig.dynamic}`);
            const shape = trackConfig.shape || 'square';
            
            // Create individual track container
            const individualTrackContainer = document.createElement('div');
            individualTrackContainer.className = 'individual-track';
            
            // Create shapes container
            const shapesContainer = document.createElement('div');
            shapesContainer.className = 'track-shapes';
            
            // Create individual shapes
            for (let i = 1; i <= maxValue; i++) {
                const shapeElement = document.createElement('div');
                shapeElement.className = `track-shape track-${shape}`;
                shapeElement.dataset.value = i;
                shapeElement.setAttribute('data-track-id', trackId);
                
                // Make focusable and accessible
                shapeElement.setAttribute('tabindex', '0');
                shapeElement.setAttribute('role', 'button');
                shapeElement.setAttribute('aria-label', `${trackConfig.name} - Set to ${i} of ${maxValue}`);
                
                if (i <= currentValue) {
                    shapeElement.classList.add('filled');
                }
                
                // Add click handler for toggling
                shapeElement.addEventListener('click', (event) => {
                    event.stopPropagation(); // Prevent bubbling to collapse/expand handlers
                    handleShapeClick(trackId, i, maxValue);
                });
                
                // Add keyboard handler
                shapeElement.addEventListener('keydown', (event) => {
                    if (event.key === ' ' || event.key === 'Enter') {
                        event.preventDefault();
                        event.stopPropagation();
                        handleShapeClick(trackId, i, maxValue);
                    }
                });
                
                shapesContainer.appendChild(shapeElement);
            }
            
            // Create label showing track name and current/max
            const trackLabel = document.createElement('div');
            trackLabel.className = 'track-label';
            trackLabel.textContent = `${trackConfig.name}: ${currentValue}/${maxValue}`;
            
            // Add dynamic max button if enabled
            if (trackConfig.dynamic) {
                console.log(`Track: Creating max button for ${trackId}`);
                const maxButton = document.createElement('button');
                maxButton.type = 'button';
                maxButton.className = 'track-max-button';
                maxButton.textContent = 'max...';
                maxButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const newMax = prompt(`Enter new maximum for ${trackConfig.name}:`, maxValue);
                    if (newMax !== null && newMax !== '') {
                        const parsedMax = parseInt(newMax, 10);
                        if (!isNaN(parsedMax) && parsedMax >= 1) {
                            setTrackMaxValue(trackId, parsedMax);
                        } else {
                            alert('Please enter a valid number (minimum 1)');
                        }
                    }
                });
                trackLabel.appendChild(document.createTextNode(' '));
                trackLabel.appendChild(maxButton);
            }
            
            individualTrackContainer.appendChild(trackLabel);
            individualTrackContainer.appendChild(shapesContainer);
            trackContainer.appendChild(individualTrackContainer);
        });
        
        return trackContainer;
    }

    /**
     * Handle clicking on a track shape
     */
    function handleShapeClick(trackId, clickedValue, maxValue) {
        const currentValue = getCurrentTrackValue(trackId, new URLSearchParams(location.search));
        
        let newValue;
        if (clickedValue <= currentValue) {
            // Clicking on a filled shape or lower - set to one less than clicked
            newValue = clickedValue - 1;
        } else {
            // Clicking on an empty shape - fill up to that shape
            newValue = clickedValue;
        }
        
        // Clamp to valid range
        newValue = Math.max(0, Math.min(newValue, maxValue));
        
        // Update display
        updateSingleTrackDisplay(trackId, newValue, maxValue);
        
        // Update URL
        updateTrackValueInURL(trackId, newValue);
    }

    /**
     * Update the visual display of a single track counter
     */
    function updateSingleTrackDisplay(trackId, currentValue, maxValue) {
        // Find shapes with matching trackId
        const shapes = document.querySelectorAll(`[data-track-id="${trackId}"]`);
        shapes.forEach((shape, index) => {
            const shapeValue = parseInt(shape.dataset.value);
            if (shapeValue <= currentValue) {
                shape.classList.add('filled');
            } else {
                shape.classList.remove('filled');
            }
        });
        
        // Update corresponding label
        const trackContainer = shapes[0]?.closest('.individual-track');
        const label = trackContainer?.querySelector('.track-label');
        if (label && shapes.length > 0) {
            // Extract track name from current label text
            const currentText = label.textContent;
            const trackName = currentText.split(':')[0];
            
            // Check if there's a max button we need to preserve
            const existingButton = label.querySelector('.track-max-button');
            
            // Update the text
            label.textContent = `${trackName}: ${currentValue}/${maxValue}`;
            
            // Re-append the button if it existed
            if (existingButton) {
                label.appendChild(document.createTextNode(' '));
                label.appendChild(existingButton);
            }
        }
    }

    /**
     * Update the visual display of all track counters for a move
     */
    function updateTrackDisplay(moveId, currentValue, maxValue) {
        // Legacy function - delegates to single track update
        updateSingleTrackDisplay(moveId, currentValue, maxValue);
    }

    /**
     * Get current track value from URL parameters
     */
    function getCurrentTrackValue(trackId, urlParams) {
        const paramName = `track_${trackId}`;
        const value = urlParams.get(paramName);
        return value ? parseInt(value, 10) : 0;
    }

    /**
     * Get track max value from URL parameters, with fallback to default
     */
    function getTrackMaxValue(trackId, urlParams, defaultMax) {
        const paramName = `track_${trackId}_max`;
        const value = urlParams.get(paramName);
        return value ? parseInt(value, 10) : defaultMax;
    }
    
    /**
     * Set track max value in URL and trigger re-render
     */
    function setTrackMaxValue(trackId, maxValue) {
        const params = new URLSearchParams(location.search);
        const paramName = `track_${trackId}_max`;
        
        params.set(paramName, maxValue.toString());
        
        // Also clamp current value if it exceeds new max
        const currentParamName = `track_${trackId}`;
        const currentValue = params.get(currentParamName);
        if (currentValue && parseInt(currentValue, 10) > maxValue) {
            params.set(currentParamName, maxValue.toString());
        }
        
        const newUrl = params.toString() ? '?' + params.toString() : location.pathname;
        history.replaceState({}, '', newUrl);
        
        // Trigger re-render
        if (window.Layout && window.Layout.layoutApplication) {
            window.Layout.layoutApplication();
        }
    }

    /**
     * Update track value in URL parameters
     */
    function updateTrackValueInURL(trackId, value) {
        const params = new URLSearchParams(location.search);
        const paramName = `track_${trackId}`;
        
        if (value > 0) {
            params.set(paramName, value.toString());
        } else {
            params.delete(paramName);
        }
        
        const newUrl = params.toString() ? '?' + params.toString() : location.pathname;
        history.replaceState({}, '', newUrl);
    }

    /**
     * Initialize track counters after page render
     */
    function initializeTrackCounters() {
        console.log('Track system: Initializing track counters...');
        if (!window.moves || !Array.isArray(window.moves)) {
            console.log('Track system: window.moves not available or not an array');
            return;
        }
        
        console.log('Track system: Found', window.moves.length, 'moves');
        const urlParams = new URLSearchParams(location.search);
        
        // Update all track displays based on current URL state
        let trackMovesFound = 0;
        window.moves.forEach(move => {
            if (move.tracks) {
                trackMovesFound++;
                console.log('Track system: Processing move', move.id, 'with tracks:', move.tracks);
                const trackConfigs = move.tracks;
                trackConfigs.forEach((trackConfig, index) => {
                    const trackId = trackConfigs.length > 1 ? `${move.id}_${index}` : move.id;
                    const currentValue = getCurrentTrackValue(trackId, urlParams);
                    const defaultMax = trackConfig.max || 5;
                    const maxValue = getTrackMaxValue(trackId, urlParams, defaultMax);
                    console.log('Track system: Updating display for trackId:', trackId, 'value:', currentValue, 'max:', maxValue);
                    updateSingleTrackDisplay(trackId, currentValue, maxValue);
                });
            }
        });
        console.log('Track system: Found', trackMovesFound, 'moves with tracking');
    }

    /**
     * Handle when a move with tracking is toggled on/off
     */
    function handleTrackedMoveToggle(moveId, isChecked) {
        if (!isChecked) {
            // Move was unchecked - reset all tracks to 0
            const move = window.moves?.find(m => m.id === moveId);
            if (move?.tracks) {
                const trackConfigs = move.tracks;
                trackConfigs.forEach((trackConfig, index) => {
                    const trackId = trackConfigs.length > 1 ? `${moveId}_${index}` : moveId;
                    const maxValue = trackConfig.max || 5;
                    updateSingleTrackDisplay(trackId, 0, maxValue);
                    updateTrackValueInURL(trackId, 0);
                });
            }
        }
        // If checked, leave current track values as is (don't auto-reset)
    }

    // Public API
    return {
        createTrackDisplay,
        updateTrackDisplay,
        getCurrentTrackValue,
        initializeTrackCounters,
        handleTrackedMoveToggle
    };
})();

// Note: Initialization is now handled by the moves rendering system
// No need for auto-initialization here
