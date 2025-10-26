/**
 * FacetFilterForm Web Component
 * Handles URL-based filtering for Shopify collections
 */

class FacetFilterForm extends HTMLElement {
  constructor() {
    super();
    this.form = this.querySelector("form");
    this.init();
  }

  init() {
    if (!this.form) return;

    // Handle form submission
    this.form.addEventListener("submit", this.handleSubmit.bind(this));

    // Handle checkbox changes for immediate filtering
    this.form.addEventListener("change", this.handleChange.bind(this));

    // Handle clear all button
    const clearAllButton = this.querySelector(".facets__clear-all");
    if (clearAllButton) {
      clearAllButton.addEventListener("click", this.handleClearAll.bind(this));
    }
  }

  handleSubmit(event) {
    event.preventDefault();
    this.applyFilters();
  }

  handleChange(event) {
    if (event.target.type === "checkbox") {
      // Small delay to allow checkbox state to update
      setTimeout(() => {
        this.applyFilters();
      }, 10);
    }
  }

  handleClearAll(event) {
    event.preventDefault();
    // Navigate to collection URL without any filters
    const collectionUrl = this.getCollectionUrl();
    window.location.href = collectionUrl;
  }

  applyFilters() {
    const formData = new FormData(this.form);
    const searchParams = new URLSearchParams();

    // Add all form data to search params
    for (const [key, value] of formData.entries()) {
      if (value && value.trim() !== "") {
        searchParams.append(key, value);
      }
    }

    // Build new URL with filters
    const collectionUrl = this.getCollectionUrl();
    const newUrl = searchParams.toString()
      ? `${collectionUrl}?${searchParams.toString()}`
      : collectionUrl;

    // Navigate to filtered URL
    window.location.href = newUrl;
  }

  getCollectionUrl() {
    // Extract collection URL from current path
    const pathParts = window.location.pathname.split("/");
    const collectionHandle = pathParts[pathParts.length - 1];

    // Build collection URL
    return `/collections/${collectionHandle}`;
  }

  // Method to update product count (called from outside if needed)
  updateProductCount(count) {
    const countElement = document.querySelector(".product-count");
    if (countElement) {
      countElement.textContent = `${count} ${this.getTranslation("general.products", "Products")}`;
    }
  }

  // Simple translation helper
  getTranslation(key, fallback) {
    // This is a simplified version - in a real implementation,
    // you'd want to load translations from the theme
    const translations = {
      "general.products": "Products",
      "filters.no_products": "No products found with the selected filters.",
    };
    return translations[key] || fallback;
  }
}

// Register the custom element
customElements.define("facet-filter-form", FacetFilterForm);

// Export for potential external use
window.FacetFilterForm = FacetFilterForm;
