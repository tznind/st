/**
 * Module Attribution
 *
 * Renders attribution lines in the #module-attributions banner for any enabled
 * modules that declare an attribution in their modules.json entry.
 *
 * No hardcoded module IDs — extensible by adding attribution fields to
 * new modules in data/modules.json.
 */
(function() {
    'use strict';

    async function updateModuleAttributions() {
        const container = document.getElementById('module-attributions');
        if (!container) return;

        const enabledIds = window.JsonLoader.getEnabledModules();
        if (enabledIds.length === 0) return;

        const config = await window.JsonLoader.loadModulesConfig();
        const modules = config.modules || [];

        const lines = modules
            .filter(m => enabledIds.includes(m.id) && m.attribution)
            .map(m => {
                const a = m.attribution;
                const nameHtml = a.url
                    ? `<a href="${a.url}" target="_blank" style="color: #007bff; text-decoration: none;"><em>${m.name}</em></a>`
                    : `<em>${m.name}</em>`;
                return `<span>${nameHtml} ${a.statement} \u2022 Licensed under <a href="${a.licenseUrl}" target="_blank" style="color: #007bff;">${a.license}</a></span>`;
            });

        if (lines.length > 0) {
            container.innerHTML = lines.join('<br>');
            container.style.display = '';
        }
    }

    window.AppEvents.on('initializationComplete', updateModuleAttributions);

})();
