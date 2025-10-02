if (!customElements.get("product-form")) {
  customElements.define(
    "product-form",
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector("form");
        this.variantIdInput.disabled = false;
        this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
        this.cart = document.querySelector("cart-drawer");
        this.submitButton = this.querySelector('[type="submit"]');
        this.submitButtonText = this.submitButton.querySelector("span");

        if (document.querySelector("cart-drawer"))
          this.submitButton.setAttribute("aria-haspopup", "dialog");

        this.hideErrors = this.dataset.hideErrors === "true";

        // Initialize product data and variant selection
        this.initializeProductData();
        this.setupVariantSelection();
        this.setupQuantitySelection();
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute("aria-disabled") === "true") return;

        this.handleErrorMessage();

        this.submitButton.setAttribute("aria-disabled", true);
        this.submitButton.classList.add("loading");
        // this.querySelector(".loading__spinner").classList.remove("hidden");

        const config = fetchConfig("javascript");
        config.headers["X-Requested-With"] = "XMLHttpRequest";
        delete config.headers["Content-Type"];

        const formData = new FormData(this.form);
        if (this.cart) {
          formData.append(
            "sections",
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append("sections_url", window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: "product-form",
                productVariantId: formData.get("id"),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);

              const soldOutMessage =
                this.submitButton.querySelector(".sold-out-message");
              if (!soldOutMessage) return;
              this.submitButton.setAttribute("aria-disabled", true);
              this.submitButtonText.classList.add("hidden");
              soldOutMessage.classList.remove("hidden");
              this.error = true;

              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            const startMarker = CartPerformance.createStartingMarker(
              "add:wait-for-subscribers"
            );
            if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: "product-form",
                productVariantId: formData.get("id"),
                cartData: response,
              }).then(() => {
                CartPerformance.measureFromMarker(
                  "add:wait-for-subscribers",
                  startMarker
                );
              });
            this.error = false;
            const quickAddModal = this.closest("quick-add-modal");
            if (quickAddModal) {
              document.body.addEventListener(
                "modalClosed",
                () => {
                  setTimeout(() => {
                    CartPerformance.measure(
                      "add:paint-updated-sections",
                      () => {
                        this.cart.renderContents(response);
                      }
                    );
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              CartPerformance.measure("add:paint-updated-sections", () => {
                console.log("renderContents", response);
                this.cart.renderContents(response);
              });
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove("loading");
            if (this.cart && this.cart.classList.contains("is-empty"))
              this.cart.classList.remove("is-empty");
            if (!this.error) this.submitButton.removeAttribute("aria-disabled");
            // this.querySelector(".loading__spinner").classList.add("hidden");

            CartPerformance.measureFromEvent("add:user-action", evt);
          });
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper ||
          this.querySelector(".product-form__error-message-wrapper");
        if (!this.errorMessageWrapper) return;
        this.errorMessage =
          this.errorMessage ||
          this.errorMessageWrapper.querySelector(
            ".product-form__error-message"
          );

        this.errorMessageWrapper.toggleAttribute("hidden", !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        if (disable) {
          this.submitButton.setAttribute("disabled", "disabled");
          if (text) this.submitButtonText.textContent = text;
        } else {
          this.submitButton.removeAttribute("disabled");
          this.submitButtonText.textContent = window.variantStrings.addToCart;
        }
      }

      get variantIdInput() {
        return this.form.querySelector("[name=id]");
      }

      initializeProductData() {
        const productDataScript = document.querySelector("#product-data");
        if (productDataScript) {
          this.product = JSON.parse(productDataScript.textContent);
        } else {
          console.error("Product data script not found");
          this.product = null;
        }
      }

      setupVariantSelection() {
        if (!this.product || !this.product.variants) return;

        // Find all option inputs
        const optionInputs = this.form.querySelectorAll(
          'input[name^="options["]'
        );

        optionInputs.forEach((input) => {
          input.addEventListener("change", () => {
            this.updateVariantSelection();
          });
        });

        // Initial variant selection
        this.updateVariantSelection();
      }

      updateVariantSelection() {
        if (!this.product || !this.product.variants) return;

        // Get current selected options
        const selectedOptions = {};
        const optionInputs = this.form.querySelectorAll(
          'input[name^="options["]:checked'
        );

        optionInputs.forEach((input) => {
          const optionName = input.name.match(/options\[(.+)\]/)[1];
          selectedOptions[optionName] = input.value;
        });

        // Find matching variant
        const matchingVariant = this.product.variants.find((variant) => {
          return variant.options.every((option, index) => {
            const optionName = this.product.options[index];
            return selectedOptions[optionName] === option;
          });
        });

        if (matchingVariant) {
          // Update hidden variant ID input
          this.variantIdInput.value = matchingVariant.id;
          this.variantIdInput.disabled = false;

          // Update button state
          this.updateSubmitButton(matchingVariant);

          // Publish variant change event
          publish(PUB_SUB_EVENTS.variantChange, {
            variant: matchingVariant,
            product: this.product,
          });

          // Update price display
          this.updatePriceDisplay(matchingVariant);
        } else {
          // No matching variant found
          this.variantIdInput.disabled = true;
          this.submitButton.disabled = true;
          this.submitButtonText.textContent = "Unavailable";
        }
      }

      updateSubmitButton(variant) {
        if (!variant) {
          this.submitButton.disabled = true;
          this.submitButtonText.textContent = "Unavailable";
          return;
        }

        if (!variant.available) {
          this.submitButton.disabled = true;
          this.submitButtonText.textContent = "Sold out";
        } else {
          this.submitButton.disabled = false;
          this.submitButtonText.textContent = "Add to cart";
        }
      }

      updatePriceDisplay(variant) {
        const priceElement = document.querySelector(".product-price");
        const priceWrapper = document.querySelector(".product-price-wrapper");

        if (!priceElement || !variant) return;

        const quantity =
          parseInt(this.form.querySelector('input[name="quantity"]').value) ||
          1;
        const totalPrice = variant.price * quantity;

        // Update price
        priceElement.textContent = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(totalPrice / 100);

        // Handle compare at price
        let compareElement = priceWrapper.querySelector(
          ".product-price-compare"
        );

        if (
          variant.compare_at_price &&
          variant.compare_at_price > variant.price
        ) {
          const compareAtPrice = variant.compare_at_price * quantity;
          if (!compareElement) {
            compareElement = document.createElement("span");
            compareElement.className =
              "product-price-compare text-lg text-gray-500 line-through";
            priceWrapper.insertBefore(compareElement, priceElement);
          }
          compareElement.textContent = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(compareAtPrice / 100);
        } else if (compareElement) {
          compareElement.remove();
        }
      }

      setupQuantitySelection() {
        const quantityInput = this.form.querySelector('input[name="quantity"]');
        const minusButton = this.form.querySelector("[data-quantity-minus]");
        const plusButton = this.form.querySelector("[data-quantity-plus]");

        if (!quantityInput || !minusButton || !plusButton) return;

        // Quantity button handlers
        const updateQuantityButtons = () => {
          const quantity = parseInt(quantityInput.value) || 1;
          minusButton.disabled = quantity <= 1;
        };

        minusButton.addEventListener("click", () => {
          const currentValue = parseInt(quantityInput.value) || 1;
          if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
            this.handleQuantityChange();
            updateQuantityButtons();
          }
        });

        plusButton.addEventListener("click", () => {
          const currentValue = parseInt(quantityInput.value) || 1;
          quantityInput.value = currentValue + 1;
          this.handleQuantityChange();
          updateQuantityButtons();
        });

        quantityInput.addEventListener("change", () => {
          const value = parseInt(quantityInput.value);
          if (isNaN(value) || value < 1) {
            quantityInput.value = 1;
          }
          this.handleQuantityChange();
          updateQuantityButtons();
        });

        // Initial state
        updateQuantityButtons();
      }

      handleQuantityChange() {
        const variant = this.getCurrentVariant();
        if (variant) {
          this.updatePriceDisplay(variant);

          // Publish quantity update event
          publish(PUB_SUB_EVENTS.quantityUpdate, {
            quantity: parseInt(
              this.form.querySelector('input[name="quantity"]').value
            ),
            variant: variant,
          });
        }
      }

      getCurrentVariant() {
        const variantId = this.variantIdInput.value;
        if (!this.product || !variantId) return null;

        return this.product.variants.find((v) => v.id == variantId) || null;
      }
    }
  );
}
