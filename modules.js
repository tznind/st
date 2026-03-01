/**
 * Modules UI - Handles the modules popup for enabling/disabling optional content
 */

window.ModulesUI = (function() {
    'use strict';

    let modulesLoaded = false;

    /**
     * Initialize the modules UI
     */
    function init() {
        const showButton = document.getElementById('show-modules');
        const modal = document.getElementById('modules-modal');
        const closeButton = modal?.querySelector('.modules-close');

        if (!showButton || !modal) {
            console.warn('Modules UI elements not found');
            return;
        }

        // Show modal on button click
        showButton.addEventListener('click', async () => {
            await loadModulesList();
            modal.style.display = 'flex';
        });

        // Close modal on close button click
        closeButton?.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Close modal on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        });
    }

    /**
     * Load modules list and populate the modal
     */
    async function loadModulesList() {
        if (modulesLoaded) {
            return;
        }

        const listContainer = document.getElementById('modules-list');
        if (!listContainer) return;

        try {
            const config = await window.JsonLoader.loadModulesConfig();
            const modules = config.modules || [];

            if (modules.length === 0) {
                listContainer.innerHTML = '<p class="modules-empty">No modules available.</p>';
                modulesLoaded = true;
                return;
            }

            // Get currently enabled modules from URL
            const params = new URLSearchParams(window.location.search);

            // Build checkboxes for each module
            listContainer.innerHTML = modules.map(module => {
                const checkboxId = `module_${module.id}`;
                const isChecked = params.get(checkboxId) === '1';

                return `
                    <div class="module-item">
                        <input type="checkbox" id="${checkboxId}" name="${checkboxId}" ${isChecked ? 'checked' : ''}>
                        <label for="${checkboxId}">
                            <span class="module-name">${module.name}</span>
                            <span class="module-desc">${module.description || ''}</span>
                        </label>
                    </div>
                `;
            }).join('');

            // Add note about page reload
            listContainer.innerHTML += `
                <p class="modules-note">Changes require a page reload to take effect.</p>
            `;

            // Add change listeners to update URL and reload
            modules.forEach(module => {
                const checkbox = document.getElementById(`module_${module.id}`);
                checkbox?.addEventListener('change', () => {
                    updateURLAndReload();
                });
            });

            modulesLoaded = true;

        } catch (error) {
            console.error('Failed to load modules list:', error);
            listContainer.innerHTML = '<p class="modules-empty">Failed to load modules.</p>';
        }
    }

    /**
     * Update URL with current checkbox states and reload the page
     */
    function updateURLAndReload() {
        const params = new URLSearchParams(window.location.search);
        const checkboxes = document.querySelectorAll('#modules-list input[type="checkbox"]');

        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                params.set(checkbox.id, '1');
            } else {
                params.delete(checkbox.id);
            }
        });

        // Reload with new params
        const newUrl = params.toString() ? '?' + params.toString() : window.location.pathname;
        window.location.href = newUrl;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        init,
        loadModulesList
    };
})();
