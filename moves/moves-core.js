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
        
        return moveDiv;
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
        
        // Filter and render available moves
        window.moves.forEach(move => {
            if (available.hasOwnProperty(move.id)) {
                const moveElement = renderMove(move, available, urlParams);
                movesContainer.appendChild(moveElement);
            }
        });
    }

    // Public API
    return {
        createMoveCheckboxes,
        createMoveTitle,
        createDescription,
        createOutcome,
        createPickOptions,
        renderMove,
        renderMovesForRole
    };
})();
