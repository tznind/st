// Crew loyalty tracking and member management functionality
(function() {
  'use strict';

  console.log('Crew script loading...');

  function initializeCrew(container, suffix) {
    console.log('Initializing crew...', { container, suffix });

    // Create scoped helpers
    const helpers = window.CardHelpers.createScopedHelpers(container, suffix);

    // Initialize dynamic table
    if (window.DynamicTable) {
      window.DynamicTable.initializeInContainer(container, suffix);
      console.log('Dynamic table initialized for crew');
    }

    // Get loyalty elements
    const loyaltyShapes = container.querySelectorAll('[data-track-id="cr_loyalty"]');
    const loyaltyLabel = container.querySelector('.track-label');

    // Get initial values from URL
    const urlParams = new URLSearchParams(window.location.search);
    let currentLoyalty = parseInt(urlParams.get('cr_loyalty')) || 0;

    console.log('Initial loyalty value:', currentLoyalty);

    /**
     * Update loyalty display
     */
    function updateLoyaltyDisplay(value) {
      loyaltyShapes.forEach((shape) => {
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

    /**
     * Calculate base HP based on veteran/hero checkboxes
     */
    function calculateHP() {
      let baseHP = 6;

      // Check Veteran Crew +2 HP checkbox
      if (helpers.isChecked('cr_vet3')) {
        baseHP += 2;
      }

      // Check Heroes to the Last +4 HP checkbox
      if (helpers.isChecked('cr_her3')) {
        baseHP += 4;
      }

      return baseHP;
    }

    /**
     * Calculate damage based on veteran/hero checkboxes
     */
    function calculateDamage() {
      let damage = 'd6'; // Base damage

      // Check Veteran Crew damage increase to d8
      if (helpers.isChecked('cr_vet2')) {
        damage = 'd8';
      }

      // Check Heroes to the Last damage increase (max d10)
      if (helpers.isChecked('cr_her4')) {
        if (damage === 'd6') {
          damage = 'd8';
        } else if (damage === 'd8') {
          damage = 'd10';
        }
      }

      return damage;
    }

    /**
     * Update all calculated fields (damage and member max HP)
     */
    function updateCalculatedFields() {
      const hp = calculateHP();
      const damage = calculateDamage();

      // Update damage field
      helpers.setValue('cr_dm', damage);

      // Update all member Max HP fields
      const members = helpers.getTableData('cr_members');
      members.forEach((member, index) => {
        const maxHpId = `cr_members_${index}_maxhp`;
        const maxHpElement = helpers.getElement(maxHpId);
        if (maxHpElement) {
          maxHpElement.value = hp;
        }
      });

      console.log('Updated calculated fields - HP:', hp, 'Damage:', damage);
    }

    /**
     * Update URL with loyalty value
     */
    function updateURL() {
      const params = new URLSearchParams(window.location.search);

      if (currentLoyalty > 0) {
        params.set('cr_loyalty', currentLoyalty.toString());
      } else {
        params.delete('cr_loyalty');
      }

      const newUrl = params.toString() ? '?' + params.toString() : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }

    // Set up loyalty click handlers
    loyaltyShapes.forEach((shape) => {
      if (!shape.hasAttribute('data-cr-loyalty-listener')) {
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
          updateLoyaltyDisplay(newValue);
          updateURL();
        });
        shape.setAttribute('data-cr-loyalty-listener', 'true');
      }
    });

    // Add checkbox event listeners for auto-calculation
    const checkboxes = ['cr_vet2', 'cr_vet3', 'cr_her3', 'cr_her4'];
    checkboxes.forEach(checkboxId => {
      helpers.addEventListener(checkboxId, 'change', updateCalculatedFields);
    });

    // Override the dynamic table's add row to set initial Max HP
    const originalAddButton = container.querySelector('[data-table-add="cr_members"]');
    if (originalAddButton) {
      originalAddButton.addEventListener('click', () => {
        // Small delay to let the row be created
        setTimeout(() => {
          updateCalculatedFields();
        }, 50);
      });
    }

    // Initialize loyalty display
    updateLoyaltyDisplay(currentLoyalty);

    // Initialize calculated fields (damage and member Max HP)
    setTimeout(() => {
      updateCalculatedFields();
    }, 100);

    console.log('Crew initialization complete');
  }

  // Export initialization function for the card system
  window.CardInitializers = window.CardInitializers || {};
  window.CardInitializers.crew = initializeCrew;
})();
