// Initiates of Danu card initialization
(function() {
  'use strict';

  console.log('Initiates of Danu card script loading...');

  function initializeInitiatesOfDanu(container, suffix) {
    console.log('Initializing Initiates of Danu card...', { container, suffix });

    // Create scoped helpers for this card instance
    const helpers = window.CardHelpers.createScopedHelpers(container, suffix);

    // Add loyalty tracks for each initiate using the new helper function
    const initiates = ['enfys', 'afon', 'gwendyl', 'olwin', 'seren'];

    initiates.forEach(initiateName => {
      helpers.addTrack(`${initiateName}_loyalty_track`, [
        {
          name: 'Loyalty',
          max: 3,
          shape: 'circle'
        }
      ]);
    });

    console.log('Initiates of Danu card initialization complete');
  }

  // Export initialization function for the card system
  window.CardInitializers = window.CardInitializers || {};
  window.CardInitializers['initiates-of-danu'] = initializeInitiatesOfDanu;
})();
