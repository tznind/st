// Crew card initialization and member management functionality
(function() {
  'use strict';

  console.log('Crew script loading...');

  // 'group' is granted automatically and isn't offered as a pick
  const CREW_TAGS = [
    'archers', 'athletic', 'brave', 'cunning', 'devoted', 'hardy',
    'intimidating', 'observant', 'patient', 'respected', 'stealthy', 'warriors'
  ];

  const CREW_INSTINCTS = [
    'To bicker, infight, and hold grudges',
    'To hew to tradition and superstition',
    'To indulge their baser instincts',
    'To lord over others',
    'To take needless risks',
    'To take things too far'
  ];

  const CREW_COSTS = [
    'Merry-making, as a group',
    'Public recognition and respect, honor',
    'Risks taken, by you, to help them',
    'Victories won against worthy foes',
    'Wealth gained for themselves or Stonetop'
  ];

  const MEMBER_TAGS = [
    'animal-lover', 'big', 'bully', 'cynical', 'drunkard', 'eager', 'gambler',
    'greedy', 'grumpy', 'gullible', 'heartthrob', 'honest', 'kind', 'lewd',
    'little', 'naive', 'old', 'popular', 'proud', 'rookie', 'reckless',
    'shameless', 'sharp-eyed', 'short-tempered'
  ];

  const MEMBER_TRAITS = [
    "__'s kid/sibling/parent/cousin/__",
    'bald',
    'crush on __',
    'grudge against __',
    'hates __',
    'idolizes __',
    'jokes',
    'messy',
    'missing eye/finger/hand/__',
    'misses their kids',
    'nightmares',
    'recently married',
    'religious',
    'scars',
    'skinny',
    'sharp-tongued',
    'sings',
    'snores',
    'tells tall tales',
    'too serious',
    'troubles at home',
    'whistles',
    'whittler'
  ];

  // Veteran Crew (ms015) and Heroes to the Last (ms018) pick checkboxes,
  // rendered elsewhere on the page by moves-core.js as move_<id>_p<pickIndex+1>
  // - indices must match each move's "pick" array in data/moves/marshal.json
  const VET_DMG_MOVE_ID = 'move_ms015_p2';    // "Increase their damage die from d6 to d8"
  const VET_HP_MOVE_ID = 'move_ms015_p3';     // "Increase their max HP by 2 each"
  const HEROES_HP_MOVE_ID = 'move_ms018_p3';  // "Increase their max HP by 4 each"
  const HEROES_DMG_MOVE_ID = 'move_ms018_p4'; // "Increase their damage die one size (max d10)"

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

      // Check Veteran Crew "+2 HP each" pick (tracked from the move itself)
      if (document.getElementById(VET_HP_MOVE_ID)?.checked) {
        baseHP += 2;
      }

      // Check Heroes to the Last "+4 HP each" pick (tracked from the move itself)
      if (document.getElementById(HEROES_HP_MOVE_ID)?.checked) {
        baseHP += 4;
      }

      return baseHP;
    }

    /**
     * Calculate damage based on veteran/hero checkboxes
     */
    function calculateDamage() {
      let damage = 'd6'; // Base damage

      // Check Veteran Crew "damage die to d8" pick (tracked from the move itself)
      if (document.getElementById(VET_DMG_MOVE_ID)?.checked) {
        damage = 'd8';
      }

      // Check Heroes to the Last damage increase (max d10), tracked from the move itself
      if (document.getElementById(HEROES_DMG_MOVE_ID)?.checked) {
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

    // Listen for changes to the Veteran Crew / Heroes to the Last move picks
    // (rendered outside this card, elsewhere in the Marshal's move list)
    [VET_DMG_MOVE_ID, VET_HP_MOVE_ID, HEROES_HP_MOVE_ID, HEROES_DMG_MOVE_ID].forEach(moveElId => {
      const moveEl = document.getElementById(moveElId);
      if (moveEl) {
        moveEl.addEventListener('change', updateCalculatedFields);
      }
    });

    /**
     * "Create Your Crew" wizard - picks Tags, Instinct, and Cost
     */
    async function handleCreateCrew() {
      if (!window.Wizard) return;

      const existingTags = helpers.getElement('cr_tg');
      const existingInstinct = helpers.getElement('cr_in');
      const existingCost = helpers.getElement('cr_co');
      const hasData = (existingTags && existingTags.value) ||
                      (existingInstinct && existingInstinct.value) ||
                      (existingCost && existingCost.value);

      if (hasData && !confirm('This will replace your current Tags, Instinct, and Cost. Continue?')) {
        return;
      }

      const wizardData = [
        { type: 'get', options: ['group'] },
        { type: 'pick', title: 'Tags: pick 2 more (in addition to group and your background tag)', options: CREW_TAGS },
        { type: 'pickOne', title: 'Instinct: pick 1', options: CREW_INSTINCTS },
        { type: 'pickOne', title: 'Cost: pick 1', options: CREW_COSTS }
      ];

      const results = await window.Wizard.show(wizardData, { title: 'Create Your Crew' });
      if (!results) return;

      const chosenTags = ['group'];
      let instinct = '';
      let cost = '';

      results.forEach(item => {
        if (CREW_TAGS.includes(item)) {
          chosenTags.push(item);
        } else if (CREW_INSTINCTS.includes(item)) {
          instinct = item;
        } else if (CREW_COSTS.includes(item)) {
          cost = item;
        }
      });

      helpers.setValue('cr_tg', [...new Set(chosenTags)].join(', '));
      if (instinct) helpers.setValue('cr_in', instinct);
      if (cost) helpers.setValue('cr_co', cost);

      updateWizardButtonVisibility();
    }

    /**
     * Hide the "Create Your Crew" button once Tags have been entered
     * (whether via the wizard, manual typing, or a reloaded/persisted sheet)
     */
    function updateWizardButtonVisibility() {
      const wizardField = helpers.getElement('cr_wizard_field');
      const tagsField = helpers.getElement('cr_tg');
      if (wizardField) {
        wizardField.style.display = (tagsField && tagsField.value.trim()) ? 'none' : '';
      }
    }

    helpers.addEventListener('cr_wizard_btn', 'click', handleCreateCrew);
    helpers.addEventListener('cr_tg', 'input', updateWizardButtonVisibility);

    // Populate the Tags help icon with the full core tag list
    const tagsHelpBtn = helpers.getElement('cr_tags_help_btn');
    if (tagsHelpBtn) {
      const tagList = ['group', ...CREW_TAGS].map(tag => `- ${tag}`).join('\n');
      tagsHelpBtn.setAttribute(
        'data-help-text',
        `Your crew starts with **group**, a tag granted by your background, plus 2 more of your choice:\n\n${tagList}`
      );
    }

    /**
     * "+ Add Member" - prompts for a name, then a wizard for tag & traits
     */
    async function handleAddMember() {
      const name = prompt('Crew member name:');
      if (!name) return;

      if (window.Wizard) {
        const wizardData = [
          { type: 'pickOne', title: 'Tag', options: MEMBER_TAGS },
          { type: 'pick', title: 'Traits (pick one or more)', options: MEMBER_TRAITS }
        ];

        const results = await window.Wizard.show(wizardData, { title: `New Crew Member: ${name}` });
        if (!results) return;

        let tag = '';
        const traits = [];
        results.forEach(item => {
          if (MEMBER_TAGS.includes(item)) {
            tag = item;
          } else if (MEMBER_TRAITS.includes(item)) {
            traits.push(item);
          }
        });

        helpers.addTableRow('cr_members', { name, tag, traits: traits.join(', ') });
      } else {
        helpers.addTableRow('cr_members', { name });
      }

      setTimeout(() => {
        updateCalculatedFields();
      }, 50);
    }

    helpers.addEventListener('cr_add_member_btn', 'click', handleAddMember);

    // Initialize calculated fields (damage and member Max HP)
    setTimeout(() => {
      updateCalculatedFields();
      updateWizardButtonVisibility();
    }, 100);

    console.log('Crew initialization complete');
  }

  // Export initialization function for the card system
  window.CardInitializers = window.CardInitializers || {};
  window.CardInitializers.crew = initializeCrew;
})();
