// Initiates of Danu basic functionality
console.log('*** INITIATES OF DANU SCRIPT STARTING ***');

(function() {
  'use strict';
  
  console.log('Initiates script loading...');
  
  const initiateSelectors = ['enfys_selected', 'afon_selected', 'gwendyl_selected', 'olwin_selected', 'seren_selected'];
  const initiateNames = ['enfys', 'afon', 'gwendyl', 'olwin', 'seren'];
  
  function setupCheckboxes() {
    console.log('Setting up checkboxes...');
    
    initiateSelectors.forEach((selectorId, index) => {
      console.log(`Looking for checkbox: ${selectorId}`);
      const checkbox = document.getElementById(selectorId);
      if (checkbox) {
        console.log(`Found checkbox ${selectorId}`);
        
        // Check if we already added a listener to prevent duplicates
        if (!checkbox.hasAttribute('data-initiates-listener')) {
          console.log(`Adding event listener to ${selectorId}`);
          checkbox.addEventListener('change', function() {
            console.log(`Checkbox ${selectorId} changed to:`, this.checked);
            updateDisplay();
          });
          checkbox.setAttribute('data-initiates-listener', 'true');
        } else {
          console.log(`Event listener already exists for ${selectorId}`);
        }
      } else {
        console.log(`Checkbox ${selectorId} NOT FOUND`);
      }
    });
    
    setupLoyalty();
    restoreLoyaltyState();
    updateDisplay();
  }
  
  function setupLoyalty() {
    console.log('Setting up loyalty circles...');
    
    initiateNames.forEach((initiateName, index) => {
      console.log(`Setting up loyalty for ${initiateName}`);
      const loyaltyTrack = document.querySelector(`.loyalty-track[data-initiate="${initiateName}"]`);
      
      if (loyaltyTrack) {
        console.log(`Found loyalty track for ${initiateName}`);
        const loyaltyCircles = loyaltyTrack.querySelectorAll('.loyalty-circle');
        console.log(`Found ${loyaltyCircles.length} loyalty circles for ${initiateName}`);
        
        loyaltyCircles.forEach((circle, circleIndex) => {
          // Check if we already added a listener to prevent duplicates
          if (!circle.hasAttribute('data-loyalty-listener')) {
            console.log(`Adding loyalty listener to circle ${circleIndex + 1} for ${initiateName}`);
            circle.addEventListener('click', function(event) {
              event.preventDefault();
              event.stopPropagation();
              
              const clickedValue = parseInt(this.dataset.value);
              console.log(`Loyalty circle clicked for ${initiateName}, value: ${clickedValue}`);
              
              // Update loyalty display
              updateLoyaltyDisplay(initiateName, clickedValue);
              
              // Save to hidden input for persistence
              const loyaltyInput = document.getElementById(`${initiateName}_loyalty`);
              if (loyaltyInput) {
                loyaltyInput.value = clickedValue;
                // Trigger persistence save
                const form = document.querySelector('form');
                if (form && window.Persistence) {
                  window.Persistence.saveToURL(form);
                }
              }
            });
            circle.setAttribute('data-loyalty-listener', 'true');
          } else {
            console.log(`Loyalty listener already exists for circle ${circleIndex + 1} of ${initiateName}`);
          }
        });
      } else {
        console.log(`Loyalty track NOT FOUND for ${initiateName}`);
      }
    });
  }
  
  function updateLoyaltyDisplay(initiateName, loyaltyValue) {
    const loyaltyTrack = document.querySelector(`.loyalty-track[data-initiate="${initiateName}"]`);
    if (loyaltyTrack) {
      const loyaltyCircles = loyaltyTrack.querySelectorAll('.loyalty-circle');
      loyaltyCircles.forEach((circle, circleIndex) => {
        if (circleIndex < loyaltyValue) {
          circle.classList.add('filled');
        } else {
          circle.classList.remove('filled');
        }
      });
    }
  }
  
  function restoreLoyaltyState() {
    console.log('Restoring loyalty state from persistence...');
    
    initiateNames.forEach((initiateName) => {
      const loyaltyInput = document.getElementById(`${initiateName}_loyalty`);
      if (loyaltyInput && loyaltyInput.value) {
        const loyaltyValue = parseInt(loyaltyInput.value);
        if (loyaltyValue > 0) {
          console.log(`Restoring ${initiateName} loyalty to ${loyaltyValue}`);
          updateLoyaltyDisplay(initiateName, loyaltyValue);
        }
      }
    });
  }
  
  function updateDisplay() {
    console.log('Updating display...');
    
    // Check if hide untaken is enabled
    const hideUntakenCheckbox = document.getElementById('hide_untaken');
    const hideUntaken = hideUntakenCheckbox ? hideUntakenCheckbox.checked : false;
    
    initiateSelectors.forEach((selectorId, index) => {
      const checkbox = document.getElementById(selectorId);
      const initiateName = initiateNames[index];
      const rowId = `${initiateName}-row`;
      const row = document.getElementById(rowId);
      
      if (checkbox && row) {
        if (checkbox.checked) {
          // Show and mark as selected
          row.classList.add('selected');
          row.style.display = '';
          console.log(`Added selected to ${initiateName}`);
        } else {
          // Remove selected styling
          row.classList.remove('selected');
          // Hide if 'Hide untaken' is checked, else show
          if (hideUntaken) {
            row.style.display = 'none';
            console.log(`Hid unselected ${initiateName}`);
          } else {
            row.style.display = '';
            console.log(`Removed selected from ${initiateName}`);
          }
        }
      } else {
        console.log(`Missing elements for ${initiateName}: checkbox=${!!checkbox}, row=${!!row}`);
      }
    });
  }
  
  // Create global initialization function that can be called whenever card is recreated
  window.initializeInitiatesOfDanu = function() {
    console.log('Initializing Initiates of Danu card...');
    setupCheckboxes();
  };
  
  // Simple initialization for first load
  console.log('Setting up initialization...');
  
  // Try multiple times to catch the card when it's ready
  setTimeout(function() {
    console.log('First attempt at 100ms...');
    setupCheckboxes();
  }, 100);
  
  setTimeout(function() {
    console.log('Second attempt at 1000ms...');
    setupCheckboxes();
  }, 1000);
  
  setTimeout(function() {
    console.log('Third attempt at 2000ms...');
    setupCheckboxes();
  }, 2000);
  
  // Also try immediately if DOM is ready
  if (document.readyState !== 'loading') {
    console.log('DOM ready, trying immediately...');
    setupCheckboxes();
  }
  
})();

console.log('*** INITIATES SCRIPT END ***');
