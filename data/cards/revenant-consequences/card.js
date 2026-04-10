(function() {
  'use strict';

  function initializeRevenantConsequences(container) {
    // Wire up X buttons
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

    // Hide untaken: only the tick checkbox determines visibility
    var hideUntakenEl = document.getElementById('hide_untaken');

    function updateVisibility() {
      var hideUntaken = hideUntakenEl && hideUntakenEl.checked;
      container.querySelectorAll('[data-rc-mark]').forEach(function(item) {
        var tick = item.querySelector('.mark-tick');
        var isTaken = tick && tick.checked;
        item.style.display = (hideUntaken && !isTaken) ? 'none' : '';
      });
    }

    if (hideUntakenEl) {
      hideUntakenEl.addEventListener('change', updateVisibility);
    }
    container.querySelectorAll('.mark-tick').forEach(function(tick) {
      tick.addEventListener('change', updateVisibility);
    });
    updateVisibility();
  }

  function updateButton(btn, crossed) {
    btn.classList.toggle('is-crossed', crossed);
    btn.title = crossed ? 'Un-cross this mark' : 'Cross off this mark';
  }

  window.CardInitializers = window.CardInitializers || {};
  window.CardInitializers['revenant-consequences'] = initializeRevenantConsequences;
})();
