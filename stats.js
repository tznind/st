
// Render hex stats inside a container
window.renderStats = function(containerSelector, hexStats) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error('Stats container not found:', containerSelector);
    return;
  }

  if (!hexStats || !Array.isArray(hexStats)) {
    console.error('Invalid hexStats data provided');
    return;
  }

  const hexRow = document.createElement("div");
  hexRow.className = "hex-row";

  hexStats.forEach(stat => {
    if (!stat || !stat.id || !stat.title) {
      console.warn('Invalid stat data:', stat);
      return;
    }

    const hexContainer = document.createElement("div");
    hexContainer.className = "hex-container";

    const wrapper = document.createElement("div");
    wrapper.className = "hex-input-wrapper";

    const input = document.createElement("input");
    input.type = "text";
    input.id = stat.id;
    input.name = stat.id;
    input.placeholder = stat.title;
    input.setAttribute('aria-label', stat.title);
    
    // Note: persistence.js will handle loading/saving values

    wrapper.appendChild(input);
    hexContainer.appendChild(wrapper);

    const title = document.createElement("div");
    title.className = "hex-title";
    title.textContent = stat.title;
    hexContainer.appendChild(title);

    hexRow.appendChild(hexContainer);
  });

  container.appendChild(hexRow);

  return hexRow;
};
