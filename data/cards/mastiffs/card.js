// Mastiffs card initialization
(function() {
  'use strict';

  console.log('Mastiffs card script loading...');

  function initializeMastiffs(container, suffix) {
    console.log('Initializing mastiffs card...', { container, suffix });

    // Create scoped helpers for this card instance
    const helpers = window.CardHelpers.createScopedHelpers(container, suffix);

    // Add loyalty track with 3 circles using the new helper function
    helpers.addTrack('ms_loyalty_track', [
      {
        name: 'Loyalty',
        max: 3,
        shape: 'circle'
      }
    ]);

    console.log('Mastiffs card initialization complete');
  }

  // Export initialization function for the card system
  window.CardInitializers = window.CardInitializers || {};
  window.CardInitializers.mastiffs = initializeMastiffs;
})();
