// Wizard - Reusable modal wizard for choices
// Supports "get" (auto items), "pickOne" (radio), and "pick" (checkbox) types

window.Wizard = {
  /**
   * Show wizard modal with choices
   * @param {Array} wizardData - Array of wizard entries with type, options, etc.
   * @param {Object} options - Optional config {title: string}
   * @returns {Promise<Array>} Resolves with array of selected item strings, or null if cancelled
   */
  show: function(wizardData, options = {}) {
    return new Promise((resolve) => {
      const modal = this._buildModal(wizardData, options);
      this._setupHandlers(modal, wizardData, resolve);
      document.body.appendChild(modal);
    });
  },

  // Utility: Escape HTML
  _escapeHtml: function(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Build modal HTML
  _buildModal: function(wizardData, options) {
    const modal = document.createElement('div');
    modal.className = 'wizard-modal';

    // Separate auto-get items from choice items
    const autoItems = [];
    const choiceGroups = [];

    wizardData.forEach((entry, index) => {
      if (entry.type === 'get') {
        // Auto items - you receive these automatically
        entry.options.forEach(opt => {
          autoItems.push(opt);
        });
      } else if (entry.type === 'pickOne' || entry.type === 'pick') {
        // Choice items
        choiceGroups.push({...entry, groupIndex: index});
      }
    });

    // Build auto items section
    let autoItemsHTML = '';
    if (autoItems.length > 0) {
      autoItemsHTML = `
        <div class="wizard-auto-items">
          <h4>You will receive:</h4>
          <ul>
            ${autoItems.map(item => `<li>${this._escapeHtml(item)}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    // Build choice groups
    let choicesHTML = '';
    if (choiceGroups.length > 0) {
      choicesHTML = `
        <div class="wizard-choices">
          ${choiceGroups.map(group => {
            const inputType = group.type === 'pickOne' ? 'radio' : 'checkbox';
            const inputName = `wizard_choice_${group.groupIndex}`;

            return `
              <div class="wizard-choice-group">
                <h4>${this._escapeHtml(group.title || 'Choose:')}</h4>
                <div class="wizard-options">
                  ${group.options.map((option, optIndex) => `
                    <div class="wizard-option">
                      <input type="${inputType}"
                             name="${inputName}"
                             value="${optIndex}"
                             id="${inputName}_${optIndex}"
                             data-item="${this._escapeHtml(option)}">
                      <label for="${inputName}_${optIndex}">${this._escapeHtml(option)}</label>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="wizard-content">
        <button class="wizard-close" aria-label="Close">&times;</button>
        <h3>${this._escapeHtml(options.title || 'Make Your Selections')}</h3>
        ${autoItemsHTML}
        ${choicesHTML}
        <div class="wizard-actions">
          <button type="button" class="wizard-cancel">Cancel</button>
          <button type="button" class="wizard-ok">OK</button>
        </div>
      </div>
    `;

    return modal;
  },

  // Collect selected items
  _collectSelections: function(modal, wizardData) {
    const results = [];

    wizardData.forEach((entry, index) => {
      if (entry.type === 'get') {
        // Add all auto-get items
        entry.options.forEach(option => {
          results.push(option);
        });
      } else if (entry.type === 'pickOne') {
        // Add selected radio option
        const inputName = `wizard_choice_${index}`;
        const selectedRadio = modal.querySelector(`input[name="${inputName}"]:checked`);
        if (selectedRadio) {
          results.push(selectedRadio.getAttribute('data-item'));
        }
      } else if (entry.type === 'pick') {
        // Add all checked checkboxes
        const inputName = `wizard_choice_${index}`;
        const selectedCheckboxes = modal.querySelectorAll(`input[name="${inputName}"]:checked`);
        selectedCheckboxes.forEach(checkbox => {
          results.push(checkbox.getAttribute('data-item'));
        });
      }
    });

    return results;
  },

  // Setup event handlers
  _setupHandlers: function(modal, wizardData, resolve) {
    // Close button
    const closeBtn = modal.querySelector('.wizard-close');
    closeBtn.addEventListener('click', () => {
      modal.remove();
      resolve(null);
    });

    // Cancel button
    const cancelBtn = modal.querySelector('.wizard-cancel');
    cancelBtn.addEventListener('click', () => {
      modal.remove();
      resolve(null);
    });

    // OK button
    const okBtn = modal.querySelector('.wizard-ok');
    okBtn.addEventListener('click', () => {
      const selections = this._collectSelections(modal, wizardData);
      modal.remove();
      resolve(selections);
    });

    // Background click to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
        resolve(null);
      }
    });

    // Escape key to close
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', escapeHandler);
        resolve(null);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  }
};
