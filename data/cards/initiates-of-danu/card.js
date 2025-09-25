// Initiates of Danu loyalty tracking and data persistence
(function() {
  'use strict';
  
  console.log('Initiates of Danu script loading...');
  
  let isInitialized = false;
  const initiateNames = ['enfys', 'afon', 'gwendyl', 'olwin', 'seren'];
  const initiateIds = ['enf', 'afo', 'gwe', 'olw', 'ser'];
  const initiateSelectors = ['enfys-selected', 'afon-selected', 'gwendyl-selected', 'olwin-selected', 'seren-selected'];
  
  function initializeInitiates() {
    if (isInitialized) {
      console.log('Initiates already initialized, skipping...');
      return;
    }
    
    console.log('Initializing Initiates of Danu...');
    
    // Wait a bit for the DOM to be fully ready
    setTimeout(function() {
      const urlParams = new URLSearchParams(window.location.search);
      
      // Initialize loyalty tracking for each initiate
      initiateNames.forEach((initiateName, index) => {
        const loyaltyTrack = document.querySelector(`.loyalty-track[data-initiate="${initiateName}"]`);
        if (!loyaltyTrack) return;
        
        const loyaltyShapes = loyaltyTrack.querySelectorAll('.loyalty-circle');
        const initiateId = initiateIds[index];
        
        // Get initial loyalty value from URL
        let currentLoyalty = parseInt(urlParams.get(`${initiateId}_loy`)) || 0;
        
        console.log(`Initial loyalty for ${initiateName}:`, currentLoyalty);
        
        // Add click handlers to loyalty circles
        loyaltyShapes.forEach((shape) => {
          if (!shape.hasAttribute('data-listener-added')) {
            shape.addEventListener('click', function(event) {
              event.preventDefault();
              event.stopPropagation();
              
              const clickedValue = parseInt(this.dataset.value);
              let newValue;
              
              if (clickedValue <= currentLoyalty) {
                newValue = clickedValue - 1;
              } else {
                newValue = clickedValue;
              }
              
              newValue = Math.max(0, Math.min(newValue, 3));
              currentLoyalty = newValue;
              updateLoyaltyDisplay(loyaltyShapes, newValue);
              updateURL();
              
              console.log(`${initiateName} loyalty updated to:`, newValue);
            });
            shape.setAttribute('data-listener-added', 'true');
          }
        });
        
        // Initialize loyalty display
        updateLoyaltyDisplay(loyaltyShapes, currentLoyalty);
      });
      
      // Add event listeners to selection checkboxes
      initiateSelectors.forEach((selectorId, index) => {
        const checkbox = document.getElementById(selectorId);
        if (checkbox && !checkbox.hasAttribute('data-listener-added')) {
          checkbox.addEventListener('change', function() {
            updateInitiateVisibility(index);
            updateURL();
          });
          checkbox.setAttribute('data-listener-added', 'true');
        }
      });
      
      // Add event listeners to all other input fields for URL persistence
      const allInputs = document.querySelectorAll('.initiates-card input:not(.initiate-selector)');
      allInputs.forEach(input => {
        if (!input.hasAttribute('data-listener-added')) {
          input.addEventListener('input', updateURL);
          input.setAttribute('data-listener-added', 'true');
        }
      });
      
      // Load initial values from URL
      loadFromURL(urlParams);
      
      // Mark as initialized
      isInitialized = true;
      
      console.log('Initiates of Danu initialization complete');
    }, 100);
  }
  
  function updateLoyaltyDisplay(shapes, value) {
    shapes.forEach((shape) => {
      const shapeValue = parseInt(shape.dataset.value);
      if (shapeValue <= value) {
        shape.classList.add('filled');
      } else {
        shape.classList.remove('filled');
      }
    });
  }
  
  function updateInitiateVisibility(index) {
    const initiateName = initiateNames[index];
    const selectorId = initiateSelectors[index];
    const checkbox = document.getElementById(selectorId);
    const row = document.getElementById(`${initiateName}-row`);
    
    if (checkbox && row) {
      if (checkbox.checked) {
        row.classList.add('selected');
      } else {
        row.classList.remove('selected');
      }
    }
  }
  
  function updateURL() {
    const params = new URLSearchParams(window.location.search);
    
    // Update selection checkboxes
    initiateSelectors.forEach(selectorId => {
      const checkbox = document.getElementById(selectorId);
      if (checkbox && checkbox.checked) {
        params.set(selectorId, 'true');
      } else {
        params.delete(selectorId);
      }
    });
    
    // Update all input fields (excluding checkboxes which are handled above)
    const allInputs = document.querySelectorAll('.initiates-card input:not(.initiate-selector)');
    allInputs.forEach(input => {
      if (input.value) {
        params.set(input.id, input.value);
      } else {
        params.delete(input.id);
      }
    });
    
    // Update loyalty values
    initiateNames.forEach((initiateName, index) => {
      const loyaltyTrack = document.querySelector(`.loyalty-track[data-initiate="${initiateName}"]`);
      if (!loyaltyTrack) return;
      
      const filledShapes = loyaltyTrack.querySelectorAll('.loyalty-circle.filled');
      const loyaltyValue = filledShapes.length;
      const initiateId = initiateIds[index];
      
      if (loyaltyValue > 0) {
        params.set(`${initiateId}_loy`, loyaltyValue.toString());
      } else {
        params.delete(`${initiateId}_loy`);
      }
    });
    
    const newUrl = params.toString() ? '?' + params.toString() : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }
  
  function loadFromURL(urlParams) {
    // Load selection checkboxes
    initiateSelectors.forEach((selectorId, index) => {
      const checkbox = document.getElementById(selectorId);
      const isSelected = urlParams.get(selectorId) === 'true';
      if (checkbox) {
        checkbox.checked = isSelected;
        updateInitiateVisibility(index);
      }
    });
    
    // Load HP and custom pick values
    const allInputs = document.querySelectorAll('.initiates-card input[type="number"], .initiates-card input[type="text"]');
    allInputs.forEach(input => {
      const value = urlParams.get(input.id);
      if (value) {
        input.value = value;
      }
    });
    
    console.log('Loaded values from URL');
  }
  
  // Multiple initialization attempts
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeInitiates);
  } else {
    initializeInitiates();
  }
  
  // Also try after a delay in case cards are loaded dynamically
  setTimeout(initializeInitiates, 500);
  setTimeout(initializeInitiates, 1000);
})();
