// Render hex stats inside a container
window.renderStats = function(containerSelector, hexStats) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error('Stats container not found:', containerSelector);
    return;
  }

  if (!hexStats || !Array.isArray(hexStats)) {
    console.error('Invalid hexStats data provided');
    return;
  }

  const hexRow = document.createElement("div");
  hexRow.className = "hex-row";
  
  const urlParams = new URLSearchParams(location.search);

  hexStats.forEach(stat => {
    if (!stat) {
      console.warn('Invalid stat data:', stat);
      return;
    }

    const hexContainer = document.createElement("div");
    hexContainer.className = "hex-container";

    // Apply shape class if specified (default to hexagon)
    const shape = stat.shape || "hexagon";

    // Handle clock shape differently
    if (shape === "clock") {
      if (!stat.clock || !stat.clock.type || !stat.clock.faces) {
        console.warn('Clock stat missing required clock configuration:', stat);
        return;
      }
      
      const clockType = stat.clock.type;
      const clockFaces = stat.clock.faces;
      const clockFolder = `data/clocks/${clockType}`;
      
      // Create wrapper for clock with relative positioning (for floating inputs)
      const clockWrapper = document.createElement("div");
      clockWrapper.className = "clock-wrapper";

      const clockDiv = document.createElement("div");
      clockDiv.className = "clock stat-clock";
      clockDiv.id = stat.id || `clock_${Date.now()}`;
      clockDiv.setAttribute('data-clock-folder', clockFolder);
      clockDiv.setAttribute('data-clock-faces', clockFaces);

      // Create hidden input for persistence
      const input = document.createElement("input");
      input.type = "hidden";
      input.id = clockDiv.id + "-value";
      // Read initial value from URL params (same pattern as tracks)
      input.value = urlParams.get(input.id) || "0";

      clockWrapper.appendChild(clockDiv);
      clockWrapper.appendChild(input);

      // Add floating inputs if configured
      if (stat.clock.floatingInputs && Array.isArray(stat.clock.floatingInputs)) {
        stat.clock.floatingInputs.forEach(floatingInput => {
          if (!floatingInput.id || !floatingInput.position || !floatingInput.size) {
            console.warn('Invalid floating input configuration:', floatingInput);
            return;
          }

          const floatingInputEl = document.createElement("input");
          floatingInputEl.type = "text";
          floatingInputEl.className = "clock-floating-input";
          floatingInputEl.id = `${clockDiv.id}_${floatingInput.id}`;
          floatingInputEl.setAttribute('aria-label', floatingInput.id);

          // Position and size from config
          const [x, y] = floatingInput.position;
          const [width, height] = floatingInput.size;

          floatingInputEl.style.left = `${x}px`;
          floatingInputEl.style.top = `${y}px`;
          floatingInputEl.style.width = `${width}px`;
          floatingInputEl.style.height = `${height}px`;

          // Load persisted value from URL
          floatingInputEl.value = urlParams.get(floatingInputEl.id) || "";

          clockWrapper.appendChild(floatingInputEl);
        });
      }

      hexContainer.appendChild(clockWrapper);
      
      // Add title if provided
      if (stat.title) {
        const title = document.createElement("div");
        title.className = "hex-title";
        title.textContent = stat.title;
        hexContainer.appendChild(title);
      }
    } else if (shape === "double-up") {
      // Handle double-up shape (two half-height rectangles stacked)
      if (!stat.id || !stat.title) {
        console.warn('Invalid stat data (missing id or title):', stat);
        return;
      }

      // Split the title by comma
      const titles = stat.title.split(',').map(t => t.trim());
      if (titles.length !== 2) {
        console.warn('Double-up stat requires exactly 2 comma-delimited titles:', stat);
        return;
      }

      const wrapper = document.createElement("div");
      wrapper.className = "hex-input-wrapper shape-double-up";
      
      // Create top half container
      const topHalf = document.createElement("div");
      topHalf.className = "double-up-half double-up-top-half";
      
      const topInput = document.createElement("input");
      topInput.type = "text";
      topInput.id = stat.id + "_top";
      topInput.name = stat.id + "_top";
      topInput.placeholder = titles[0];
      topInput.setAttribute('aria-label', titles[0]);
      topInput.className = "double-up-input double-up-top";
      
      topHalf.appendChild(topInput);
      
      // Create middle title (top stat name)
      const middleTitle = document.createElement("div");
      middleTitle.className = "double-up-middle-title";
      middleTitle.textContent = titles[0];
      
      // Create bottom half container
      const bottomHalf = document.createElement("div");
      bottomHalf.className = "double-up-half double-up-bottom-half";
      
      const bottomInput = document.createElement("input");
      bottomInput.type = "text";
      bottomInput.id = stat.id + "_bottom";
      bottomInput.name = stat.id + "_bottom";
      bottomInput.placeholder = titles[1];
      bottomInput.setAttribute('aria-label', titles[1]);
      bottomInput.className = "double-up-input double-up-bottom";
      
      bottomHalf.appendChild(bottomInput);
      
      // Create bottom title (bottom stat name)
      const bottomTitle = document.createElement("div");
      bottomTitle.className = "double-up-bottom-title";
      bottomTitle.textContent = titles[1];
      
      wrapper.appendChild(topHalf);
      wrapper.appendChild(middleTitle);
      wrapper.appendChild(bottomHalf);
      wrapper.appendChild(bottomTitle);
      hexContainer.appendChild(wrapper);
    } else {
      // Standard stat (hexagon/square)
      if (!stat.id || !stat.title) {
        console.warn('Invalid stat data (missing id or title):', stat);
        return;
      }

      const wrapper = document.createElement("div");
      wrapper.className = "hex-input-wrapper";

      if (shape === "square") {
        wrapper.classList.add("shape-square");
      } else if (shape === "circle") {
        wrapper.classList.add("shape-circle");
      }

      const input = document.createElement("input");
      input.type = "text";
      input.id = stat.id;
      input.name = stat.id;
      input.placeholder = stat.title;
      input.setAttribute('aria-label', stat.title);
      
      // Note: persistence.js will handle loading/saving values

      wrapper.appendChild(input);
      hexContainer.appendChild(wrapper);

      const title = document.createElement("div");
      title.className = "hex-title";
      title.textContent = stat.title;
      hexContainer.appendChild(title);
    }
    
    // Add track display if stat has tracks
    if (stat.tracks && Array.isArray(stat.tracks) && stat.tracks.length > 0) {
      const trackDisplay = createStatTrackDisplay(stat, urlParams);
      if (trackDisplay) {
        hexContainer.appendChild(trackDisplay);
      }
    }

    hexRow.appendChild(hexContainer);
  });

  container.appendChild(hexRow);

  // Initialize any clocks that were just added
  if (window.Clock) {
    const newClocks = hexRow.querySelectorAll('.clock');
    newClocks.forEach(clock => {
      window.Clock.setupClock(clock);
    });
  }

  return hexRow;
};

