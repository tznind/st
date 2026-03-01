window.CardInitializers = window.CardInitializers || {};

window.CardInitializers.outfit = function(container, suffix) {
    console.log('hello world');

    const helpers = window.CardHelpers.createScopedHelpers(container, suffix);

    // Weight mapping (default 1, heavier items override)
    const itemWeights = {
        outfit_Firewood: 2,
        outfit_Sledge_litter: 2,
        outfit_Long_spear: 2,
        outfit_Shield: 2,
        outfit_Thick_hides: 2
    };

    function recompute() {
        const usedSpan = helpers.getElement('outfit_weightused');
        const allowedSpan = helpers.getElement('outfit_weightallowed');
        const suppliesUsed = helpers.getElement('outfit_suppliesused');
        const suppliesAvailable = helpers.getElement('outfit_suppliesavailable');
        const prosperity = helpers.getElement('outfit_prosperity');

        console.log('Recomputing...', { usedSpan, allowedSpan, suppliesAvailable });

        if (!usedSpan || !allowedSpan || !suppliesAvailable) {
            console.log('Missing elements, aborting recompute');
            return;
        }

        // Check for Pack Horse move (increases capacity by 1)
        const hasPackHorse = document.getElementById('move_rg013')?.checked || false;
        const bonus = hasPackHorse ? 1 : 0;

        // Allowed weight
        console.log('Radio states:', {
            light: helpers.isChecked('outfit_light'),
            medium: helpers.isChecked('outfit_medium'),
            heavy: helpers.isChecked('outfit_heavy'),
            packHorse: hasPackHorse
        });

        if (helpers.isChecked('outfit_light')) allowedSpan.textContent = 3 + bonus;
        else if (helpers.isChecked('outfit_medium')) allowedSpan.textContent = 6 + bonus;
        else if (helpers.isChecked('outfit_heavy')) allowedSpan.textContent = 9 + bonus;
        else allowedSpan.textContent = 0;

        // Weight used from checkboxes
        let used = 0;
        const checkboxes = container.querySelectorAll('.items-section input[type="checkbox"]');
        checkboxes.forEach(cb => {
            if (cb.checked) {
                const baseId = suffix ? cb.id.replace(`_${suffix}`, '') : cb.id;
                used += itemWeights[baseId] || 1;
            }
        });

        // Weight used from dynamic table "Other" items
        const otherTable = helpers.getElement('outfit_other_items');
        if (otherTable) {
            const rows = otherTable.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const itemInput = row.querySelector('input[type="text"]');
                const weightInput = row.querySelector('input[type="number"]');
                if (itemInput && itemInput.value.trim() !== '') {
                    const weight = parseInt(weightInput?.value) || 1;
                    used += weight;
                }
            });
        }

        usedSpan.textContent = used;

        // Supplies available
        const prop = parseInt(prosperity?.value || 0);
        const usedSup = parseInt(suppliesUsed?.value || 0);
        let supplyCount = 0;
        ['outfit_cbSupplies1', 'outfit_cbSupplies2', 'outfit_cbSupplies3'].forEach(id => {
            if (helpers.isChecked(id)) supplyCount++;
        });
        const totalAvailable = supplyCount * (4 + prop);
        suppliesAvailable.textContent = Math.max(0, totalAvailable);

        console.log('Supplies calculation:', { prop, supplyCount, totalAvailable, usedSup });

        // Highlight if exceeded
        if (suppliesAvailable) {
            suppliesAvailable.style.backgroundColor = (usedSup > totalAvailable) ? 'pink' : '';
        }
        if (allowedSpan) {
            allowedSpan.style.backgroundColor = (used > parseInt(allowedSpan.textContent)) ? 'pink' : '';
        }
    }

    // Listen to radio button changes
    ['outfit_light', 'outfit_medium', 'outfit_heavy'].forEach(id => {
        const radio = helpers.getElement(id);
        if (radio) {
            radio.addEventListener('change', () => {
                console.log('Radio changed:', id);
                recompute();
            });
        }
    });

    // Listen to all other input changes
    const allInputs = container.querySelectorAll('input');
    allInputs.forEach(input => {
        input.addEventListener('change', recompute);
        input.addEventListener('input', recompute);
    });

    // Listen to Pack Horse move changes (outside the card)
    const packHorseMove = document.getElementById('move_rg013');
    if (packHorseMove) {
        packHorseMove.addEventListener('change', recompute);
    }

    // Handle add item button
    helpers.addEventListener('outfit_add_item_btn', 'click', () => {
        helpers.addTableRow('outfit_other_items', { item: '', weight: 1 });
    });

    // Listen to table changes for recompute
    const observer = new MutationObserver(recompute);
    const tableBody = helpers.getElement('outfit_other_items')?.querySelector('tbody');
    if (tableBody) {
        observer.observe(tableBody, { childList: true, subtree: true });
    }

    // Initial computation
    setTimeout(recompute, 100);
};
