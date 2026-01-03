/**
 * Language Selector - Simple combo box for language selection
 * Automatically initializes from data-languages attribute on #language-selector
 */
(function() {
  const selector = document.getElementById('language-selector');
  if (!selector) return;

  const languagesAttr = selector.getAttribute('data-languages');

  // Only show if data-languages attribute is set
  if (languagesAttr) {
    const languages = languagesAttr.split(',').map(l => l.trim()).filter(l => l);

    // Add language options
    languages.forEach(langSpec => {
      const option = document.createElement('option');

      // Split by whitespace to separate emoji/label from language code
      // Last token is the language code, everything is used for display (with last token uppercased)
      const parts = langSpec.trim().split(/\s+/);
      const langCode = parts[parts.length - 1];

      // Create display text: everything before last token + uppercased last token
      let displayText;
      if (parts.length > 1) {
        const prefix = parts.slice(0, -1).join(' ');
        displayText = `${prefix} ${langCode.toUpperCase()}`;
      } else {
        displayText = langCode.toUpperCase();
      }

      option.value = langCode;
      option.textContent = displayText;
      selector.appendChild(option);
    });

    // Set current selection from URL
    const params = new URLSearchParams(window.location.search);
    const currentLang = params.get('lang');
    if (currentLang) {
      selector.value = currentLang;
    }

    // Show the selector
    selector.style.display = '';
    const label = selector.previousElementSibling;
    if (label && label.tagName === 'LABEL') {
      label.style.display = '';
    }

    // Handle language change
    selector.addEventListener('change', async function() {
      const lang = this.value;
      const path = window.location.pathname;
      const filename = path.split('/').pop();
      const baseFilename = filename.replace(/-[a-z]{2}\.html$/i, '.html');

      if (lang) {
        // Check if language-specific HTML exists (e.g., cs-es.html)
        const langFilename = baseFilename.replace('.html', `-${lang}.html`);

        try {
          const response = await fetch(langFilename, { method: 'HEAD' });

          if (response.ok) {
            // Navigate to language-specific file, remove lang param
            params.delete('lang');
            const query = params.toString();
            window.location.href = query ? `${langFilename}?${query}` : langFilename;
          } else {
            // Use query parameter approach
            params.set('lang', lang);
            window.location.href = `${baseFilename}?${params.toString()}`;
          }
        } catch (error) {
          // Fallback to query parameter
          params.set('lang', lang);
          window.location.href = `${baseFilename}?${params.toString()}`;
        }
      } else {
        // Navigate to default (base file, no lang parameter)
        params.delete('lang');
        const query = params.toString();
        window.location.href = query ? `${baseFilename}?${query}` : baseFilename;
      }
    });
  }
})();
