class MegaMenu extends HTMLElement {
  constructor() {
    super();
    this.activePanel = null;
    this.openTimeout = null;
    this.closeTimeout = null;
    this.openDelay = 60;
    this.closeDelay = 400;

    // Bind methods to maintain context
    this.scheduleClose = this.scheduleClose.bind(this);
    this.cancelClose = this.cancelClose.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  connectedCallback() {
    this.root = this;
    this.triggers = Array.from(
      this.querySelectorAll("[data-mega-menu-trigger]")
    );
    this.panelContainer = this.querySelector("[data-mega-menu-panels]");
    this.panels = this.panelContainer
      ? Array.from(
          this.panelContainer.querySelectorAll("[data-mega-menu-panel]")
        )
      : [];
    this.cards = Array.from(this.querySelectorAll("[data-mega-menu-card]"));

    if (this.triggers.length === 0 || this.panels.length === 0) {
      return;
    }

    this.panels.forEach((panel) => {
      panel.dataset.state = "closed";
    });

    this.bindEvents();
  }

  bindEvents() {
    this.root.addEventListener("mouseenter", this.cancelClose);
    this.root.addEventListener("mouseleave", this.scheduleClose);

    this.triggers.forEach((trigger) => {
      trigger.addEventListener("mouseenter", () =>
        this.handleTriggerEnter(trigger)
      );
      trigger.addEventListener("focusin", () =>
        this.handleTriggerEnter(trigger)
      );
      trigger.addEventListener("mouseleave", this.scheduleClose);
      trigger.addEventListener("focusout", this.scheduleClose);
    });

    this.panels.forEach((panel) => {
      panel.addEventListener("mouseenter", this.cancelClose);
      panel.addEventListener("mouseleave", this.scheduleClose);
      panel.addEventListener("focusin", this.cancelClose);
      panel.addEventListener("focusout", this.scheduleClose);
      panel.addEventListener("mousemove", (event) =>
        this.handlePanelMouseMove(panel, event)
      );
    });

    this.cards.forEach((card) => {
      card.addEventListener("mouseenter", this.cancelClose);
      card.addEventListener("mouseleave", this.scheduleClose);
    });

    document.addEventListener("keydown", this.handleKeydown);
  }

  handleKeydown(event) {
    if (event.key === "Escape" && this.activePanel) {
      this.closeAll();
    }
  }

  handleTriggerEnter(trigger) {
    const handle = trigger.dataset.collectionHandle;

    if (!handle) {
      return;
    }

    this.cancelClose();

    if (this.openTimeout) {
      clearTimeout(this.openTimeout);
    }

    this.openTimeout = setTimeout(() => this.showPanel(handle), this.openDelay);
  }

  handlePanelMouseMove(panel, event) {
    const card = panel.querySelector("[data-mega-menu-card]");

    if (!card) {
      return;
    }

    const rect = card.getBoundingClientRect();
    const withinCard =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (withinCard) {
      this.cancelClose();
    } else {
      this.scheduleClose();
    }
  }

  showPanel(handle) {
    const nextPanel = this.panelContainer
      ? this.panelContainer.querySelector(`[data-mega-menu-panel="${handle}"]`)
      : null;

    if (!nextPanel || this.activePanel === handle) {
      return;
    }

    this.panels.forEach((panel) => {
      if (panel === nextPanel) {
        panel.setAttribute("aria-hidden", "false");
        panel.dataset.state = "open";
      } else {
        panel.setAttribute("aria-hidden", "true");
        panel.dataset.state = "closed";
      }
    });

    if (this.root) {
      this.root.setAttribute("data-mega-menu-active", "true");
    }

    this.cancelOpen();
    this.triggers.forEach((triggerEl) => {
      const isActive = triggerEl.dataset.collectionHandle === handle;
      triggerEl.setAttribute("aria-expanded", isActive ? "true" : "false");
      triggerEl.classList.toggle("is-active", isActive);
    });
    this.activePanel = handle;
  }

  scheduleClose() {
    this.cancelOpen();
    this.cancelClose();
    this.closeTimeout = setTimeout(() => this.closeAll(), this.closeDelay);
  }

  cancelOpen() {
    if (this.openTimeout) {
      clearTimeout(this.openTimeout);
      this.openTimeout = null;
    }
  }

  cancelClose() {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  }

  closeAll() {
    this.panels.forEach((panel) => {
      panel.setAttribute("aria-hidden", "true");
      panel.dataset.state = "closed";
    });

    this.cancelOpen();
    this.cancelClose();
    this.activePanel = null;

    if (this.root) {
      this.root.removeAttribute("data-mega-menu-active");
    }

    this.triggers.forEach((triggerEl) => {
      triggerEl.setAttribute("aria-expanded", "false");
      triggerEl.classList.remove("is-active");
    });
  }

  disconnectedCallback() {
    if (this.root) {
      this.root.removeEventListener("mouseenter", this.cancelClose);
      this.root.removeEventListener("mouseleave", this.scheduleClose);
    }

    this.triggers?.forEach((trigger) => {
      trigger.removeEventListener("mouseleave", this.scheduleClose);
      trigger.removeEventListener("focusout", this.scheduleClose);
    });

    this.panels?.forEach((panel) => {
      panel.removeEventListener("mouseenter", this.cancelClose);
      panel.removeEventListener("mouseleave", this.scheduleClose);
      panel.removeEventListener("focusin", this.cancelClose);
      panel.removeEventListener("focusout", this.scheduleClose);
    });

    this.cards?.forEach((card) => {
      card.removeEventListener("mouseenter", this.cancelClose);
      card.removeEventListener("mouseleave", this.scheduleClose);
    });

    document.removeEventListener("keydown", this.handleKeydown);

    this.cancelOpen();
    this.cancelClose();
  }
}

customElements.define("mega-menu", MegaMenu);
