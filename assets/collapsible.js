class Collapsible extends HTMLElement {
  constructor() {
    super();
    this.toggle = this.toggle.bind(this); // Fix context binding
  }

  connectedCallback() {
    this.trigger = this.querySelector("[data-collapsible-trigger]");
    this.content = this.querySelector("[data-collapsible-content]");

    if (!this.trigger || !this.content) return;

    // Setup ARIA
    this.trigger.setAttribute("aria-expanded", "false");
    this.trigger.setAttribute("role", "button");
    this.trigger.setAttribute("tabindex", "0");

    // Event listeners
    this.trigger.addEventListener("click", this.toggle);
    this.trigger.addEventListener("keydown", this.handleKeydown.bind(this));
  }

  toggle(event) {
    event?.preventDefault();
    const isExpanded = this.trigger.getAttribute("aria-expanded") === "true";

    this.trigger.setAttribute("aria-expanded", !isExpanded);
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
