// Hounds card initialization
(function() {
  'use strict';

  console.log('Hounds card script loading...');

  function initializeHounds(container, suffix) {
    console.log('Initializing hounds card...', { container, suffix });

    // Create scoped helpers for this card instance
    const helpers = window.CardHelpers.createScopedHelpers(container, suffix);

    // Add loyalty track with 3 circles using the new helper function
    helpers.addTrack('hd_loyalty_track', [
      {
        name: 'Loyalty',
        max: 3,
        shape: 'circle'
      }
    ]);

    console.log('Hounds card initialization complete');
  }

  // Export initialization function for the card system
  window.CardInitializers = window.CardInitializers || {};
  window.CardInitializers.hounds = initializeHounds;
})();
