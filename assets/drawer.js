/**
 * GenericDrawer Web Component
 * A reusable drawer component that can slide from left or right
 * Supports focus trapping, overlay clicks, and ESC key to close
 */

class GenericDrawer extends HTMLElement {
  constructor() {
    super();
    this.isOpen = false;
    this.activeElement = null;
    this.init();
  }

  init() {
    // Set up event listeners
    this.addEventListener("keyup", (evt) => {
      if (evt.code === "Escape") {
        this.close();
      }
    });

    // Handle overlay clicks
    const overlay = this.querySelector("[data-drawer-overlay]");
    if (overlay) {
      overlay.addEventListener("click", this.close.bind(this));
    }

    // Handle close button clicks
    const closeButton = this.querySelector("[data-drawer-close]");
    if (closeButton) {
      closeButton.addEventListener("click", this.close.bind(this));
    }

    // Handle trigger buttons
    this.setupTriggerButtons();
  }

  setupTriggerButtons() {
    // Find all buttons that trigger this drawer
    const triggerButtons = document.querySelectorAll(
      `[data-drawer-trigger="${this.id}"]`
    );

    triggerButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        this.open(button);
      });
    });
  }

  open(triggeredBy = null) {
    if (this.isOpen) return;

    if (triggeredBy) {
      this.setActiveElement(triggeredBy);
    }

    this.isOpen = true;
    this.setAttribute("data-active", "true");

    // Prevent body scroll
    document.body.classList.add("overflow-hidden");

    // Focus trap after animation
    this.addEventListener(
      "transitionend",
      () => {
        const focusElement =
          this.querySelector("[data-drawer-close]") ||
          this.querySelector("[data-drawer-content]");
        if (focusElement && typeof trapFocus === "function") {
          trapFocus(this, focusElement);
        }
      },
      { once: true }
    );

    // Emit custom event
    this.dispatchEvent(
      new CustomEvent("drawer:open", {
        detail: { drawer: this },
      })
    );
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.removeAttribute("data-active");

    // Restore body scroll
    document.body.classList.remove("overflow-hidden");

    // Remove focus trap
    if (typeof removeTrapFocus === "function") {
      removeTrapFocus(this.activeElement);
    }

    // Emit custom event
    this.dispatchEvent(
      new CustomEvent("drawer:close", {
        detail: { drawer: this },
      })
    );
  }

  toggle(triggeredBy = null) {
    if (this.isOpen) {
      this.close();
    } else {
      this.open(triggeredBy);
    }
  }

  setActiveElement(element) {
    this.activeElement = element;
  }

  // Public API methods
  static open(drawerId, triggeredBy = null) {
    const drawer = document.getElementById(drawerId);
    if (drawer && drawer instanceof GenericDrawer) {
      drawer.open(triggeredBy);
    }
  }

  static close(drawerId) {
    const drawer = document.getElementById(drawerId);
    if (drawer && drawer instanceof GenericDrawer) {
      drawer.close();
    }
  }

  static toggle(drawerId, triggeredBy = null) {
    const drawer = document.getElementById(drawerId);
    if (drawer && drawer instanceof GenericDrawer) {
      drawer.toggle(triggeredBy);
    }
  }
}

// Register the custom element
customElements.define("generic-drawer", GenericDrawer);

// Export for potential external use
window.GenericDrawer = GenericDrawer;
