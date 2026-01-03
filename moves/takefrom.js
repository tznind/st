/**
 * TakeFrom Module - Handles learning moves from other roles
 */

window.TakeFrom = (function() {
    'use strict';

    /**
     * Deep clone and suffix all IDs in a move for duplicate support
     * @param {Object} move - The move to clone
     * @param {string} suffix - The suffix to append to IDs
     * @returns {Object} - Cloned move with suffixed IDs
     */
    function cloneAndSuffixMove(move, suffix) {
        // Deep clone the move object
        const clonedMove = JSON.parse(JSON.stringify(move));

        // Suffix the main move ID
        const originalId = clonedMove.id;
        clonedMove.id = `${originalId}_${suffix}`;

        // DON'T suffix grantsCard - it should point to the actual card definition file
        // The card system will use the suffixed move.id for unique container IDs
        // (e.g., learned_granted_card_ac001_1, learned_granted_card_ac001_2)
        // This allows multiple instances of the same card type, each with unique inputs

        // Note: tracks use the move ID in their persistence keys
        // The track names themselves are display labels and don't need suffixing
        // The persistence system will use the suffixed move.id automatically

        // Note: submoves don't have their own IDs - they're part of the parent move
        // so no suffixing needed there

        // Store the original ID for reference/debugging
        clonedMove._originalId = originalId;
        clonedMove._suffix = suffix;

        return clonedMove;
    }

    /**
     * Create takeFrom section for learning moves from other roles
     */
    function createTakeFromSection(move, urlParams) {
        const takeFromDiv = document.createElement("div");
        takeFromDiv.className = "takeFrom-options";
        
        // Support multiple takeFrom instances
        const maxInstances = move.multiple || 1;
        const instancesContainer = document.createElement("div");
        instancesContainer.className = "takeFrom-instances";
        
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
     * Create a single takeFrom instance (role + move dropdowns)
     */
    function createTakeFromInstance(move, urlParams, instance) {
        const instanceDiv = document.createElement("div");
        instanceDiv.className = "takeFrom-instance";
        instanceDiv.id = `takeFrom_instance_${move.id}_${instance}`;
        
        // Initially hide instances > 1
        if (instance > 1) {
            instanceDiv.style.display = 'none';
        }
        
        const controlsDiv = document.createElement("div");
        controlsDiv.className = "takeFrom-controls";
        
        // Role selector (with instance number)
        const roleLabel = document.createElement("label");
        roleLabel.textContent = instance > 1 ? `Role ${instance}: ` : "Role: ";
        const roleSelect = document.createElement("select");
        roleSelect.id = instance > 1 ? `takeFrom_${move.id}_${instance}_role` : `takeFrom_${move.id}_role`;
        roleSelect.name = instance > 1 ? `takeFrom_${move.id}_${instance}_role` : `takeFrom_${move.id}_role`;
        
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
            matchingRoles = window.Utils.getMatchingRoles(move.takeFrom, allAvailableRoles, currentRoles);
        } else {
            // Fallback to original behavior if Utils not available
            matchingRoles = move.takeFrom || [];
        }
        
        // Add role options (sorted and excluding current roles)
        matchingRoles.forEach(role => {
            const option = document.createElement("option");
            option.value = role;
            // Use 'name' field if present, otherwise use role key (backwards compatible)
            option.textContent = window.availableMap[role]?.name || role;
            roleSelect.appendChild(option);
        });
        
        // Move selector (with instance number)
        const moveLabel = document.createElement("label");
        moveLabel.textContent = instance > 1 ? `Move ${instance}: ` : "Move: ";
        const moveSelect = document.createElement("select");
        moveSelect.id = instance > 1 ? `takeFrom_${move.id}_${instance}_move` : `takeFrom_${move.id}_move`;
        moveSelect.name = instance > 1 ? `takeFrom_${move.id}_${instance}_move` : `takeFrom_${move.id}_move`;
        moveSelect.disabled = true; // Initially disabled
        
        // Add default option
        const defaultMoveOption = document.createElement("option");
        defaultMoveOption.value = "";
        defaultMoveOption.textContent = "Select move...";
        moveSelect.appendChild(defaultMoveOption);
        
        // Restore values from URL for this instance
        const roleParamKey = instance > 1 ? `takeFrom_${move.id}_${instance}_role` : `takeFrom_${move.id}_role`;
        const moveParamKey = instance > 1 ? `takeFrom_${move.id}_${instance}_move` : `takeFrom_${move.id}_move`;
        
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
     * Initialize takeFrom sections after page render (called by layout system)
     */
    function initializeTakeFromSections() {
        if (!window.moves) return;
        
        // Find all moves with takeFrom and initialize their visibility
        window.moves.forEach(move => {
            if (move.takeFrom && move.multiple) {
                // Update instance visibility based on current checkbox states
                updateTakeFromInstanceVisibility(move.id);
            }
        });
        
        // Also update all learned move displays after a brief delay
        setTimeout(() => {
            const urlParams = new URLSearchParams(location.search);
            window.moves.forEach(move => {
                if (move.takeFrom) {
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
        let selectedMoveData = window.moves && window.moves.find(m => m.id === selectedMoveId);
        if (!selectedMoveData) return;

        // Extract source move ID and instance from the moveSelect ID
        // Format: takeFrom_{sourceMoveId}_move or takeFrom_{sourceMoveId}_{instance}_move
        const moveSelectIdParts = moveSelect.id.split('_');
        const sourceMoveId = moveSelectIdParts[1]; // The ID of the move with takeFrom property
        const instance = moveSelectIdParts.length > 3 ? moveSelectIdParts[2] : '1';

        // Get the source move to check for takeFromAllowsDuplicates
        const sourceMove = window.moves && window.moves.find(m => m.id === sourceMoveId);
        const allowDuplicates = sourceMove && sourceMove.takeFromAllowsDuplicates === true;

        // If duplicates are allowed, clone and suffix the move
        if (allowDuplicates) {
            selectedMoveData = cloneAndSuffixMove(selectedMoveData, instance);
        }

        // Create a mini version of the move display
        const learnedMoveDiv = document.createElement("div");
        learnedMoveDiv.className = "learned-move";

        // Use the centralized renderMove function to avoid code duplication
        if (window.MovesCore) {
            const effectiveMoveId = selectedMoveData.id; // Use potentially suffixed ID
            const renderedMove = window.MovesCore.renderMove(selectedMoveData, {[effectiveMoveId]: true}, urlParams);

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

            // Get the source move to check for takeCategory filter and allowDuplicates
            const sourceMove = window.moves && window.moves.find(m => m.id === moveId);
            const takeCategoryFilter = sourceMove && sourceMove.takeCategory ? sourceMove.takeCategory : null;
            const allowDuplicates = sourceMove && sourceMove.takeFromAllowsDuplicates === true;

            // Get available moves for selected role and current roles
            const availableMoves = window.availableMap[selectedRole];
            const currentRoles = window.Utils ? window.Utils.getCurrentRoles() : [];

            // Get all moves available to current roles (combined)
            // Only needed if we're NOT allowing duplicates
            const currentRolesMoves = {};
            if (!allowDuplicates) {
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
            }

            // Filter moves based on availability and settings
            window.moves.forEach(move => {
                // Always exclude the source move itself
                if (move.id === moveId) {
                    return;
                }

                // Move must be available to the selected role
                if (!availableMoves.hasOwnProperty(move.id)) {
                    return;
                }

                // If NOT allowing duplicates, exclude moves already possessed by current roles
                if (!allowDuplicates && currentRolesMoves.hasOwnProperty(move.id)) {
                    return;
                }

                // Apply category filtering if takeCategory is specified
                if (takeCategoryFilter && Array.isArray(takeCategoryFilter) && takeCategoryFilter.length > 0) {
                    // Get the move's category (default to "Moves" if not specified)
                    const moveCategory = move.category || "Moves";

                    // Check if this move's category is in the allowed categories
                    if (!takeCategoryFilter.includes(moveCategory)) {
                        return; // Skip this move as it's not in the allowed categories
                    }
                }

                // This move passed all filters - add it to the dropdown
                const option = document.createElement("option");
                option.value = move.id;
                // Options don't support HTML, so strip formatting for dropdowns
                option.textContent = move.title;
                moveSelect.appendChild(option);
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
     * Handle takeFrom selection changes (quiet version - no re-render)
     */
    function handleSelectionChangeQuiet(roleSelect, moveSelect, takeFromMoveId, instance = 1) {
        const currentRoles = window.Utils ? window.Utils.getCurrentRoles() : [];
        const selectedMove = moveSelect.value;
        
        // Get previous selection to remove it if changed
        const prevKey = instance > 1 ? `takeFrom_${takeFromMoveId}_${instance}_move` : `takeFrom_${takeFromMoveId}_move`;
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
     * Update all learned move displays for a takeFrom move
     */
    function updateAllLearnedMoveDisplays(moveId, urlParams) {
        const move = window.moves?.find(m => m.id === moveId);
        if (!move) return;
        
        const maxInstances = move.multiple || 1;
        
        for (let instance = 1; instance <= maxInstances; instance++) {
            const moveSelectId = instance > 1 ? `takeFrom_${moveId}_${instance}_move` : `takeFrom_${moveId}_move`;
            const moveSelect = document.getElementById(moveSelectId);
            const learnedContainer = document.getElementById(`learned_move_${moveId}_${instance}`);
            
            if (moveSelect && learnedContainer) {
                updateLearnedMoveDisplay(moveSelect, learnedContainer, urlParams);
            }
        }
    }
    
    /**
     * Update visibility of takeFrom instances based on number of checked boxes
     */
    function updateTakeFromInstanceVisibility(moveId) {
        const move = window.moves?.find(m => m.id === moveId);
        if (!move || !move.multiple) {
            console.log(`updateTakeFromInstanceVisibility: Move '${moveId}' not found or not multiple (multiple: ${move?.multiple})`);
            return;
        }
        
        console.log(`updateTakeFromInstanceVisibility: Processing move '${moveId}'`);
        
        // Count checked boxes for this move
        const checkedCount = getCheckedBoxCount(moveId);
        const maxInstances = move.multiple;
        
        console.log(`updateTakeFromInstanceVisibility: checkedCount: ${checkedCount}, maxInstances: ${maxInstances}`);
        
        // Show/hide instances based on checked count
        for (let instance = 1; instance <= maxInstances; instance++) {
            const instanceDivId = `takeFrom_instance_${moveId}_${instance}`;
            const instanceDiv = document.getElementById(instanceDivId);
            console.log(`updateTakeFromInstanceVisibility: Instance ${instance}, div '${instanceDivId}', found: ${!!instanceDiv}`);
            
            if (instanceDiv) {
                if (instance <= checkedCount) {
                    console.log(`updateTakeFromInstanceVisibility: Showing instance ${instance}`);
                    instanceDiv.style.display = 'block';
                } else {
                    console.log(`updateTakeFromInstanceVisibility: Hiding instance ${instance}`);
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
        if (!move) {
            console.log(`getCheckedBoxCount: Move '${moveId}' not found`);
            return 0;
        }
        
        console.log(`getCheckedBoxCount: Checking move '${moveId}', multiple: ${move.multiple}`);
        
        if (move.multiple) {
            // For multiple moves, check move_ID_1, move_ID_2, etc.
            for (let i = 1; i <= move.multiple; i++) {
                const checkboxId = `move_${moveId}_${i}`;
                const checkbox = document.getElementById(checkboxId);
                console.log(`getCheckedBoxCount: Checking checkbox '${checkboxId}', found: ${!!checkbox}, checked: ${checkbox?.checked}`);
                if (checkbox?.checked) count++;
            }
        } else {
            // For single moves, check move_ID
            const checkboxId = `move_${moveId}`;
            const mainCheckbox = document.getElementById(checkboxId);
            console.log(`getCheckedBoxCount: Checking checkbox '${checkboxId}', found: ${!!mainCheckbox}, checked: ${mainCheckbox?.checked}`);
            if (mainCheckbox?.checked) count++;
        }
        
        console.log(`getCheckedBoxCount: Final count for '${moveId}': ${count}`);
        return count;
    }
    
    /**
     * Clear selections for a specific instance
     */
    function clearInstanceSelections(moveId, instance) {
        const roleSelectId = instance > 1 ? `takeFrom_${moveId}_${instance}_role` : `takeFrom_${moveId}_role`;
        const moveSelectId = instance > 1 ? `takeFrom_${moveId}_${instance}_move` : `takeFrom_${moveId}_move`;
        
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
     * Handle when the main takeFrom move checkbox is toggled
     */
    function handleTakeFromMoveToggle(moveId, isChecked) {
        console.log(`handleTakeFromMoveToggle: moveId='${moveId}', isChecked=${isChecked}`);
        
        if (!isChecked) {
            // Check if ANY checkbox for this move is still checked
            const anyStillChecked = checkIfAnyTakeFromMoveChecked(moveId);
            console.log(`handleTakeFromMoveToggle: Unchecked, anyStillChecked=${anyStillChecked}`);
            
            if (anyStillChecked) {
                // Some checkboxes are still checked, update visibility
                console.log(`handleTakeFromMoveToggle: Some checkboxes still checked, updating visibility`);
                updateTakeFromInstanceVisibility(moveId);
                return;
            }
            
            // ALL checkboxes unchecked - reset dropdowns and hide learned move
            console.log(`handleTakeFromMoveToggle: All checkboxes unchecked, resetting`);
            resetTakeFromSelection(moveId);
            // Also update visibility to hide all instances for multiple moves
            updateTakeFromInstanceVisibility(moveId);
        } else {
            console.log(`handleTakeFromMoveToggle: Move was checked, restoring and updating visibility`);
            // Move was checked - restore previous state if it exists in URL
            restoreTakeFromSelection(moveId);
            // Update visibility to show appropriate number of instances
            updateTakeFromInstanceVisibility(moveId);
        }
    }

    /**
     * Reset takeFrom selection when move is unchecked
     */
    function resetTakeFromSelection(moveId) {
        const move = window.moves?.find(m => m.id === moveId);
        const maxInstances = move?.multiple || 1;
        
        // Clear all instances for multiple moves
        for (let instance = 1; instance <= maxInstances; instance++) {
            clearInstanceSelections(moveId, instance);
        }
        
        // Also clear the learned moves container
        const learnedMoveContainer = document.getElementById(`learned_move_${moveId}`);
        if (learnedMoveContainer) {
            learnedMoveContainer.innerHTML = '';
        }
    }

    /**
     * Restore takeFrom selection when move is checked
     */
    function restoreTakeFromSelection(moveId) {
        const urlParams = new URLSearchParams(location.search);
        const roleSelect = document.getElementById(`takeFrom_${moveId}_role`);
        const moveSelect = document.getElementById(`takeFrom_${moveId}_move`);
        const learnedMoveContainer = document.getElementById(`learned_move_${moveId}`);
        
        // Restore role selection
        const savedRole = urlParams.get(`takeFrom_${moveId}_role`);
        if (savedRole && roleSelect) {
            roleSelect.value = savedRole;
            
            // Update move options based on restored role
            if (moveSelect) {
                updateMoveOptions(roleSelect, moveSelect, moveId);
                
                // Restore move selection after a delay
                setTimeout(() => {
                    const savedMove = urlParams.get(`takeFrom_${moveId}_move`);
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
     * Check if any checkbox for a takeFrom move is still checked
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
