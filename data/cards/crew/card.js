// Crew loyalty tracking and member management functionality
(function() {
  'use strict';
  
  console.log('Crew script loading...');
  
  let memberCount = 0;
  
  function initializeCrew() {
    console.log('Initializing crew...');
    
    const loyaltyShapes = document.querySelectorAll('.crew-card [data-track-id="cr_loyalty"]');
    const loyaltyLabel = document.querySelector('.crew-card .track-label');
    const addMemberBtn = document.getElementById('add-member');
    const membersContainer = document.getElementById('crew-members');
      
      if (!addMemberBtn || !membersContainer) {
        console.log('Member management elements not found');
        return;
      }
      
      // Get initial values from URL
      const urlParams = new URLSearchParams(window.location.search);
      let currentLoyalty = parseInt(urlParams.get('cr_loyalty')) || 0;
      memberCount = parseInt(urlParams.get('cr_cnt')) || 0;
      
      console.log('Initial loyalty value:', currentLoyalty);
      console.log('Initial member count:', memberCount);
      
      function updateLoyaltyDisplay(value) {
        loyaltyShapes.forEach((shape, index) => {
          const shapeValue = parseInt(shape.dataset.value);
          if (shapeValue <= value) {
            shape.classList.add('filled');
          } else {
            shape.classList.remove('filled');
          }
        });
        
        if (loyaltyLabel) {
          loyaltyLabel.textContent = `Loyalty: ${value}/3`;
        }
      }
      
      function calculateHP() {
        let baseHP = 6;
        
        // Check Veteran Crew +2 HP checkbox
        const veteranHPBonus = document.getElementById('cr_vet3');
        if (veteranHPBonus && veteranHPBonus.checked) {
          baseHP += 2;
        }
        
        // Check Heroes to the Last +4 HP checkbox
        const heroesHPBonus = document.getElementById('cr_her3');
        if (heroesHPBonus && heroesHPBonus.checked) {
          baseHP += 4;
        }
        
        return baseHP;
      }
      
      function calculateDamage() {
        let damage = 'd6'; // Base damage
        
        // Check Veteran Crew damage increase to d8
        const veteranDamage = document.getElementById('cr_vet2');
        if (veteranDamage && veteranDamage.checked) {
          damage = 'd8';
        }
        
        // Check Heroes to the Last damage increase (max d10)
        const heroesDamage = document.getElementById('cr_her4');
        if (heroesDamage && heroesDamage.checked) {
          if (damage === 'd6') {
            damage = 'd8';
          } else if (damage === 'd8') {
            damage = 'd10';
          }
          // Already at d10, no further increase
        }
        
        return damage;
      }
      
      function updateCalculatedFields() {
        const hp = calculateHP();
        const damage = calculateDamage();
        
        // Update damage field
        const damageField = document.getElementById('cr_dm');
        if (damageField) {
          damageField.value = damage;
        }
        
        // Update all member Max HP fields
        for (let i = 0; i < memberCount; i++) {
          const maxHpField = document.getElementById(`m${i}m`);
          if (maxHpField) {
            maxHpField.value = hp;
          }
        }
        
        console.log('Updated calculated fields - HP:', hp, 'Damage:', damage);
      }
      
      function updateURL() {
        const params = new URLSearchParams(window.location.search);
        
        // Update loyalty
        if (currentLoyalty > 0) {
          params.set('cr_loyalty', currentLoyalty.toString());
        } else {
          params.delete('cr_loyalty');
        }
        
        // Update member count
        if (memberCount > 0) {
          params.set('cr_cnt', memberCount.toString());
        } else {
          params.delete('cr_cnt');
        }
        
        // Update member data (Max HP is calculated, not stored)
        for (let i = 0; i < memberCount; i++) {
          const nameInput = document.getElementById(`m${i}n`);
          const tagInput = document.getElementById(`m${i}t`);
          const traitsInput = document.getElementById(`m${i}r`);
          const hpInput = document.getElementById(`m${i}h`);
          
          if (nameInput && nameInput.value) params.set(`m${i}n`, nameInput.value);
          else params.delete(`m${i}n`);
          
          if (tagInput && tagInput.value) params.set(`m${i}t`, tagInput.value);
          else params.delete(`m${i}t`);
          
          if (traitsInput && traitsInput.value) params.set(`m${i}r`, traitsInput.value);
          else params.delete(`m${i}r`);
          
          if (hpInput && hpInput.value) params.set(`m${i}h`, hpInput.value);
          else params.delete(`m${i}h`);
          
          // Max HP is not stored in URL as it's auto-calculated
          params.delete(`m${i}m`);
        }
        
        const newUrl = params.toString() ? '?' + params.toString() : window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
      
      function createMemberRow(index) {
        const row = document.createElement('div');
        row.className = 'member-row';
        row.innerHTML = `
          <input type="text" class="member-name" id="m${index}n" placeholder="Name">
          <input type="text" class="member-tag" id="m${index}t" placeholder="Tag">
          <input type="text" class="member-traits" id="m${index}r" placeholder="Traits">
          <input type="text" class="member-hp" id="m${index}h" placeholder="HP">
          <input type="text" class="member-maxhp" id="m${index}m" placeholder="6" readonly>
          <button type="button" class="remove-member" onclick="removeMember(${index})">×</button>
        `;
        
        // Add event listeners for URL updates
        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => {
          input.addEventListener('input', updateURL);
        });
        
        return row;
      }
      
      function addMember() {
        console.log('Adding member, current count:', memberCount);
        
        if (memberCount === 0) {
          // Add headers
          const headers = document.createElement('div');
          headers.className = 'member-headers';
          headers.innerHTML = `
            <div class="member-name">Name</div>
            <div class="member-tag">Tag</div>
            <div class="member-traits">Traits</div>
            <div class="member-hp">HP</div>
            <div class="member-maxhp">Max</div>
            <div class="remove-spacer"></div>
          `;
          membersContainer.appendChild(headers);
        }
        
        const row = createMemberRow(memberCount);
        membersContainer.appendChild(row);
        
        // Set initial Max HP value for new member
        const maxHpField = document.getElementById(`m${memberCount}m`);
        if (maxHpField) {
          maxHpField.value = calculateHP();
        }
        
        memberCount++;
        console.log('Member added, new count:', memberCount);
        updateURL();
      }
      
      function removeMember(index) {
        // Remove the specific row
        const row = document.querySelector(`#m${index}n`).closest('.member-row');
        if (row) row.remove();
        
        // Clean up URL params for this member
        const params = new URLSearchParams(window.location.search);
        params.delete(`m${index}n`);
        params.delete(`m${index}t`);
        params.delete(`m${index}r`);
        params.delete(`m${index}h`); // Current HP
        params.delete(`m${index}m`); // Max HP (calculated)
        
        // If no members left, remove headers and reset count
        if (membersContainer.querySelectorAll('.member-row').length === 0) {
          const headers = membersContainer.querySelector('.member-headers');
          if (headers) headers.remove();
          memberCount = 0;
          params.delete('cr_cnt');
        }
        
        const newUrl = params.toString() ? '?' + params.toString() : window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
      
      // Make removeMember globally accessible
      window.removeMember = removeMember;
      
      // Add event listeners (only if not already added)
      if (!addMemberBtn.hasAttribute('data-listener-added')) {
        addMemberBtn.addEventListener('click', addMember);
        addMemberBtn.setAttribute('data-listener-added', 'true');
        console.log('Add member event listener added');
      }
      
      // Add checkbox event listeners for auto-calculation
      const checkboxes = [
        'cr_vet2', // Veteran damage to d8
        'cr_vet3', // Veteran +2 HP
        'cr_her3', // Heroes +4 HP
        'cr_her4'  // Heroes damage increase
      ];
      
      checkboxes.forEach(checkboxId => {
        const checkbox = document.getElementById(checkboxId);
        if (checkbox && !checkbox.hasAttribute('data-calc-listener')) {
          checkbox.addEventListener('change', updateCalculatedFields);
          checkbox.setAttribute('data-calc-listener', 'true');
          console.log('Added calculation listener to', checkboxId);
        }
      });
      
      // Loyalty click handlers with duplicate prevention
      loyaltyShapes.forEach((shape, index) => {
        if (!shape.hasAttribute('data-cr-loyalty-listener')) {
          shape.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            const clickedValue = parseInt(this.dataset.value);
            let newValue;
            
            if (clickedValue <= currentLoyalty) {
              newValue = clickedValue - 1;
            } else {
              newValue = clickedValue;
            }
            
            newValue = Math.max(0, Math.min(newValue, 3));
            currentLoyalty = newValue;
            updateLoyaltyDisplay(newValue);
            updateURL();
          });
          shape.setAttribute('data-cr-loyalty-listener', 'true');
        }
      });
      
      // Load existing members from URL
      for (let i = 0; i < memberCount; i++) {
        if (i === 0) {
          // Add headers
          const headers = document.createElement('div');
          headers.className = 'member-headers';
          headers.innerHTML = `
            <div class="member-name">Name</div>
            <div class="member-tag">Tag</div>
            <div class="member-traits">Traits</div>
            <div class="member-hp">HP</div>
            <div class="member-maxhp">Max</div>
            <div class="remove-spacer"></div>
          `;
          membersContainer.appendChild(headers);
        }
        
        const row = createMemberRow(i);
        membersContainer.appendChild(row);
        
        // Populate values from URL (Max HP is calculated, not loaded)
        const nameVal = urlParams.get(`m${i}n`);
        const tagVal = urlParams.get(`m${i}t`);
        const traitsVal = urlParams.get(`m${i}r`);
        const hpVal = urlParams.get(`m${i}h`);
        
        if (nameVal) document.getElementById(`m${i}n`).value = nameVal;
        if (tagVal) document.getElementById(`m${i}t`).value = tagVal;
        if (traitsVal) document.getElementById(`m${i}r`).value = traitsVal;
        if (hpVal) document.getElementById(`m${i}h`).value = hpVal;
        
        // Set calculated Max HP value
        const maxHpField = document.getElementById(`m${i}m`);
        if (maxHpField) {
          maxHpField.value = calculateHP();
        }
      }
      
      // Initialize loyalty display
      updateLoyaltyDisplay(currentLoyalty);
      
      // Initialize calculated fields (damage and HP)
      updateCalculatedFields();
      
      console.log('Crew initialization complete');
  }
  
  // Create global initialization function that can be called whenever card is recreated
  window.initializeCrew = function() {
    console.log('Initializing Crew card...');
    initializeCrew();
  };
  
  // Multiple initialization attempts for first load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCrew);
  } else {
    initializeCrew();
  }
  
  // Also try after a delay in case cards are loaded dynamically
  setTimeout(initializeCrew, 500);
  setTimeout(initializeCrew, 1000);
})();
