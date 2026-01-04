// Sidebar navigation logic for ExtractMD options page

/**
 * Initialize sidebar navigation behavior
 * Handles switching between sections with smooth transitions
 */
export function initializeNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.settings-section');

  navItems.forEach((item) => {
    item.addEventListener('click', function () {
      const targetSection = this.dataset.section;

      // Update active nav item
      navItems.forEach((nav) => nav.classList.remove('active'));
      this.classList.add('active');

      // Switch visible section
      sections.forEach((section) => {
        section.classList.remove('active');
        if (section.id === `section-${targetSection}`) {
          section.classList.add('active');
        }
      });

      // Save active section to localStorage for persistence
      localStorage.setItem('extractmd-active-section', targetSection);
    });
  });

  // Restore last active section on load
  restoreActiveSection(navItems, sections);
}

/**
 * Restore the last active section from localStorage
 * @param {NodeList} navItems - Navigation buttons
 * @param {NodeList} sections - Content sections
 */
function restoreActiveSection(navItems, sections) {
  const savedSection = localStorage.getItem('extractmd-active-section');

  if (savedSection) {
    const targetNav = document.querySelector(`.nav-item[data-section="${savedSection}"]`);
    const targetSection = document.getElementById(`section-${savedSection}`);

    if (targetNav && targetSection) {
      // Remove active from all
      navItems.forEach((nav) => nav.classList.remove('active'));
      sections.forEach((section) => section.classList.remove('active'));

      // Set the saved section as active
      targetNav.classList.add('active');
      targetSection.classList.add('active');
    }
  }
}

/**
 * Navigate to a specific section programmatically
 * @param {string} sectionName - The section to navigate to
 */
export function navigateToSection(sectionName) {
  const targetNav = document.querySelector(`.nav-item[data-section="${sectionName}"]`);
  if (targetNav) {
    targetNav.click();
  }
}
