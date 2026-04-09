(function() {
  'use strict';

  function initializeThrallMarks(container) {
    container.querySelectorAll('.mark-x-btn').forEach(function(btn) {
      var crossId = btn.getAttribute('data-cross');
      var checkbox = container.querySelector('#' + crossId);
      if (!checkbox) return;

      updateButton(btn, checkbox.checked);

      btn.addEventListener('click', function() {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        updateButton(btn, checkbox.checked);
      });
    });
  }

  function updateButton(btn, crossed) {
    btn.classList.toggle('is-crossed', crossed);
    btn.title = crossed ? 'Un-cross this mark' : 'Cross off this mark';
  }

  window.CardInitializers = window.CardInitializers || {};
  window.CardInitializers['thrall-marks'] = initializeThrallMarks;
})();
