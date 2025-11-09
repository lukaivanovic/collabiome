class Collapsible extends HTMLElement {
  constructor() {
    super();
    this.toggle = this.toggle.bind(this); // Fix context binding
  }

  connectedCallback() {
    this.trigger = this.querySelector("[data-collapsible-trigger]");
    this.content = this.querySelector("[data-collapsible-content]");

    if (!this.trigger || !this.content) return;

    const shouldStartOpen =
      this.hasAttribute("data-open") || this.classList.contains("active");

    // Setup ARIA
    this.trigger.setAttribute(
      "aria-expanded",
      shouldStartOpen ? "true" : "false"
    );
    this.trigger.setAttribute("role", "button");
    this.trigger.setAttribute("tabindex", "0");

    if (shouldStartOpen) {
      this.classList.add("active");
    } else {
      this.classList.remove("active");
    }

    // Event listeners
    this.trigger.addEventListener("click", this.toggle);
    this.trigger.addEventListener("keydown", this.handleKeydown.bind(this));
  }

  toggle(event) {
    event?.preventDefault();
    const isExpanded = this.trigger.getAttribute("aria-expanded") === "true";

    this.trigger.setAttribute("aria-expanded", (!isExpanded).toString());
    this.classList.toggle("active");
  }

  handleKeydown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.toggle();
    }
  }

  disconnectedCallback() {
    this.trigger?.removeEventListener("click", this.toggle);
  }
}

customElements.define("collapsible-item", Collapsible);
