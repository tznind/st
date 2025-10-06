// Mastiffs loyalty tracking functionality
(function() {
  'use strict';
  
  console.log('Mastiffs loyalty script loading...');
  
  function initializeMastiffsLoyalty() {
    console.log('Initializing mastiffs loyalty...');
    
    const loyaltyShapes = document.querySelectorAll('.mastiffs-card [data-track-id="ms_loyalty"]');
    const loyaltyLabel = document.querySelector('.mastiffs-card .track-label');
    
    console.log('Found', loyaltyShapes.length, 'loyalty shapes');
    console.log('Found loyalty label:', loyaltyLabel);
    
    if (loyaltyShapes.length === 0) {
      console.log('No loyalty shapes found, aborting');
      return;
    }
    
    // Get initial value from URL or default to 0
    const urlParams = new URLSearchParams(window.location.search);
    let currentLoyalty = parseInt(urlParams.get('ms_loyalty')) || 0;
    console.log('Initial loyalty value:', currentLoyalty);
    
    function updateLoyaltyDisplay(value) {
      console.log('Updating loyalty display to:', value);
      loyaltyShapes.forEach((shape, index) => {
        const shapeValue = parseInt(shape.dataset.value);
        if (shapeValue <= value) {
          shape.classList.add('filled');
        } else {
          shape.classList.remove('filled');
        }
      });
      
      if (loyaltyLabel) {
        loyaltyLabel.textContent = `Loyalty: ${value}/3`;
      }
    }
    
    function updateURL(value) {
      console.log('Updating URL with loyalty:', value);
      const params = new URLSearchParams(window.location.search);
      if (value > 0) {
        params.set('ms_loyalty', value.toString());
      } else {
        params.delete('ms_loyalty');
      }
      const newUrl = params.toString() ? '?' + params.toString() : window.location.pathname;
      console.log('New URL will be:', newUrl);
      window.history.replaceState({}, '', newUrl);
    }
    
    // Add click handlers with duplicate prevention
    loyaltyShapes.forEach((shape, index) => {
      if (!shape.hasAttribute('data-ms-loyalty-listener')) {
        console.log('Adding click handler to shape', index + 1);
        shape.addEventListener('click', function(event) {
          event.preventDefault();
          event.stopPropagation();
          
          const clickedValue = parseInt(this.dataset.value);
          console.log('Clicked on loyalty shape with value:', clickedValue);
          console.log('Current loyalty before click:', currentLoyalty);
          
          let newValue;
          
          if (clickedValue <= currentLoyalty) {
            // Clicking on filled or lower - reduce by one
            newValue = clickedValue - 1;
          } else {
            // Clicking on empty - fill up to that point
            newValue = clickedValue;
          }
          
          newValue = Math.max(0, Math.min(newValue, 3));
          console.log('New loyalty value will be:', newValue);
          
          currentLoyalty = newValue;
          updateLoyaltyDisplay(newValue);
          updateURL(newValue);
        });
        shape.setAttribute('data-ms-loyalty-listener', 'true');
      } else {
        console.log('Click handler already exists for shape', index + 1);
      }
    });
    
    // Initialize display
    updateLoyaltyDisplay(currentLoyalty);
    console.log('Mastiffs loyalty initialization complete');
  }
  
  // Export initialization function for the card system
  window.CardInitializers = window.CardInitializers || {};
  window.CardInitializers.mastiffs = initializeMastiffsLoyalty;
})();