/**
 * Create a track counter display for a stat
 */
function createStatTrackDisplay(stat, urlParams) {
  if (!stat.tracks || !window.Track) {
    return null;
  }
  
  const trackConfigs = stat.tracks;
  const trackContainer = document.createElement('div');
  trackContainer.className = 'stat-track-counter';
  
  // Prevent clicks from bubbling
  trackContainer.addEventListener('click', (event) => {
    event.stopPropagation();
  });
  
  // Create each track counter
  trackConfigs.forEach((trackConfig, index) => {
    const trackId = trackConfigs.length > 1 ? `stat_${stat.id}_${index}` : `stat_${stat.id}`;
    const currentValue = window.Track.getCurrentTrackValue(trackId, urlParams);
    // Check if there's a dynamic max in the URL, otherwise use default
    const defaultMax = trackConfig.max || 5;
    const maxValue = getStatTrackMaxValue(trackId, urlParams, defaultMax);
    const shape = trackConfig.shape || 'square';
    
    // Create individual track container
    const individualTrackContainer = document.createElement('div');
    individualTrackContainer.className = 'stat-individual-track';
    
    // Create shapes container
    const shapesContainer = document.createElement('div');
    shapesContainer.className = 'track-shapes';
    shapesContainer.setAttribute('data-track-id', trackId);
    shapesContainer.setAttribute('data-shape', shape);
    shapesContainer.setAttribute('data-track-name', trackConfig.name || '');

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
        event.stopPropagation();
        handleStatTrackClick(trackId, i, maxValue);
      });
      
      // Add keyboard handler
      shapeElement.addEventListener('keydown', (event) => {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          event.stopPropagation();
          handleStatTrackClick(trackId, i, maxValue);
        }
      });
      
      shapesContainer.appendChild(shapeElement);
    }
    
    // Create label showing track name and current/max (if name is provided)
    if (trackConfig.name) {
      const trackLabel = document.createElement('div');
      trackLabel.className = 'stat-track-label';
      trackLabel.textContent = `${trackConfig.name}: ${currentValue}/${maxValue}`;
      
      // Add dynamic max button if enabled
      if (trackConfig.dynamic) {
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
              setStatTrackMaxValue(trackId, parsedMax);
            } else {
              alert('Please enter a valid number (minimum 1)');
            }
          }
        });
        trackLabel.appendChild(document.createTextNode(' '));
        trackLabel.appendChild(maxButton);
      }
      
      individualTrackContainer.appendChild(trackLabel);
    }
    
    // Create shapes container wrapper to include start/end labels
    const shapesWrapper = document.createElement('div');
    shapesWrapper.className = 'stat-track-shapes-wrapper';

    // Add start label if provided (before the shapes)
    if (trackConfig.startLabel) {
      const startLabel = document.createElement('span');
      startLabel.className = 'stat-track-start-label';
      startLabel.textContent = trackConfig.startLabel;
      shapesWrapper.appendChild(startLabel);
    }

    shapesWrapper.appendChild(shapesContainer);

    // Add end label if provided (after the shapes)
    if (trackConfig.endLabel) {
      const endLabel = document.createElement('span');
      endLabel.className = 'stat-track-end-label';
      endLabel.textContent = trackConfig.endLabel;
      shapesWrapper.appendChild(endLabel);
    }
    
    individualTrackContainer.appendChild(shapesWrapper);
    trackContainer.appendChild(individualTrackContainer);
  });
  
  return trackContainer;
}

