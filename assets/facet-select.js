/**
 * FacetSelect Web Component
 * Multi-select dropdown for Shopify collection filters
 */

class FacetSelect extends HTMLElement {
  constructor() {
    super();
    this.isOpen = false;
    this.button = null;
    this.panel = null;
    this.checkboxes = [];
    this.init();
  }

  init() {
    this.button = this.querySelector('[data-select-button]');
    this.panel = this.querySelector('[data-select-panel]');
    this.checkboxes = Array.from(this.querySelectorAll('input[type="checkbox"]'));

    if (!this.button || !this.panel) return;

    // Button click handler
    this.button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // Click outside to close
    document.addEventListener('click', this.handleClickOutside.bind(this));

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Handle checkbox changes
    this.checkboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        this.updateButtonText();
        this.dispatchChangeEvent();
      });
    });

    // Update button text on initialization
    this.updateButtonText();
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.isOpen) return;
    
    // Close all other facet-select components
    this.closeAllOtherDropdowns();
    
    this.isOpen = true;
    this.button.setAttribute('aria-expanded', 'true');
    this.panel.classList.remove('hidden');
    
    // Focus first checkbox if none selected
    const firstCheckbox = this.checkboxes.find(cb => !cb.checked);
    if (firstCheckbox) {
      setTimeout(() => firstCheckbox.focus(), 50);
    }
  }

  closeAllOtherDropdowns() {
    // Find all facet-select components
    const allDropdowns = document.querySelectorAll('facet-select');
    allDropdowns.forEach((dropdown) => {
      // Don't close this one
      if (dropdown !== this) {
        dropdown.close();
      }
    });
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.button.setAttribute('aria-expanded', 'false');
    this.panel.classList.add('hidden');
  }

  handleClickOutside(event) {
    if (!this.contains(event.target)) {
      this.close();
    }
  }

  updateButtonText() {
    const selectedCount = this.checkboxes.filter(cb => cb.checked).length;
    const filterLabel = this.getAttribute('data-filter-label') || 'Filter';
    
    // Find the text span (exclude the icon span) and update only that, preserving the icon
    const textSpan = this.button.querySelector('span:not([data-chevron-icon])');
    if (textSpan) {
      if (selectedCount === 0) {
        textSpan.textContent = filterLabel;
      } else {
        textSpan.textContent = `${filterLabel} (${selectedCount})`;
      }
    } else {
      // Fallback if span structure is not found
      if (selectedCount === 0) {
        this.button.textContent = filterLabel;
      } else {
        this.button.textContent = `${filterLabel} (${selectedCount})`;
      }
    }
  }

  dispatchChangeEvent() {
    this.dispatchEvent(new CustomEvent('facet-change', {
      bubbles: true,
      detail: { filter: this }
    }));
  }

  // Public method to get selected values
  getSelectedValues() {
    return this.checkboxes
      .filter(cb => cb.checked)
      .map(cb => cb.value);
  }

  // Public method to clear all selections
  clearAll() {
    this.checkboxes.forEach(cb => cb.checked = false);
    this.updateButtonText();
    this.dispatchChangeEvent();
  }
}

// Register the custom element
customElements.define('facet-select', FacetSelect);

// Export for potential external use
window.FacetSelect = FacetSelect;

