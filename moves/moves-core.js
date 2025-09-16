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
        
        // Check if move is initially selected
        const urlGranted = urlParams.get(`move_${move.id}`) === '1';
        // Check multiple checkboxes if this is a multi-checkbox move
        let anyUrlGranted = urlGranted;
        if (!anyUrlGranted) {
            let index = 1;
            while (urlParams.has(`move_${move.id}_${index}`)) {
                if (urlParams.get(`move_${move.id}_${index}`) === '1') {
                    anyUrlGranted = true;
                    break;
                }
                index++;
            }
        }
        
        // Hide the container initially if move is not selected
        if (!anyUrlGranted) {
            cardSection.style.display = 'none';
        }
        
        // Show granted card if move is selected (delay to ensure checkboxes are set up)
        setTimeout(() => {
            if (window.InlineCards) {
                const domGranted = window.InlineCards.isAnyMoveCheckboxChecked(move.id);
                const isGranted = anyUrlGranted || domGranted;
                
                if (isGranted) {
                    window.InlineCards.displayCard(containerId, move.grantsCard);
                } else {
                    // Make sure it's hidden if not granted
                    cardSection.style.display = 'none';
                }
            }
        }, 300);
        
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
        
        const pickList = document.createElement("ul");
        move.pick.forEach((option, index) => {
            const li = document.createElement("li");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = `move_${move.id}_pick_${index + 1}`;
            checkbox.name = `move_${move.id}_pick_${index + 1}`;
            checkbox.setAttribute('aria-label', `Pick ${option}`);
            
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
        return pickDiv;
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
        
        // Add pick options if they exist
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
        
        // Check pick option checkboxes if they exist
        if (move.pick && Array.isArray(move.pick)) {
            for (let i = 1; i <= move.pick.length; i++) {
                if (urlParams.get(`move_${move.id}_pick_${i}`) === '1') {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Group moves by category
     */
    function groupMovesByCategory(moves, available, hideUntaken = false, urlParams = null) {
        const groups = {
            uncategorized: [], // Moves without category go here
            categorized: new Map() // Map of category name to moves
        };
        
        moves.forEach(move => {
            if (available.hasOwnProperty(move.id)) {
                // Skip untaken moves if hideUntaken is true
                if (hideUntaken && urlParams && !isMoveTaken(move, urlParams)) {
                    return;
                }
                
                if (!move.category) {
                    groups.uncategorized.push(move);
                } else {
                    if (!groups.categorized.has(move.category)) {
                        groups.categorized.set(move.category, []);
                    }
                    groups.categorized.get(move.category).push(move);
                }
            }
        });
        
        return groups;
    }

    /**
     * Render all moves for a role
     */
    function renderMovesForRole(role) {
        const movesContainer = document.getElementById("moves");
        if (!movesContainer) return;
        
        movesContainer.innerHTML = "";
        
        if (!role || !window.availableMap || !window.availableMap[role]) {
            return;
        }
        
        const available = window.availableMap[role];
        const urlParams = new URLSearchParams(location.search);
        
        // Check if hiding untaken moves
        const hideUntakenCheckbox = document.getElementById('hide_untaken');
        const hideUntaken = hideUntakenCheckbox && hideUntakenCheckbox.checked;
        
        // Group moves by category
        const groups = groupMovesByCategory(window.moves, available, hideUntaken, urlParams);
        
        // First render uncategorized moves under "Moves" header
        if (groups.uncategorized.length > 0) {
            const movesHeader = createCategoryHeader("Moves");
            movesContainer.appendChild(movesHeader);
            
            groups.uncategorized.forEach(move => {
                const moveElement = renderMove(move, available, urlParams);
                movesContainer.appendChild(moveElement);
            });
        }
        
        // Then render categorized moves with their category headers
        const sortedCategories = Array.from(groups.categorized.keys()).sort();
        sortedCategories.forEach(categoryName => {
            const categoryHeader = createCategoryHeader(categoryName);
            movesContainer.appendChild(categoryHeader);
            
            const categoryMoves = groups.categorized.get(categoryName);
            categoryMoves.forEach(move => {
                const moveElement = renderMove(move, available, urlParams);
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
        createCategoryHeader,
        groupMovesByCategory,
        isMoveTaken,
        renderMove,
        renderMovesForRole
    };
})();
