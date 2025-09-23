/**
 * Core Moves Module - Basic move rendering functionality
 */

window.MovesCore = (function() {
    'use strict';

    /**
     * Create move checkboxes (single or multiple)
     */
    function createMoveCheckboxes(move, available, urlParams) {
        const checkboxCount = move.multiple || 1;
        const checkboxes = [];
        
        for (let i = 0; i < checkboxCount; i++) {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            
            // Add data attribute to identify the parent move
            checkbox.setAttribute('data-move-id', move.id);
            
            if (checkboxCount === 1) {
                // Single checkbox - use original ID format
                checkbox.id = `move_${move.id}`;
                checkbox.name = `move_${move.id}`;
                checkbox.setAttribute('aria-label', `Toggle ${move.title}`);
            } else {
                // Multiple checkboxes - add instance number
                checkbox.id = `move_${move.id}_${i + 1}`;
                checkbox.name = `move_${move.id}_${i + 1}`;
                checkbox.setAttribute('aria-label', `${move.title} - Instance ${i + 1}`);
            }
            
            // Check if there's a saved state in URL first
            if (urlParams.has(checkbox.id)) {
                checkbox.checked = urlParams.get(checkbox.id) === '1';
            } else {
                // For multiple checkboxes, only check the first one if default is true
                checkbox.checked = (i === 0 && available[move.id]) || false;
            }
            
            // Disable the first checkbox if the move is always available (true in availability map)
            if (i === 0 && available[move.id] === true) {
                checkbox.disabled = true;
                checkbox.checked = true; // Always ensure disabled checkboxes are checked
                checkbox.setAttribute('title', 'This move is always available for this role');
            }
            
            checkboxes.push(checkbox);
        }
        
        return checkboxes;
    }

    /**
     * Create move title with checkboxes
     */
    function createMoveTitle(move, checkboxes) {
        const titleContainer = document.createElement("div");
        titleContainer.className = "move-title";
        
        if (checkboxes.length === 1) {
            // Single checkbox - use label as before
            const label = document.createElement("label");
            label.setAttribute('for', checkboxes[0].id);
            label.appendChild(checkboxes[0]);
            label.appendChild(document.createTextNode(move.title));
            titleContainer.appendChild(label);
        } else {
            // Multiple checkboxes - put checkboxes inline before title
            const checkboxContainer = document.createElement("div");
            checkboxContainer.className = "move-checkboxes";
            
            checkboxes.forEach((checkbox, index) => {
                checkboxContainer.appendChild(checkbox);
            });
            
            const titleText = document.createElement("span");
            titleText.className = "move-title-text";
            titleText.textContent = move.title;
            
            titleContainer.appendChild(checkboxContainer);
            titleContainer.appendChild(titleText);
        }
        
        return titleContainer;
    }

    /**
     * Create description display
     */
    function createDescription(move) {
        if (!move.description || move.description.trim() === "") {
            return null;
        }
        
        const descriptionDiv = document.createElement("div");
        descriptionDiv.className = "move-description";
        
        const p = document.createElement("p");
        p.textContent = move.description;
        descriptionDiv.appendChild(p);
        
        return descriptionDiv;
    }

    /**
     * Create outcome display
     */
    function createOutcome(outcome) {
        const outcomeDiv = document.createElement("div");
        outcomeDiv.className = "outcome";

        const p = document.createElement("p");
        if (outcome.range && outcome.range.trim() !== "") {
            p.innerHTML = `<strong>${outcome.range}:</strong> ${outcome.text}`;
        } else {
            p.innerHTML = outcome.text;
        }
        outcomeDiv.appendChild(p);

        if (outcome.bullets && outcome.bullets.length) {
            const ul = document.createElement("ul");
            outcome.bullets.forEach(bulletText => {
                const li = document.createElement("li");
                li.textContent = bulletText;
                ul.appendChild(li);
            });
            outcomeDiv.appendChild(ul);
        }

        return outcomeDiv;
    }

    /**
     * Create granted card section
     */
    function createGrantedCardSection(move, urlParams) {
        if (!move.grantsCard || !window.InlineCards) {
            return null;
        }
        
        const containerId = `granted_card_${move.id}`;
        const cardSection = window.InlineCards.createCardContainer(containerId, "Grants:");
        
        // Use the existing isMoveTaken function to check if move is selected
        const isTaken = isMoveTaken(move, urlParams);
        
        if (isTaken) {
            // Show the card immediately if taken
            window.InlineCards.displayCard(containerId, move.grantsCard);
        } else {
            // Hide initially
            cardSection.style.display = 'none';
        }
        
        return cardSection;
    }

    /**
     * Create pick options section
     */
    function createPickOptions(move, urlParams) {
        const pickDiv = document.createElement("div");
        pickDiv.className = "pick-options";
        
        const pickTitle = document.createElement("strong");
        pickTitle.textContent = "Pick:";
        pickDiv.appendChild(pickTitle);
        
        const multiplePick = move.multiplePick || 1;
        
        if (multiplePick > 1) {
            // Create list with multiple checkboxes per option (like multiple moves)
            const pickList = document.createElement("ul");
            
            move.pick.forEach((option, optionIndex) => {
                const li = document.createElement("li");
                li.className = "pick-option-item";
                
                // Create multiple checkboxes for this option
                const checkboxContainer = document.createElement("div");
                checkboxContainer.className = "pick-checkboxes";
                
                for (let col = 1; col <= multiplePick; col++) {
                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    
                    // ID format: first column uses _p1, _p2, etc. Additional columns use _p1_c2, _p1_c3, etc.
                    const baseId = `move_${move.id}_p${optionIndex + 1}`;
                    checkbox.id = col === 1 ? baseId : `${baseId}_c${col}`;
                    checkbox.name = checkbox.id;
                    checkbox.setAttribute('aria-label', `Pick ${option} (Instance ${col})`);
                    checkbox.setAttribute('data-move-id', move.id);
                    
                    // Restore from URL if exists
                    if (urlParams.has(checkbox.id)) {
                        checkbox.checked = urlParams.get(checkbox.id) === '1';
                    }
                    
                    checkboxContainer.appendChild(checkbox);
                }
                
                // Add the option text after all checkboxes
                const optionText = document.createElement("span");
                optionText.className = "pick-option-text";
                optionText.textContent = option;
                
                li.appendChild(checkboxContainer);
                li.appendChild(optionText);
                pickList.appendChild(li);
            });
            
            pickDiv.appendChild(pickList);
        } else {
            // Single column layout (original behavior)
            const pickList = document.createElement("ul");
            move.pick.forEach((option, index) => {
                const li = document.createElement("li");
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                
                checkbox.id = `move_${move.id}_p${index + 1}`;
                checkbox.name = `move_${move.id}_p${index + 1}`;
                checkbox.setAttribute('aria-label', `Pick ${option}`);
                checkbox.setAttribute('data-move-id', move.id);
                
                // Restore from URL if exists
                if (urlParams.has(checkbox.id)) {
                    checkbox.checked = urlParams.get(checkbox.id) === '1';
                }
                
                const label = document.createElement("label");
                label.setAttribute('for', checkbox.id);
                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(option));
                
                li.appendChild(label);
                pickList.appendChild(li);
            });
            
            pickDiv.appendChild(pickList);
        }
        
        return pickDiv;
    }

    /**
     * Create pickOne options section (radio buttons)
     */
    function createPickOneOptions(move, urlParams) {
        const pickOneDiv = document.createElement("div");
        pickOneDiv.className = "pick-one-options";
        
        const pickOneTitle = document.createElement("strong");
        pickOneTitle.textContent = "Pick One:";
        pickOneDiv.appendChild(pickOneTitle);
        
        const multiplePick = move.multiplePick || 1;
        
        if (multiplePick > 1) {
            // Create list with multiple radio buttons per option (like multiple moves)
            const pickOneList = document.createElement("ul");
            
            move.pickOne.forEach((option, optionIndex) => {
                const li = document.createElement("li");
                li.className = "pick-one-option-item";
                
                // Create multiple radio buttons for this option
                const radioContainer = document.createElement("div");
                radioContainer.className = "pick-one-radios";
                
                for (let col = 1; col <= multiplePick; col++) {
                    const radio = document.createElement("input");
                    radio.type = "radio";
                    
                    // Each column gets its own radio group
                    radio.name = col === 1 ? `move_${move.id}_pickone` : `move_${move.id}_pickone_c${col}`;
                    
                    // ID format: first column uses _o1, _o2, etc. Additional columns use _o1_c2, _o1_c3, etc.
                    const baseId = `move_${move.id}_o${optionIndex + 1}`;
                    radio.id = col === 1 ? baseId : `${baseId}_c${col}`;
                    radio.value = `${optionIndex + 1}`;
                    radio.setAttribute('aria-label', `Pick one: ${option} (Instance ${col})`);
                    radio.setAttribute('data-move-id', move.id);
                    
                    // Restore from URL if exists
                    if (urlParams.has(radio.id)) {
                        radio.checked = urlParams.get(radio.id) === '1';
                    }
                    
                    radioContainer.appendChild(radio);
                }
                
                // Add the option text after all radio buttons
                const optionText = document.createElement("span");
                optionText.className = "pick-one-option-text";
                optionText.textContent = option;
                
                li.appendChild(radioContainer);
                li.appendChild(optionText);
                pickOneList.appendChild(li);
            });
            
            pickOneDiv.appendChild(pickOneList);
        } else {
            // Single column layout (original behavior)
            const pickOneList = document.createElement("ul");
            const radioGroupName = `move_${move.id}_pickone`;
            
            move.pickOne.forEach((option, index) => {
                const li = document.createElement("li");
                const radio = document.createElement("input");
                radio.type = "radio";
                radio.name = radioGroupName;
                
                radio.id = `move_${move.id}_o${index + 1}`;
                radio.value = `${index + 1}`;
                radio.setAttribute('aria-label', `Pick one: ${option}`);
                radio.setAttribute('data-move-id', move.id);
                
                // Restore from URL if exists
                if (urlParams.has(radio.id)) {
                    radio.checked = urlParams.get(radio.id) === '1';
                }
                
                const label = document.createElement("label");
                label.setAttribute('for', radio.id);
                label.appendChild(radio);
                label.appendChild(document.createTextNode(option));
                
                li.appendChild(label);
                pickOneList.appendChild(li);
            });
            
            pickOneDiv.appendChild(pickOneList);
        }
        
        return pickOneDiv;
    }

    /**
     * Render a single move
     */
    function renderMove(move, available, urlParams) {
        const moveDiv = document.createElement("div");
        moveDiv.className = "move";
        
        // Create checkboxes and title
        const checkboxes = createMoveCheckboxes(move, available, urlParams);
        const titleContainer = createMoveTitle(move, checkboxes);
        moveDiv.appendChild(titleContainer);
        
        // Add description if it exists
        const descriptionElement = createDescription(move);
        if (descriptionElement) {
            moveDiv.appendChild(descriptionElement);
        }
        
        // Add outcomes if they exist
        if (move.outcomes && Array.isArray(move.outcomes) && move.outcomes.length > 0) {
            move.outcomes.forEach(outcome => {
                if (outcome) {
                    const outcomeElement = createOutcome(outcome);
                    moveDiv.appendChild(outcomeElement);
                }
            });
        }
        
        // Add pickOne options if they exist (render first as they're typically more fundamental)
        if (move.pickOne && Array.isArray(move.pickOne) && move.pickOne.length > 0) {
            const pickOneElement = createPickOneOptions(move, urlParams);
            moveDiv.appendChild(pickOneElement);
        }
        
        // Add pick options if they exist (render after pickOne as they're typically add-on features)
        if (move.pick && Array.isArray(move.pick) && move.pick.length > 0) {
            const pickElement = createPickOptions(move, urlParams);
            moveDiv.appendChild(pickElement);
        }
        
        // Add takefrom section if it exists
        if (move.takefrom && Array.isArray(move.takefrom) && move.takefrom.length > 0) {
            if (window.TakeFrom) {
                const takeFromSection = window.TakeFrom.createTakeFromSection(move, urlParams);
                moveDiv.appendChild(takeFromSection);
            }
        }
        
        // Add granted card section if move grants a card
        if (move.grantsCard) {
            const grantedCardSection = createGrantedCardSection(move, urlParams);
            if (grantedCardSection) {
                moveDiv.appendChild(grantedCardSection);
            }
        }
        
        return moveDiv;
    }

    /**
     * Create category header element
     */
    function createCategoryHeader(categoryName) {
        const headerElement = document.createElement("h3");
        headerElement.className = "category-header";
        headerElement.textContent = categoryName;
        return headerElement;
    }

    /**
     * Check if a move is "taken" based on URL parameters
     */
    function isMoveTaken(move, urlParams) {
        // Check main move checkboxes
        const moveCheckboxId = `move_${move.id}`;
        if (urlParams.get(moveCheckboxId) === '1') {
            return true;
        }
        
        // Check multiple move checkboxes if they exist
        if (move.multiple) {
            for (let i = 1; i <= move.multiple; i++) {
                if (urlParams.get(`move_${move.id}_${i}`) === '1') {
                    return true;
                }
            }
        }
        
        // Check pick option checkboxes if they exist (_p1, _p2, etc. and _p1_c2, _p1_c3, etc.)
        if (move.pick && Array.isArray(move.pick)) {
            const multiplePick = move.multiplePick || 1;
            for (let i = 1; i <= move.pick.length; i++) {
                // Check first column
                if (urlParams.get(`move_${move.id}_p${i}`) === '1') {
                    return true;
                }
                // Check additional columns if multiplePick > 1
                for (let col = 2; col <= multiplePick; col++) {
                    if (urlParams.get(`move_${move.id}_p${i}_c${col}`) === '1') {
                        return true;
                    }
                }
            }
        }
        
        // Check pickOne option radio buttons if they exist (_o1, _o2, etc. and _o1_c2, _o1_c3, etc.)
        if (move.pickOne && Array.isArray(move.pickOne)) {
            const multiplePick = move.multiplePick || 1;
            for (let i = 1; i <= move.pickOne.length; i++) {
                // Check first column
                if (urlParams.get(`move_${move.id}_o${i}`) === '1') {
                    return true;
                }
                // Check additional columns if multiplePick > 1
                for (let col = 2; col <= multiplePick; col++) {
                    if (urlParams.get(`move_${move.id}_o${i}_c${col}`) === '1') {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    /**
     * Sort categories according to global configuration
     * @param {Array<string>} categories - Array of category names to sort
     * @returns {Array<string>} Sorted array of category names
     */
    function sortCategories(categories) {
        // Get the global category order if available
        const categoryOrder = window.categoriesConfig?.order || [];
        
        if (categoryOrder.length === 0) {
            // No category order defined, fall back to alphabetical sorting
            return categories.sort();
        }
        
        // Create a map of category name to its position in the order
        const orderMap = new Map();
        categoryOrder.forEach((category, index) => {
            orderMap.set(category, index);
        });
        
        // Sort categories using the order map, with undefined positions at the end
        return categories.sort((a, b) => {
            const posA = orderMap.get(a);
            const posB = orderMap.get(b);
            
            // If both are in the order list, sort by position
            if (posA !== undefined && posB !== undefined) {
                return posA - posB;
            }
            
            // If only A is in the order list, A comes first
            if (posA !== undefined && posB === undefined) {
                return -1;
            }
            
            // If only B is in the order list, B comes first
            if (posA === undefined && posB !== undefined) {
                return 1;
            }
            
            // If neither is in the order list, sort alphabetically
            return a.localeCompare(b);
        });
    }

    /**
     * Group moves by category
     */
    function groupMovesByCategory(moves, available, hideUntaken = false, urlParams = null) {
        console.log('groupMovesByCategory called with:');
        console.log('- Total moves:', moves.length);
        console.log('- Available moves:', Object.keys(available));
        console.log('- Looking for move "is":', moves.find(m => m.id === 'is'));
        console.log('- "is" in available:', available.hasOwnProperty('is'), available['is']);
        
        const categorized = new Map(); // Map of category name to moves
        
        moves.forEach(move => {
            if (available.hasOwnProperty(move.id)) {
                // Skip untaken moves if hideUntaken is true
                if (hideUntaken && urlParams && !isMoveTaken(move, urlParams)) {
                    return;
                }
                
                // All moves should have a category by now (normalized to "Moves" if empty)
                const category = move.category || "Moves";
                if (!categorized.has(category)) {
                    categorized.set(category, []);
                }
                categorized.get(category).push(move);
            }
        });
        
        return categorized;
    }


    /**
     * Render all moves for roles with merged availability
     */
    function renderMovesForRole(roles, mergedAvailability) {
        const movesContainer = document.getElementById("moves");
        if (!movesContainer) return;
        
        movesContainer.innerHTML = "";
        
        if (!roles || roles.length === 0 || !mergedAvailability) {
            return;
        }
        
        const urlParams = new URLSearchParams(location.search);
        
        // Check if hiding untaken moves
        const hideUntakenCheckbox = document.getElementById('hide_untaken');
        const hideUntaken = hideUntakenCheckbox && hideUntakenCheckbox.checked;
        
        // Group moves by category using merged availability
        const categorized = groupMovesByCategory(window.moves, mergedAvailability, hideUntaken, urlParams);
        
        // Add role information to the header
        if (roles.length > 1) {
            const rolesHeader = document.createElement("h2");
            rolesHeader.className = "roles-header";
            rolesHeader.textContent = `Roles: ${roles.join(', ')}`;
            movesContainer.appendChild(rolesHeader);
        }
        
        // Sort categories according to configuration
        const sortedCategories = sortCategories(Array.from(categorized.keys()));
        
        // Render categories in sorted order
        sortedCategories.forEach(categoryName => {
            const categoryHeader = createCategoryHeader(categoryName);
            movesContainer.appendChild(categoryHeader);
            
            const categoryMoves = categorized.get(categoryName);
            categoryMoves.forEach(move => {
                const moveElement = renderMove(move, mergedAvailability, urlParams);
                movesContainer.appendChild(moveElement);
            });
        });
    }

    // Public API
    return {
        createMoveCheckboxes,
        createMoveTitle,
        createDescription,
        createOutcome,
        createPickOptions,
        createPickOneOptions,
        createCategoryHeader,
        sortCategories,
        groupMovesByCategory,
        isMoveTaken,
        renderMove,
        renderMovesForRole
    };
})();
