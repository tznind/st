// Animal Companion card initialization
(function() {
  'use strict';

  console.log('Animal Companion card script loading...');

  function initializeAnimalCompanion(container, suffix) {
    console.log('Initializing animal companion card...', { container, suffix });

    // Create scoped helpers for this card instance
    const helpers = window.CardHelpers.createScopedHelpers(container, suffix);

    // Add loyalty track with 3 circles using the new helper function
    helpers.addTrack('ac_loyalty_track', [
      {
        name: 'Loyalty',
        max: 3,
        shape: 'circle'
      }
    ]);

    console.log('Animal Companion card initialization complete');
  }

  // Export initialization function for the card system
  window.CardInitializers = window.CardInitializers || {};
  window.CardInitializers['animal-companion'] = initializeAnimalCompanion;
})();