/**
 * Handle clicking on a stat track shape
 */
function handleStatTrackClick(trackId, clickedValue, maxValue) {
  if (!window.Track) return;
  
  const currentValue = window.Track.getCurrentTrackValue(trackId, new URLSearchParams(location.search));
  
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
  
  // Update display using Track module's function
  if (window.Track.updateSingleTrackDisplay) {
    window.Track.updateSingleTrackDisplay(trackId, newValue, maxValue);
  } else {
    // Fallback: update manually
    updateStatTrackDisplay(trackId, newValue, maxValue);
  }
  
  // Update URL
  updateStatTrackValueInURL(trackId, newValue);
}

/**
 * Update the visual display of a stat track counter
 */
function updateStatTrackDisplay(trackId, currentValue, maxValue) {
  const shapes = document.querySelectorAll(`[data-track-id="${trackId}"]`);
  shapes.forEach((shape) => {
    const shapeValue = parseInt(shape.dataset.value);
    if (shapeValue <= currentValue) {
      shape.classList.add('filled');
    } else {
      shape.classList.remove('filled');
    }
  });
  
  // Update corresponding label (if it exists)
  const trackContainer = shapes[0]?.closest('.stat-individual-track');
  const label = trackContainer?.querySelector('.stat-track-label');
  if (label && shapes.length > 0) {
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
 * Get stat track max value from URL parameters, with fallback to default
 */
function getStatTrackMaxValue(trackId, urlParams, defaultMax) {
  const paramName = `track_${trackId}_max`;
  const value = urlParams.get(paramName);
  return value ? parseInt(value, 10) : defaultMax;
}

/**
 * Set stat track max value in URL and update display dynamically
 */
function setStatTrackMaxValue(trackId, maxValue) {
  const params = new URLSearchParams(location.search);
  const paramName = `track_${trackId}_max`;

  params.set(paramName, maxValue.toString());

  // Also clamp current value if it exceeds new max
  const currentParamName = `track_${trackId}`;
  let currentValue = params.get(currentParamName);
  currentValue = currentValue ? parseInt(currentValue, 10) : 0;

  if (currentValue > maxValue) {
    currentValue = maxValue;
    params.set(currentParamName, maxValue.toString());
  }

  const newUrl = params.toString() ? '?' + params.toString() : location.pathname;
  history.replaceState({}, '', newUrl);

  // Update just this track's shapes without re-rendering entire app
  rebuildStatTrackShapes(trackId, currentValue, maxValue);
}

/**
 * Rebuild stat track shapes when max value changes (without re-rendering entire app)
 */
function rebuildStatTrackShapes(trackId, currentValue, maxValue) {
  // Find the shapes container for this track
  const shapesContainer = document.querySelector(`.track-shapes[data-track-id="${trackId}"]`);
  if (!shapesContainer) return;

  const shape = shapesContainer.getAttribute('data-shape') || 'square';
  const trackName = shapesContainer.getAttribute('data-track-name') || '';

  // Clear existing shapes
  shapesContainer.innerHTML = '';

  // Rebuild shapes with new max
  for (let i = 1; i <= maxValue; i++) {
    const shapeElement = document.createElement('div');
    shapeElement.className = `track-shape track-${shape}`;
    shapeElement.dataset.value = i;
    shapeElement.setAttribute('data-track-id', trackId);

    // Make focusable and accessible
    shapeElement.setAttribute('tabindex', '0');
    shapeElement.setAttribute('role', 'button');
    shapeElement.setAttribute('aria-label', `${trackName} - Set to ${i} of ${maxValue}`);

    if (i <= currentValue) {
      shapeElement.classList.add('filled');
    }

    // Add click handler
    shapeElement.addEventListener('click', (event) => {
      event.stopPropagation();
      handleStatTrackClick(trackId, i, maxValue);
    });

    // Add keyboard handler
    shapeElement.addEventListener('keydown', (event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        handleStatTrackClick(trackId, i, maxValue);
      }
    });

    shapesContainer.appendChild(shapeElement);
  }

  // Update the label if it exists
  const individualTrackContainer = shapesContainer.closest('.stat-individual-track');
  const trackLabel = individualTrackContainer?.querySelector('.stat-track-label');
  if (trackLabel) {
    const existingButton = trackLabel.querySelector('.track-max-button');
    trackLabel.textContent = `${trackName}: ${currentValue}/${maxValue}`;

    // Re-append the button if it existed
    if (existingButton) {
      trackLabel.appendChild(document.createTextNode(' '));
      trackLabel.appendChild(existingButton);
    }
  }
}

/**
 * Update stat track value in URL parameters
 */
function updateStatTrackValueInURL(trackId, value) {
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
