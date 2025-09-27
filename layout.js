/**
 * Layout Module - Unified system for rendering the entire application
 * Single source of truth that reads state from URL and renders everything
 */

window.Layout = (function() {
    'use strict';

    /**
     * Main layout function - renders the entire application based on URL state
     * This is the single function called whenever anything needs to be re-rendered
     */
    async function layoutApplication() {
        console.log('Layout: Starting application layout...');
        
        try {
            // Preserve scroll position to prevent jumping
            const scrollY = window.scrollY;
            
            // Preserve collapse state before re-rendering
            const collapseState = window.MovesCore ? window.MovesCore.getCurrentCollapseState() : null;
            
            const urlParams = new URLSearchParams(location.search);
            const selectedRoles = window.Utils.getCurrentRoles();
            
            // Render stats (always shown)
            renderStats();
            
            // Clear containers first
            clearContainers();
            
            if (selectedRoles.length === 0) {
                // No roles selected - everything stays empty
                console.log('Layout: No roles selected, keeping containers empty');
                // Restore scroll position
                window.scrollTo(0, scrollY);
                return;
            }
            
            // Get merged availability for selected roles
            const mergedAvailability = window.Utils.mergeRoleAvailability(selectedRoles);
            
            // Render cards first (they don't depend on moves)
            await renderCards(selectedRoles, mergedAvailability);
            
            // Then render moves (including inline cards)
            await renderMoves(selectedRoles, mergedAvailability, urlParams);
            
            // Restore collapse state instead of expanding all
            if (window.MovesCore && collapseState) {
                window.MovesCore.restoreCollapseState(collapseState);
            }
            
            // Apply persistence to restore all form state immediately
            applyPersistenceState(urlParams);
            
            // Initialize takeFrom sections after persistence is applied
            if (window.TakeFrom) {
                setTimeout(() => {
                    window.TakeFrom.initializeTakeFromSections();
                }, 100);
            }
            
            // Restore scroll position after a brief delay to ensure layout is complete
            setTimeout(() => {
                window.scrollTo(0, scrollY);
            }, 50);
            
            console.log('Layout: Application layout complete');
            
        } catch (error) {
            console.error('Layout: Error during application layout:', error);
            showErrorMessage('Failed to render application. Please refresh the page.');
        }
    }
    
    /**
     * Render stats section
     */
    function renderStats() {
        if (window.renderStats && window.hexStats) {
            // Clear existing stats first to prevent doubling
            const statsContainer = document.querySelector('#stats-container');
            if (statsContainer) {
                statsContainer.innerHTML = '';
            }
            window.renderStats('#stats-container', window.hexStats);
        }
    }
    
    /**
     * Clear all main content containers
     */
    function clearContainers() {
        const containers = ['#cards-container', '#moves'];
        containers.forEach(selector => {
            const container = document.querySelector(selector);
            if (container) {
                container.innerHTML = '';
                container.style.display = 'none';
            }
        });
    }
    
    /**
     * Render cards for selected roles
     */
    async function renderCards(roles, mergedAvailability) {
        if (window.Cards) {
            await window.Cards.renderCardsForRole(roles, mergedAvailability);
        }
    }
    
    /**
     * Render moves for selected roles
     */
    async function renderMoves(roles, mergedAvailability, urlParams) {
        const movesContainer = document.getElementById("moves");
        if (!movesContainer) return;
        
        movesContainer.innerHTML = "";
        movesContainer.style.display = 'block';
        
        if (window.MovesCore) {
            window.MovesCore.renderMovesForRole(roles, mergedAvailability);
            
            // Initialize track counters after moves are rendered
            if (window.Track) {
                window.Track.initializeTrackCounters();
            }
            
            // After moves are rendered, restore inline cards based on URL state
            await restoreInlineCards(urlParams);
        }
    }
    
    /**
     * Restore inline cards based on URL state
     * This ensures granted cards are shown when their moves are checked
     */
    async function restoreInlineCards(urlParams) {
        if (!window.moves || !window.InlineCards) return;
        
        // Find all moves that grant cards and check if they're selected
        // Remove delay to prevent screen jumping
        for (const move of window.moves) {
            if (move.grantsCard) {
                const isTaken = window.MovesCore.isMoveTaken(move, urlParams);
                const containerId = `granted_card_${move.id}`;
                
                if (isTaken) {
                    console.log(`Layout: Restoring granted card '${move.grantsCard}' for move '${move.id}'`);
                    await window.InlineCards.displayCard(containerId, move.grantsCard);
                }
            }
        }
    }
    
    /**
     * Apply persistence state to form elements
     * This ensures all form inputs reflect the URL state
     */
    function applyPersistenceState(urlParams) {
        const form = document.querySelector('form');
        if (form && window.Persistence) {
            // Load state from URL to all form inputs
            window.Persistence.loadFromURL(form);
        }
    }
    
    /**
     * Show error message to user
     */
    function showErrorMessage(message) {
        const movesContainer = document.getElementById("moves");
        if (movesContainer) {
            movesContainer.innerHTML = `<div class="error-message">${message}</div>`;
            movesContainer.style.display = 'block';
        }
    }
    
    /**
     * Quick layout update for simple state changes
     * This is an optimized version for cases where we don't need full re-render
     */
    async function quickLayoutUpdate(changeType, ...args) {
        console.log('Layout: Quick update requested:', changeType);
        
        switch (changeType) {
            case 'hide-untaken-toggle':
                // Store current collapse state before re-rendering
                const collapseState = window.MovesCore ? window.MovesCore.getCurrentCollapseState() : null;
                
                // Just re-render moves section with scroll preservation
                const scrollY = window.scrollY;
                const selectedRoles = window.Utils.getCurrentRoles();
                if (selectedRoles.length > 0) {
                    const mergedAvailability = window.Utils.mergeRoleAvailability(selectedRoles);
                    const urlParams = new URLSearchParams(location.search);
                    await renderMoves(selectedRoles, mergedAvailability, urlParams);
                    
                    // Initialize track counters after moves are rendered
                    if (window.Track) {
                        window.Track.initializeTrackCounters();
                    }
                    
                    applyPersistenceState(urlParams);
                    
                    // Restore collapse state instead of expanding all
                    if (window.MovesCore && collapseState) {
                        window.MovesCore.restoreCollapseState(collapseState);
                    }
                    
                    // Restore scroll position
                    setTimeout(() => window.scrollTo(0, scrollY), 25);
                }
                break;
                
            default:
                // For any other changes, do full layout
                await layoutApplication();
                break;
        }
    }
    
    // Public API
    return {
        layoutApplication,
        quickLayoutUpdate
    };

})();