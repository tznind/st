// Crew card initialization and member management functionality
(function() {
  'use strict';

  console.log('Crew script loading...');

  function initializeCrew(container, suffix) {
    console.log('Initializing crew...', { container, suffix });

    // Create scoped helpers
    const helpers = window.CardHelpers.createScopedHelpers(container, suffix);

    // Add loyalty track with 3 circles using the new helper function
    helpers.addTrack('cr_loyalty_track', [
      {
        name: 'Loyalty',
        max: 3,
        shape: 'circle'
      }
    ]);

    // Initialize dynamic table
    // IMPORTANT: Don't pass suffix - the table ID is already auto-suffixed in the HTML
    if (window.DynamicTable) {
      window.DynamicTable.initializeInContainer(container);
      console.log('Dynamic table initialized for crew');
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
