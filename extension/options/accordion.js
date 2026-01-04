// Accordion/collapsible UI logic for ExtractMD options page

/**
 * Initialize accordion behavior for collapsible sections
 */
export function initializeAccordion() {
  const collapsibles = document.querySelectorAll('.collapsible');
  collapsibles.forEach((btn) => {
    btn.addEventListener('click', function () {
      this.classList.toggle('active');
      const container = this.nextElementSibling;
      if (container) {
        container.classList.toggle('open');
      }
    });
  });
}
