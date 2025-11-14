if (!customElements.get("testimonial-video-player")) {
  class TestimonialVideoPlayer extends HTMLElement {
    constructor() {
      super();
      this.openDialog = this.openDialog.bind(this);
      this.closeDialog = this.closeDialog.bind(this);
      this.handleBackdropClick = this.handleBackdropClick.bind(this);
      this.handleCancel = this.handleCancel.bind(this);
      this.handleDialogClose = this.handleDialogClose.bind(this);
      this.handleKeydown = this.handleKeydown.bind(this);
    }

    connectedCallback() {
      this.trigger = this.querySelector("[data-video-trigger]");
      this.dialog = this.querySelector("[data-video-dialog]");
      this.closeButton = this.querySelector("[data-video-close]");
      this.inlineVideo = this.querySelector("[data-inline-video] video");
      this.dialogVideo = this.querySelector("[data-dialog-video] video");
      this.supportsNativeDialog =
        this.dialog && typeof this.dialog.showModal === "function";

      if (!this.trigger || !this.dialog) return;

      this.trigger.addEventListener("click", this.openDialog);
      this.closeButton?.addEventListener("click", this.closeDialog);
      this.dialog.addEventListener("click", this.handleBackdropClick);

      if (this.supportsNativeDialog) {
        this.dialog.addEventListener("cancel", this.handleCancel);
        this.dialog.addEventListener("close", this.handleDialogClose);
      }
    }

    disconnectedCallback() {
      this.trigger?.removeEventListener("click", this.openDialog);
      this.closeButton?.removeEventListener("click", this.closeDialog);
      this.dialog?.removeEventListener("click", this.handleBackdropClick);

      if (this.supportsNativeDialog) {
        this.dialog?.removeEventListener("cancel", this.handleCancel);
        this.dialog?.removeEventListener("close", this.handleDialogClose);
      } else {
        document.removeEventListener("keydown", this.handleKeydown);
      }
    }

    openDialog() {
      if (!this.dialog) return;

      if (this.supportsNativeDialog) {
        if (!this.dialog.open) {
          this.dialog.showModal();
        }
      } else {
        this.dialog.setAttribute("open", "true");
        document.addEventListener("keydown", this.handleKeydown);
      }

      this.pauseInlineVideo();
      this.playDialogVideo();
    }

    closeDialog() {
      if (!this.dialog) return;

      if (this.supportsNativeDialog) {
        if (this.dialog.open) {
          this.dialog.close();
        }
      } else if (this.dialog.hasAttribute("open")) {
        this.dialog.removeAttribute("open");
        document.removeEventListener("keydown", this.handleKeydown);
        this.handleDialogClose();
      }

      this.trigger?.focus();
    }

    handleBackdropClick(event) {
      if (event.target === this.dialog) {
        this.closeDialog();
      }
    }

    handleCancel(event) {
      event.preventDefault();
      this.closeDialog();
    }

    handleDialogClose() {
      this.pauseDialogVideo();
      this.resumeInlineVideo();
    }

    handleKeydown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        this.closeDialog();
      }
    }

    playDialogVideo() {
      if (!this.dialogVideo) return;
      this.dialogVideo.muted = false;
      this.dialogVideo.currentTime = 0;
      const playPromise = this.dialogVideo.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {});
      }
    }

    pauseDialogVideo() {
      if (!this.dialogVideo) return;
      this.dialogVideo.pause();
      this.dialogVideo.currentTime = 0;
    }

    pauseInlineVideo() {
      if (!this.inlineVideo) return;
      this.inlineVideo.pause();
    }

    resumeInlineVideo() {
      if (!this.inlineVideo) return;
      const playPromise = this.inlineVideo.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {});
      }
    }
  }

  customElements.define("testimonial-video-player", TestimonialVideoPlayer);
}


