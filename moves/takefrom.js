/**
 * TakeFrom Module - Handles learning moves from other roles
 */

window.TakeFrom = (function() {
    'use strict';


    /**
     * Create takefrom section for learning moves from other roles
     */
    function createTakeFromSection(move, urlParams) {
        const takeFromDiv = document.createElement("div");
        takeFromDiv.className = "takefrom-options";
        
        const heading = document.createElement("strong");
        heading.textContent = "Learn from:";
        takeFromDiv.appendChild(heading);
        
        // Support multiple takefrom instances
        const maxInstances = move.multiple || 1;
        const instancesContainer = document.createElement("div");
        instancesContainer.className = "takefrom-instances";
        
        // Create all possible instances (they'll be shown/hidden based on checked boxes)
        for (let instance = 1; instance <= maxInstances; instance++) {
            const instanceDiv = createTakeFromInstance(move, urlParams, instance);
            instancesContainer.appendChild(instanceDiv);
        }
        
        takeFromDiv.appendChild(instancesContainer);
        
        // Container for learned moves from all instances
        const learnedMovesContainer = document.createElement("div");
        learnedMovesContainer.className = "learned-moves-container";
        learnedMovesContainer.id = `learned_moves_${move.id}`;
        takeFromDiv.appendChild(learnedMovesContainer);
        
        return takeFromDiv;
    }
    
    /**
     * Create a single takefrom instance (role + move dropdowns)
     */
    function createTakeFromInstance(move, urlParams, instance) {
        const instanceDiv = document.createElement("div");
        instanceDiv.className = "takefrom-instance";
        instanceDiv.id = `takefrom_instance_${move.id}_${instance}`;
        
        // Initially hide instances > 1
        if (instance > 1) {
            instanceDiv.style.display = 'none';
        }
        
        const controlsDiv = document.createElement("div");
        controlsDiv.className = "takefrom-controls";
        
        // Role selector (with instance number)
        const roleLabel = document.createElement("label");
        roleLabel.textContent = instance > 1 ? `Role ${instance}: ` : "Role: ";
        const roleSelect = document.createElement("select");
        roleSelect.id = instance > 1 ? `takefrom_${move.id}_${instance}_role` : `takefrom_${move.id}_role`;
        roleSelect.name = instance > 1 ? `takefrom_${move.id}_${instance}_role` : `takefrom_${move.id}_role`;
        
        // Add default option
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select role...";
        roleSelect.appendChild(defaultOption);
        
        // Get matching roles using pattern matching (supports wildcards)
        let matchingRoles = [];
        
        if (window.Utils && window.Utils.getMatchingRoles) {
            const allAvailableRoles = window.Utils.getAllAvailableRoles();
            const currentRoles = window.Utils.getCurrentRoles();
            matchingRoles = window.Utils.getMatchingRoles(move.takefrom, allAvailableRoles, currentRoles);
        } else {
            // Fallback to original behavior if Utils not available
            matchingRoles = move.takefrom || [];
        }
        
        // Add role options (sorted and excluding current roles)
        matchingRoles.forEach(role => {
            const option = document.createElement("option");
            option.value = role;
            option.textContent = role;
            roleSelect.appendChild(option);
        });
        
        // Move selector (with instance number)
        const moveLabel = document.createElement("label");
        moveLabel.textContent = instance > 1 ? `Move ${instance}: ` : "Move: ";
        const moveSelect = document.createElement("select");
        moveSelect.id = instance > 1 ? `takefrom_${move.id}_${instance}_move` : `takefrom_${move.id}_move`;
        moveSelect.name = instance > 1 ? `takefrom_${move.id}_${instance}_move` : `takefrom_${move.id}_move`;
        moveSelect.disabled = true; // Initially disabled
        
        // Add default option
        const defaultMoveOption = document.createElement("option");
        defaultMoveOption.value = "";
        defaultMoveOption.textContent = "Select move...";
        moveSelect.appendChild(defaultMoveOption);
        
        // Restore values from URL for this instance
        const roleParamKey = instance > 1 ? `takefrom_${move.id}_${instance}_role` : `takefrom_${move.id}_role`;
        const moveParamKey = instance > 1 ? `takefrom_${move.id}_${instance}_move` : `takefrom_${move.id}_move`;
        
        if (urlParams.has(roleParamKey)) {
            const savedRole = urlParams.get(roleParamKey);
            const savedMove = urlParams.get(moveParamKey);
            
            roleSelect.value = savedRole;
            updateMoveOptions(roleSelect, moveSelect, move.id, instance);
            
            // Use a delay to ensure options are populated before setting value
            setTimeout(() => {
                if (savedMove) {
                    moveSelect.value = savedMove;
                    
                    // Also update the learned move display after setting the value
                    setTimeout(() => {
                        updateAllLearnedMoveDisplays(move.id, urlParams);
                    }, 50);
                }
            }, 100);
        }
        
        // Event listener for role change
        roleSelect.addEventListener('change', () => {
            handleRoleChange(roleSelect, moveSelect, move.id, instance);
        });
        
        // Event listener for move selection
        moveSelect.addEventListener('change', () => {
            handleMoveChange(roleSelect, moveSelect, move.id, instance);
        });
        
        roleLabel.appendChild(roleSelect);
        moveLabel.appendChild(moveSelect);
        
        controlsDiv.appendChild(roleLabel);
        controlsDiv.appendChild(moveLabel);
        instanceDiv.appendChild(controlsDiv);
        
        // Individual learned move container for this instance
        const instanceLearnedContainer = document.createElement("div");
        instanceLearnedContainer.className = "learned-move-container";
        instanceLearnedContainer.id = `learned_move_${move.id}_${instance}`;
        instanceDiv.appendChild(instanceLearnedContainer);
        
        // Show learned move if there's a selection (delay to allow restoration to complete)
        setTimeout(() => {
            updateLearnedMoveDisplay(moveSelect, instanceLearnedContainer, urlParams);
        }, 150);
        
        return instanceDiv;
    }
    
    /**
     * Initialize takefrom sections after page render (called by layout system)
     */
    function initializeTakeFromSections() {
        if (!window.moves) return;
        
        // Find all moves with takefrom and initialize their visibility
        window.moves.forEach(move => {
            if (move.takefrom && move.multiple) {
                // Update instance visibility based on current checkbox states
                updateTakeFromInstanceVisibility(move.id);
            }
        });
        
        // Also update all learned move displays after a brief delay
        setTimeout(() => {
            const urlParams = new URLSearchParams(location.search);
            window.moves.forEach(move => {
                if (move.takefrom) {
                    updateAllLearnedMoveDisplays(move.id, urlParams);
                }
            });
        }, 200);
    }

    /**
     * Handle role dropdown change
     */
    function handleRoleChange(roleSelect, moveSelect, moveId, instance = 1) {
        updateMoveOptions(roleSelect, moveSelect, moveId, instance);
        // Clear move selection when role changes
        moveSelect.value = '';
        
        // Clear the learned move display for this instance
        const learnedMoveContainer = document.getElementById(`learned_move_${moveId}_${instance}`);
        if (learnedMoveContainer) {
            learnedMoveContainer.innerHTML = '';
        }
        
        handleSelectionChangeQuiet(roleSelect, moveSelect, moveId, instance);
        updateURL(roleSelect, moveSelect);
    }

    /**
     * Handle move dropdown change
     */
    function handleMoveChange(roleSelect, moveSelect, moveId, instance = 1) {
        // Update the inline learned move display for this instance
        const learnedMoveContainer = document.getElementById(`learned_move_${moveId}_${instance}`);
        if (learnedMoveContainer) {
            updateLearnedMoveDisplay(moveSelect, learnedMoveContainer, new URLSearchParams(location.search));
        }
        
        // Handle the selection change (but don't re-render the whole page)
        handleSelectionChangeQuiet(roleSelect, moveSelect, moveId, instance);
        updateURL(roleSelect, moveSelect);
    }

    /**
     * Update URL with current selections
     */
    function updateURL(roleSelect, moveSelect) {
        const params = new URLSearchParams(location.search);
        
        if (roleSelect.value) {
            params.set(roleSelect.id, roleSelect.value);
        } else {
            params.delete(roleSelect.id);
        }
        
        if (moveSelect.value) {
            params.set(moveSelect.id, moveSelect.value);
        } else {
            params.delete(moveSelect.id);
        }
        
        const newUrl = params.toString() ? '?' + params.toString() : location.pathname;
        history.replaceState({}, '', newUrl);
    }

    /**
     * Update the learned move display underneath the dropdown
     */
    function updateLearnedMoveDisplay(moveSelect, learnedMoveContainer, urlParams) {
        const selectedMoveId = moveSelect.value;
        
        // Clear previous content
        learnedMoveContainer.innerHTML = '';
        
        if (!selectedMoveId) return;
        
        // Find the selected move data
        const selectedMoveData = window.moves && window.moves.find(m => m.id === selectedMoveId);
        if (!selectedMoveData) return;
        
        // Create a mini version of the move display
        const learnedMoveDiv = document.createElement("div");
        learnedMoveDiv.className = "learned-move";
        
        // Use the centralized renderMove function to avoid code duplication
        if (window.MovesCore) {
            const renderedMove = window.MovesCore.renderMove(selectedMoveData, {[selectedMoveId]: true}, urlParams);
            
            // The renderMove creates a full .move div, but we want the content in our .learned-move div
            // So we copy the children from the rendered move to our learned move container
            while (renderedMove.firstChild) {
                learnedMoveDiv.appendChild(renderedMove.firstChild);
            }
            
            // Replace any granted card sections with learned-specific versions
            const grantedCardSections = learnedMoveDiv.querySelectorAll('.granted-card-options');
            grantedCardSections.forEach(section => {
                if (selectedMoveData.grantsCard) {
                    const learnedCardSection = createLearnedGrantedCardSection(selectedMoveData, urlParams);
                    if (learnedCardSection) {
                        section.parentNode.replaceChild(learnedCardSection, section);
                    }
                }
            });
        }
        
        learnedMoveContainer.appendChild(learnedMoveDiv);
        
        // Refresh persistence to capture any new inputs in the learned move
        setTimeout(() => {
            const form = document.querySelector('form');
            if (form && window.Persistence) {
                window.Persistence.refreshPersistence(form);
            }
        }, 150);
    }

    /**
     * Create granted card section for learned moves
     */
    function createLearnedGrantedCardSection(move, urlParams) {
        if (!move.grantsCard || !window.InlineCards) {
            return null;
        }
        
        const containerId = `learned_granted_card_${move.id}`;
        const cardSection = window.InlineCards.createCardContainer(containerId, "Grants:");
        
        // Show granted card immediately for learned moves (they're always "active")
        setTimeout(async () => {
            await window.InlineCards.displayCard(containerId, move.grantsCard);
            
            // Refresh persistence to capture new card inputs
            setTimeout(() => {
                const form = document.querySelector('form');
                if (form && window.Persistence) {
                    window.Persistence.refreshPersistence(form);
                }
            }, 50);
        }, 100);
        
        return cardSection;
    }
    
    /**
     * Update move options based on selected role
     */
    function updateMoveOptions(roleSelect, moveSelect, moveId, instance = 1) {
        const selectedRole = roleSelect.value;
        const currentValue = moveSelect.value; // Preserve current selection
        
        // Clear existing options except default
        moveSelect.innerHTML = '';
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select move...";
        moveSelect.appendChild(defaultOption);
        
        if (selectedRole && window.availableMap && window.availableMap[selectedRole]) {
            moveSelect.disabled = false;
            
            // Get available moves for selected role and current roles
            const availableMoves = window.availableMap[selectedRole];
            const currentRoles = window.Utils ? window.Utils.getCurrentRoles() : [];
            
            // Get all moves available to current roles (combined)
            const currentRolesMoves = {};
            currentRoles.forEach(role => {
                const roleData = window.availableMap[role];
                if (roleData) {
                    Object.keys(roleData).forEach(key => {
                        if (!key.startsWith('_') && key !== 'cards' && roleData[key] === true) {
                            currentRolesMoves[key] = true;
                        }
                    });
                }
            });
            
            // Filter moves to only show those available to selected role but NOT to current roles
            window.moves.forEach(move => {
                if (move.id !== moveId && 
                    availableMoves.hasOwnProperty(move.id) && 
                    !currentRolesMoves.hasOwnProperty(move.id)) {
                    const option = document.createElement("option");
                    option.value = move.id;
                    option.textContent = move.title;
                    moveSelect.appendChild(option);
                }
            });
            
            // Restore the previously selected value if it's still available
            if (currentValue && moveSelect.querySelector(`option[value="${currentValue}"]`)) {
                moveSelect.value = currentValue;
            }
        } else {
            moveSelect.disabled = true;
        }
    }

    /**
     * Handle takefrom selection changes (quiet version - no re-render)
     */
    function handleSelectionChangeQuiet(roleSelect, moveSelect, takeFromMoveId, instance = 1) {
        const currentRoles = window.Utils ? window.Utils.getCurrentRoles() : [];
        const selectedMove = moveSelect.value;
        
        // Get previous selection to remove it if changed
        const prevKey = instance > 1 ? `takefrom_${takeFromMoveId}_${instance}_move` : `takefrom_${takeFromMoveId}_move`;
        const urlParams = new URLSearchParams(location.search);
        const previousMove = urlParams.get(prevKey);
        
        // Remove previously learned move if it exists and is different
        if (previousMove && previousMove !== selectedMove && currentRoles.length > 0) {
            currentRoles.forEach(role => {
                if (window.availableMap && window.availableMap[role]) {
                    delete window.availableMap[role][previousMove];
                }
            });
        }
        
        // Note: We don't need to modify availableMap - learned moves are self-contained
    }
    
    /**
     * Update all learned move displays for a takefrom move
     */
    function updateAllLearnedMoveDisplays(moveId, urlParams) {
        const move = window.moves?.find(m => m.id === moveId);
        if (!move) return;
        
        const maxInstances = move.multiple || 1;
        
        for (let instance = 1; instance <= maxInstances; instance++) {
            const moveSelectId = instance > 1 ? `takefrom_${moveId}_${instance}_move` : `takefrom_${moveId}_move`;
            const moveSelect = document.getElementById(moveSelectId);
            const learnedContainer = document.getElementById(`learned_move_${moveId}_${instance}`);
            
            if (moveSelect && learnedContainer) {
                updateLearnedMoveDisplay(moveSelect, learnedContainer, urlParams);
            }
        }
    }
    
    /**
     * Update visibility of takefrom instances based on number of checked boxes
     */
    function updateTakeFromInstanceVisibility(moveId) {
        const move = window.moves?.find(m => m.id === moveId);
        if (!move || !move.multiple) return;
        
        // Count checked boxes for this move
        const checkedCount = getCheckedBoxCount(moveId);
        const maxInstances = move.multiple;
        
        // Show/hide instances based on checked count
        for (let instance = 1; instance <= maxInstances; instance++) {
            const instanceDiv = document.getElementById(`takefrom_instance_${moveId}_${instance}`);
            if (instanceDiv) {
                if (instance <= checkedCount) {
                    instanceDiv.style.display = 'block';
                } else {
                    instanceDiv.style.display = 'none';
                    // Clear selections for hidden instances
                    clearInstanceSelections(moveId, instance);
                }
            }
        }
    }
    
    /**
     * Get count of checked boxes for a move
     */
    function getCheckedBoxCount(moveId) {
        let count = 0;
        
        const move = window.moves?.find(m => m.id === moveId);
        if (!move) return 0;
        
        if (move.multiple) {
            // For multiple moves, check move_ID_1, move_ID_2, etc.
            for (let i = 1; i <= move.multiple; i++) {
                const checkbox = document.getElementById(`move_${moveId}_${i}`);
                if (checkbox?.checked) count++;
            }
        } else {
            // For single moves, check move_ID
            const mainCheckbox = document.getElementById(`move_${moveId}`);
            if (mainCheckbox?.checked) count++;
        }
        
        return count;
    }
    
    /**
     * Clear selections for a specific instance
     */
    function clearInstanceSelections(moveId, instance) {
        const roleSelectId = instance > 1 ? `takefrom_${moveId}_${instance}_role` : `takefrom_${moveId}_role`;
        const moveSelectId = instance > 1 ? `takefrom_${moveId}_${instance}_move` : `takefrom_${moveId}_move`;
        
        const roleSelect = document.getElementById(roleSelectId);
        const moveSelect = document.getElementById(moveSelectId);
        const learnedContainer = document.getElementById(`learned_move_${moveId}_${instance}`);
        
        if (roleSelect) roleSelect.value = '';
        if (moveSelect) {
            moveSelect.value = '';
            moveSelect.disabled = true;
        }
        if (learnedContainer) learnedContainer.innerHTML = '';
        
        // Remove from URL parameters
        const params = new URLSearchParams(location.search);
        params.delete(roleSelectId);
        params.delete(moveSelectId);
        const newUrl = params.toString() ? '?' + params.toString() : location.pathname;
        history.replaceState({}, '', newUrl);
    }

    /**
     * Handle when the main takefrom move checkbox is toggled
     */
    function handleTakeFromMoveToggle(moveId, isChecked) {
        if (!isChecked) {
            // Check if ANY checkbox for this move is still checked
            const anyStillChecked = checkIfAnyTakeFromMoveChecked(moveId);
            
            if (anyStillChecked) {
                // Some checkboxes are still checked, update visibility
                updateTakeFromInstanceVisibility(moveId);
                return;
            }
            
            // ALL checkboxes unchecked - reset dropdowns and hide learned move
            resetTakeFromSelection(moveId);
        } else {
            // Move was checked - restore previous state if it exists in URL
            restoreTakeFromSelection(moveId);
            // Update visibility to show appropriate number of instances
            updateTakeFromInstanceVisibility(moveId);
        }
    }

    /**
     * Reset takefrom selection when move is unchecked
     */
    function resetTakeFromSelection(moveId) {
        const roleSelect = document.getElementById(`takefrom_${moveId}_role`);
        const moveSelect = document.getElementById(`takefrom_${moveId}_move`);
        const learnedMoveContainer = document.getElementById(`learned_move_${moveId}`);
        
        if (roleSelect) {
            roleSelect.value = '';
        }
        
        if (moveSelect) {
            const previousMove = moveSelect.value;
            moveSelect.innerHTML = '';
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select move...';
            moveSelect.appendChild(defaultOption);
            moveSelect.disabled = true;
            
            // Learned moves are self-contained - no availableMap cleanup needed
        }
        
        if (learnedMoveContainer) {
            learnedMoveContainer.innerHTML = '';
        }
        
        // Update URL
        const params = new URLSearchParams(location.search);
        if (roleSelect) params.delete(roleSelect.id);
        if (moveSelect) params.delete(moveSelect.id);
        const newUrl = params.toString() ? '?' + params.toString() : location.pathname;
        history.replaceState({}, '', newUrl);
    }

    /**
     * Restore takefrom selection when move is checked
     */
    function restoreTakeFromSelection(moveId) {
        const urlParams = new URLSearchParams(location.search);
        const roleSelect = document.getElementById(`takefrom_${moveId}_role`);
        const moveSelect = document.getElementById(`takefrom_${moveId}_move`);
        const learnedMoveContainer = document.getElementById(`learned_move_${moveId}`);
        
        // Restore role selection
        const savedRole = urlParams.get(`takefrom_${moveId}_role`);
        if (savedRole && roleSelect) {
            roleSelect.value = savedRole;
            
            // Update move options based on restored role
            if (moveSelect) {
                updateMoveOptions(roleSelect, moveSelect, moveId);
                
                // Restore move selection after a delay
                setTimeout(() => {
                    const savedMove = urlParams.get(`takefrom_${moveId}_move`);
                    if (savedMove) {
                        moveSelect.value = savedMove;
                        
                        // Restore learned move display
                        if (learnedMoveContainer) {
                            updateLearnedMoveDisplay(moveSelect, learnedMoveContainer, urlParams);
                            
                            // Refresh persistence after learned move is displayed (with delay for cards to load)
                            setTimeout(() => {
                                const form = document.querySelector('form');
                                if (form && window.Persistence) {
                                    window.Persistence.refreshPersistence(form);
                                }
                            }, 200);
                        }
                    
                        // Learned moves are self-contained - no availableMap modification needed
                    }
                }, 50);
            }
        }
    }



    /**
     * Check if any checkbox for a takefrom move is still checked
     */
    function checkIfAnyTakeFromMoveChecked(moveId) {
        // Use data attribute selector to find all checkboxes/radios for this move
        const moveElements = document.querySelectorAll(`[data-move-id="${moveId}"]:checked`);
        return moveElements.length > 0;
    }

    // Public API
    return {
        createTakeFromSection,
        handleTakeFromMoveToggle,
        updateLearnedMoveDisplay,
        updateMoveOptions,
        checkIfAnyTakeFromMoveChecked,
        updateTakeFromInstanceVisibility,
        updateAllLearnedMoveDisplays,
        initializeTakeFromSections
    };
})();
