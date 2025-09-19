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
        
        const controlsDiv = document.createElement("div");
        controlsDiv.className = "takefrom-controls";
        
        // Role selector
        const roleLabel = document.createElement("label");
        roleLabel.textContent = "Role: ";
        const roleSelect = document.createElement("select");
        roleSelect.id = `takefrom_${move.id}_role`;
        roleSelect.name = `takefrom_${move.id}_role`;
        
        // Add default option
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select role...";
        roleSelect.appendChild(defaultOption);
        
        // Add role options
        move.takefrom.forEach(role => {
            const option = document.createElement("option");
            option.value = role;
            option.textContent = role;
            roleSelect.appendChild(option);
        });
        
        // Move selector
        const moveLabel = document.createElement("label");
        moveLabel.textContent = "Move: ";
        const moveSelect = document.createElement("select");
        moveSelect.id = `takefrom_${move.id}_move`;
        moveSelect.name = `takefrom_${move.id}_move`;
        moveSelect.disabled = true; // Initially disabled
        
        // Add default option
        const defaultMoveOption = document.createElement("option");
        defaultMoveOption.value = "";
        defaultMoveOption.textContent = "Select move...";
        moveSelect.appendChild(defaultMoveOption);
        
        // Restore values from URL
        if (urlParams.has(`takefrom_${move.id}_role`)) {
            const savedRole = urlParams.get(`takefrom_${move.id}_role`);
            const savedMove = urlParams.get(`takefrom_${move.id}_move`);
            
            roleSelect.value = savedRole;
            updateMoveOptions(roleSelect, moveSelect, move.id);
            
            // Use a delay to ensure options are populated before setting value
            setTimeout(() => {
                if (savedMove) {
                    moveSelect.value = savedMove;
                    
                    // Also update the learned move display after setting the value
                    setTimeout(() => {
                        updateLearnedMoveDisplay(moveSelect, learnedMoveContainer, urlParams);
                    }, 50);
                }
            }, 100);
        }
        
        // Event listener for role change
        roleSelect.addEventListener('change', () => {
            handleRoleChange(roleSelect, moveSelect, move.id);
        });
        
        // Event listener for move selection
        moveSelect.addEventListener('change', () => {
            handleMoveChange(roleSelect, moveSelect, move.id);
        });
        
        roleLabel.appendChild(roleSelect);
        moveLabel.appendChild(moveSelect);
        
        controlsDiv.appendChild(roleLabel);
        controlsDiv.appendChild(moveLabel);
        takeFromDiv.appendChild(controlsDiv);
        
        // Container for the learned move (initially empty)
        const learnedMoveContainer = document.createElement("div");
        learnedMoveContainer.className = "learned-move-container";
        learnedMoveContainer.id = `learned_move_${move.id}`;
        takeFromDiv.appendChild(learnedMoveContainer);
        
        // Show learned move if there's a selection (delay to allow restoration to complete)
        setTimeout(() => {
            updateLearnedMoveDisplay(moveSelect, learnedMoveContainer, urlParams);
        }, 150);
        
        return takeFromDiv;
    }

    /**
     * Handle role dropdown change
     */
    function handleRoleChange(roleSelect, moveSelect, moveId) {
        updateMoveOptions(roleSelect, moveSelect, moveId);
        // Clear move selection when role changes
        moveSelect.value = '';
        
        // Clear the learned move display
        const learnedMoveContainer = document.getElementById(`learned_move_${moveId}`);
        if (learnedMoveContainer) {
            learnedMoveContainer.innerHTML = '';
        }
        
        handleSelectionChangeQuiet(roleSelect, moveSelect, moveId);
        updateURL(roleSelect, moveSelect);
    }

    /**
     * Handle move dropdown change
     */
    function handleMoveChange(roleSelect, moveSelect, moveId) {
        // Update the inline learned move display
        const learnedMoveContainer = document.getElementById(`learned_move_${moveId}`);
        if (learnedMoveContainer) {
            updateLearnedMoveDisplay(moveSelect, learnedMoveContainer, new URLSearchParams(location.search));
        }
        
        // Handle the selection change (but don't re-render the whole page)
        handleSelectionChangeQuiet(roleSelect, moveSelect, moveId);
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
    function updateMoveOptions(roleSelect, moveSelect, moveId) {
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
            
            // Get available moves for selected role and current role
            const availableMoves = window.availableMap[selectedRole];
            const currentRole = window.Utils ? window.Utils.getCurrentRole() : null;
            const currentRoleMoves = currentRole && window.availableMap[currentRole] ? window.availableMap[currentRole] : {};
            
            // Filter moves to only show those available to selected role but NOT to current role
            window.moves.forEach(move => {
                if (move.id !== moveId && 
                    availableMoves.hasOwnProperty(move.id) && 
                    !currentRoleMoves.hasOwnProperty(move.id)) {
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
    function handleSelectionChangeQuiet(roleSelect, moveSelect, takeFromMoveId) {
        const currentRole = window.Utils ? window.Utils.getCurrentRole() : null;
        const selectedMove = moveSelect.value;
        
        // Get previous selection to remove it if changed
        const prevKey = `takefrom_${takeFromMoveId}_move`;
        const urlParams = new URLSearchParams(location.search);
        const previousMove = urlParams.get(prevKey);
        
        // Remove previously learned move if it exists and is different
        if (previousMove && previousMove !== selectedMove && currentRole) {
            if (window.availableMap && window.availableMap[currentRole]) {
                delete window.availableMap[currentRole][previousMove];
            }
        }
        
        // Note: We don't need to modify availableMap - learned moves are self-contained
    }

    /**
     * Handle when the main takefrom move checkbox is toggled
     */
    function handleTakeFromMoveToggle(moveId, isChecked) {
        if (!isChecked) {
            // Check if ANY checkbox for this move is still checked
            const anyStillChecked = checkIfAnyTakeFromMoveChecked(moveId);
            
            if (anyStillChecked) {
                // Some checkboxes are still checked, don't reset
                return;
            }
            
            // ALL checkboxes unchecked - reset dropdowns and hide learned move
            resetTakeFromSelection(moveId);
        } else {
            // Move was checked - restore previous state if it exists in URL
            restoreTakeFromSelection(moveId);
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
        checkIfAnyTakeFromMoveChecked
    };
})();
