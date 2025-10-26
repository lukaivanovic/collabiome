class CollectionFilters extends HTMLElement {
  constructor() {
    super();
    this.productsContainer = null;
    this.allProducts = [];
    this.filteredProducts = [];
    this.activeFilters = {
      skin_type: [],
      routine_part: [],
      problem_solution: [],
    };
    this.productsPerPage = parseInt(this.dataset.productsPerPage) || 24;
    this.productsShown = 0;

    this.init();
  }

  init() {
    this.parseInitialFilters();
    this.setupEventListeners();
    this.renderFilterForm();
    this.collectProducts();
    this.applyFilters();
  }

  parseInitialFilters() {
    const urlParams = new URLSearchParams(window.location.search);

    // Parse skin type filters
    if (urlParams.has("skin_type")) {
      this.activeFilters.skin_type = urlParams.get("skin_type").split(",");
    }

    // Parse routine part filters
    if (urlParams.has("routine_part")) {
      this.activeFilters.routine_part = urlParams
        .get("routine_part")
        .split(",");
    }

    // Parse problem solution filters
    if (urlParams.has("problem_solution")) {
      this.activeFilters.problem_solution = urlParams
        .get("problem_solution")
        .split(",");
    }
  }

  setupEventListeners() {
    this.addEventListener("change", (e) => {
      if (e.target.classList.contains("filter-checkbox")) {
        this.handleFilterChange(e.target);
      }
    });

    this.addEventListener("click", (e) => {
      if (e.target.classList.contains("clear-all-btn")) {
        this.clearAllFilters();
      }
    });
  }

  renderFilterForm() {
    const filterConfig = JSON.parse(this.dataset.filterConfig || "{}");

    this.innerHTML = `
      <div class="bg-white rounded-lg p-6 border border-gray-200">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-medium uppercase">${this.getTranslation("filters.title")}</h2>
          ${
            this.hasActiveFilters()
              ? `
            <button type="button" class="clear-all-btn text-sm underline">
              ${this.getTranslation("filters.clear_all")}
            </button>
          `
              : ""
          }
        </div>

        <form id="filter-form">
          ${this.renderFilterGroup("skin_type", filterConfig.skin_type)}
          ${this.renderFilterGroup("routine_part", filterConfig.routine_part)}
          ${this.renderFilterGroup("problem_solution", filterConfig.problem_solution)}

          <button
            type="submit"
            class="w-full px-4 py-2 bg-black text-white rounded text-sm hover:bg-gray-800 transition-colors"
          >
            ${this.getTranslation("filters.apply")}
          </button>
        </form>
      </div>
    `;

    // Setup form submission
    const form = this.querySelector("#filter-form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.updateURL();
      });
    }
  }

  renderFilterGroup(filterType, options) {
    if (!options || !Array.isArray(options)) return "";

    const activeValues = this.activeFilters[filterType] || [];

    return `
      <div class="filter-group mb-6">
        <h3 class="text-sm font-medium mb-3 uppercase">${this.getTranslation(`filters.${filterType}`)}</h3>
        <div class="flex flex-col gap-2">
          ${options
            .map(
              (option) => `
            <label class="filter-checkbox-label">
              <input
                type="checkbox"
                name="${filterType}"
                value="${option.value}"
                ${activeValues.includes(option.value) ? "checked" : ""}
                class="filter-checkbox"
              >
              <span class="text-sm">${this.getTranslation(`filters.${filterType}_options.${option.value}`)}</span>
            </label>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  handleFilterChange(checkbox) {
    const filterType = checkbox.name;
    const value = checkbox.value;

    if (checkbox.checked) {
      if (!this.activeFilters[filterType].includes(value)) {
        this.activeFilters[filterType].push(value);
      }
    } else {
      this.activeFilters[filterType] = this.activeFilters[filterType].filter(
        (v) => v !== value
      );
    }

    this.applyFilters();
    this.updateURL();
  }

  clearAllFilters() {
    this.activeFilters = {
      skin_type: [],
      routine_part: [],
      problem_solution: [],
    };

    // Uncheck all checkboxes
    this.querySelectorAll(".filter-checkbox").forEach((checkbox) => {
      checkbox.checked = false;
    });

    this.applyFilters();
    this.updateURL();
  }

  collectProducts() {
    this.productsContainer = document.querySelector("[data-section-id]");
    if (!this.productsContainer) return;

    this.allProducts = Array.from(
      this.productsContainer.querySelectorAll(".product-card")
    ).map((card) => {
      return {
        element: card,
        skinType: card.dataset.skinType ? card.dataset.skinType.split(",") : [],
        routinePart: card.dataset.routinePart
          ? card.dataset.routinePart.split(",")
          : [],
        problemSolution: card.dataset.problemSolution
          ? card.dataset.problemSolution.split(",")
          : [],
      };
    });
  }

  applyFilters() {
    if (!this.hasActiveFilters()) {
      this.filteredProducts = [...this.allProducts];
    } else {
      this.filteredProducts = this.allProducts.filter((product) => {
        return this.productMatchesFilters(product);
      });
    }

    this.renderProducts();
    this.updateProductCount();
  }

  productMatchesFilters(product) {
    // Check skin type filter
    if (this.activeFilters.skin_type.length > 0) {
      const hasSkinTypeMatch = this.activeFilters.skin_type.some(
        (filterValue) => product.skinType.includes(filterValue)
      );
      if (!hasSkinTypeMatch) return false;
    }

    // Check routine part filter
    if (this.activeFilters.routine_part.length > 0) {
      const hasRoutinePartMatch = this.activeFilters.routine_part.some(
        (filterValue) => product.routinePart.includes(filterValue)
      );
      if (!hasRoutinePartMatch) return false;
    }

    // Check problem solution filter
    if (this.activeFilters.problem_solution.length > 0) {
      const hasProblemSolutionMatch = this.activeFilters.problem_solution.some(
        (filterValue) => product.problemSolution.includes(filterValue)
      );
      if (!hasProblemSolutionMatch) return false;
    }

    return true;
  }

  renderProducts() {
    if (!this.productsContainer) return;

    // Hide all products first
    this.allProducts.forEach((product) => {
      product.element.style.display = "none";
    });

    // Show filtered products
    this.productsShown = 0;
    this.filteredProducts.forEach((product, index) => {
      if (index < this.productsPerPage) {
        product.element.style.display = "block";
        this.productsShown++;
      }
    });

    // Show/hide load more button
    this.toggleLoadMoreButton();
  }

  toggleLoadMoreButton() {
    const loadMoreBtn = this.productsContainer?.querySelector(
      "[data-products-per-page]"
    );
    if (!loadMoreBtn) return;

    if (this.filteredProducts.length > this.productsShown) {
      loadMoreBtn.style.display = "block";
    } else {
      loadMoreBtn.style.display = "none";
    }
  }

  updateProductCount() {
    const countElement =
      this.productsContainer?.querySelector(".product-count");
    if (countElement) {
      countElement.textContent = `${this.filteredProducts.length} ${this.getTranslation("general.products")}`;
    }
  }

  updateURL() {
    const url = new URL(window.location);

    // Clear existing filter params
    url.searchParams.delete("skin_type");
    url.searchParams.delete("routine_part");
    url.searchParams.delete("problem_solution");

    // Add active filter params
    if (this.activeFilters.skin_type.length > 0) {
      url.searchParams.set("skin_type", this.activeFilters.skin_type.join(","));
    }
    if (this.activeFilters.routine_part.length > 0) {
      url.searchParams.set(
        "routine_part",
        this.activeFilters.routine_part.join(",")
      );
    }
    if (this.activeFilters.problem_solution.length > 0) {
      url.searchParams.set(
        "problem_solution",
        this.activeFilters.problem_solution.join(",")
      );
    }

    // Update URL without page reload
    window.history.pushState({}, "", url);
  }

  hasActiveFilters() {
    return Object.values(this.activeFilters).some(
      (filters) => filters.length > 0
    );
  }

  getTranslation(key) {
    // Fallback translations
    const translations = {
      "filters.title": "Filters",
      "filters.clear_all": "Clear all",
      "filters.apply": "Apply Filters",
      "filters.skin_type": "Skin Type",
      "filters.routine_part": "Routine Part",
      "filters.problem_solution": "Problem Solution",
      "filters.skin_type_options.dry": "Dry",
      "filters.skin_type_options.oily": "Oily",
      "filters.skin_type_options.combination": "Combination",
      "filters.skin_type_options.sensitive": "Sensitive",
      "filters.skin_type_options.normal": "Normal",
      "filters.routine_part_options.cleanser": "Cleanser",
      "filters.routine_part_options.toner": "Toner",
      "filters.routine_part_options.serum": "Serum",
      "filters.routine_part_options.moisturizer": "Moisturizer",
      "filters.routine_part_options.mask": "Mask",
      "filters.routine_part_options.eye_care": "Eye Care",
      "filters.problem_solution_options.acne": "Acne",
      "filters.problem_solution_options.aging": "Aging",
      "filters.problem_solution_options.hydration": "Hydration",
      "filters.problem_solution_options.brightening": "Brightening",
      "filters.problem_solution_options.redness": "Redness",
      "filters.problem_solution_options.dark_spots": "Dark Spots",
      "general.products": "Products",
    };

    return translations[key] || key;
  }
}

// Register the custom element
customElements.define("collection-filters", CollectionFilters);
