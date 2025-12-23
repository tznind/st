// Good Dog card initialization
(function() {
  'use strict';

  console.log('Good Dog card script loading...');

  function initializeGoodDog(container, suffix) {
    console.log('Initializing good dog card...', { container, suffix });

    // Create scoped helpers for this card instance
    const helpers = window.CardHelpers.createScopedHelpers(container, suffix);

    // Add loyalty track with 3 circles using the new helper function
    helpers.addTrack('gd_loyalty_track', [
      {
        name: 'Loyalty',
        max: 3,
        shape: 'circle'
      }
    ]);

    console.log('Good Dog card initialization complete');
  }

  // Export initialization function for the card system
  window.CardInitializers = window.CardInitializers || {};
  window.CardInitializers['good-dog'] = initializeGoodDog;
})();
