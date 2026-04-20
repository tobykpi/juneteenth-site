const slideshow = document.querySelector("[data-slideshow]");
const dialogs = document.querySelectorAll(".bio-dialog");
const heroScene = document.querySelector("[data-hero-scene]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const topbar = document.querySelector(".topbar");
const siteNav = document.querySelector("nav");
const navDropdownDetails = document.querySelectorAll(".nav-dropdown-details");
const navDropdownPrimaryLinks = document.querySelectorAll(".nav-dropdown-toggle a");
const contactForms = document.querySelectorAll("[data-contact-form]");

if (slideshow) {
  const slides = Array.from(slideshow.querySelectorAll("[data-slide]"));
  const dots = Array.from(slideshow.querySelectorAll("[data-slide-to]"));
  const countLabel = slideshow.querySelector("[data-slide-count]");
  const prevButton = slideshow.querySelector('[data-slide-direction="prev"]');
  const nextButton = slideshow.querySelector('[data-slide-direction="next"]');
  const toggleButton = slideshow.querySelector("[data-slide-toggle]");
  const intervalMs = Number(slideshow.dataset.interval) || 5000;
  let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
  let timerId = null;
  let isPaused = false;

  if (activeIndex < 0) {
    activeIndex = 0;
  }

  function updateSlideState(index) {
    activeIndex = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeIndex;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });

    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === activeIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-pressed", String(isActive));
    });

    if (countLabel) {
      countLabel.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    }
  }

  function stopSlideshow() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function syncToggleButton() {
    if (!toggleButton) {
      return;
    }

    toggleButton.textContent = isPaused ? "Play" : "Pause";
    toggleButton.setAttribute("aria-pressed", String(isPaused));
    toggleButton.setAttribute(
      "aria-label",
      isPaused ? "Resume slideshow autoplay" : "Pause slideshow autoplay"
    );
  }

  function startSlideshow() {
    stopSlideshow();

    if (slides.length < 2 || isPaused) {
      return;
    }

    timerId = setInterval(() => {
      updateSlideState(activeIndex + 1);
    }, intervalMs);
  }

  function setPausedState(nextState) {
    isPaused = nextState;
    syncToggleButton();

    if (isPaused) {
      stopSlideshow();
    } else {
      startSlideshow();
    }
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      updateSlideState(Number(dot.dataset.slideTo));
      if (!isPaused) {
        startSlideshow();
      }
    });
  });

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      updateSlideState(activeIndex - 1);
      if (!isPaused) {
        startSlideshow();
      }
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      updateSlideState(activeIndex + 1);
      if (!isPaused) {
        startSlideshow();
      }
    });
  }

  if (toggleButton) {
    toggleButton.addEventListener("click", () => {
      setPausedState(!isPaused);
    });
  }

  slideshow.addEventListener("mouseenter", stopSlideshow);
  slideshow.addEventListener("mouseleave", () => {
    if (!isPaused) {
      startSlideshow();
    }
  });
  slideshow.addEventListener("focusin", stopSlideshow);
  slideshow.addEventListener("focusout", () => {
    if (!slideshow.contains(document.activeElement) && !isPaused) {
      startSlideshow();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopSlideshow();
    } else if (!isPaused) {
      startSlideshow();
    }
  });

  updateSlideState(activeIndex);
  syncToggleButton();
  startSlideshow();
}

function closeNavDropdowns(exceptDropdown = null) {
  navDropdownDetails.forEach((dropdown) => {
    if (dropdown !== exceptDropdown) {
      dropdown.removeAttribute("open");
    }
  });
}

navDropdownDetails.forEach((dropdown) => {
  dropdown.addEventListener("toggle", () => {
    if (dropdown.open) {
      closeNavDropdowns(dropdown);
    }
  });

  dropdown.querySelectorAll(".nav-dropdown-menu a").forEach((link) => {
    link.addEventListener("click", () => {
      closeNavDropdowns();
    });
  });
});

navDropdownPrimaryLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    window.location.assign(link.href);
  });
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".nav-dropdown")) {
    closeNavDropdowns();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeNavDropdowns();
  }
});

function syncHomeViewportHeight() {
  if (!document.body.classList.contains("home-page")) {
    return;
  }

  const headerHeight = (topbar?.offsetHeight || 0) + (siteNav?.offsetHeight || 0);
  document.documentElement.style.setProperty("--home-header-height", `${headerHeight}px`);
}

syncHomeViewportHeight();
window.addEventListener("load", syncHomeViewportHeight);
window.addEventListener("resize", syncHomeViewportHeight);

if (document.fonts?.ready) {
  document.fonts.ready.then(syncHomeViewportHeight);
}

if (heroScene && !prefersReducedMotion.matches) {
  const tiltLayers = Array.from(heroScene.querySelectorAll("[data-tilt-layer]"));

  function updateHeroScene(clientX, clientY) {
    const rect = heroScene.getBoundingClientRect();
    const pointerX = (clientX - rect.left) / rect.width;
    const pointerY = (clientY - rect.top) / rect.height;
    const clampedX = Math.min(Math.max(pointerX, 0), 1);
    const clampedY = Math.min(Math.max(pointerY, 0), 1);

    heroScene.style.setProperty("--pointer-x", `${(clampedX * 100).toFixed(2)}%`);
    heroScene.style.setProperty("--pointer-y", `${(clampedY * 100).toFixed(2)}%`);

    tiltLayers.forEach((layer) => {
      const depth = Number(layer.dataset.tiltDepth) || 0.2;
      const rotateX = (0.5 - clampedY) * 12 * depth;
      const rotateY = (clampedX - 0.5) * 16 * depth;

      layer.style.setProperty("--layer-rotate-x", `${rotateX.toFixed(2)}deg`);
      layer.style.setProperty("--layer-rotate-y", `${rotateY.toFixed(2)}deg`);
    });
  }

  function resetHeroScene() {
    heroScene.style.setProperty("--pointer-x", "50%");
    heroScene.style.setProperty("--pointer-y", "50%");

    tiltLayers.forEach((layer) => {
      layer.style.setProperty("--layer-rotate-x", "0deg");
      layer.style.setProperty("--layer-rotate-y", "0deg");
    });
  }

  heroScene.addEventListener("pointermove", (event) => {
    updateHeroScene(event.clientX, event.clientY);
  });

  heroScene.addEventListener("pointerleave", resetHeroScene);
  heroScene.addEventListener("pointercancel", resetHeroScene);

  resetHeroScene();
}

function syncDialogState() {
  const hasOpenDialog = Array.from(dialogs).some((dialog) => dialog.open);
  document.body.classList.toggle("dialog-open", hasOpenDialog);
}

document.querySelectorAll("[data-dialog]").forEach((button) => {
  button.addEventListener("click", () => {
    const dialog = document.getElementById(button.dataset.dialog);

    if (!dialog || typeof dialog.showModal !== "function") {
      return;
    }

    dialog.showModal();
    syncDialogState();
  });
});

document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => {
    const dialog = document.getElementById(button.dataset.closeDialog);

    if (!dialog) {
      return;
    }

    dialog.close();
  });
});

dialogs.forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    const clickedInsideDialog =
      rect.top <= event.clientY &&
      event.clientY <= rect.bottom &&
      rect.left <= event.clientX &&
      event.clientX <= rect.right;

    if (!clickedInsideDialog) {
      dialog.close();
    }
  });

  dialog.addEventListener("close", syncDialogState);
  dialog.addEventListener("cancel", syncDialogState);
});

contactForms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = form.dataset.contactEmail;

    if (!email) {
      return;
    }

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const senderEmail = String(formData.get("email") || "").trim();
    const subject = String(formData.get("subject") || "").trim() || "Website Contact Form";
    const message = String(formData.get("message") || "").trim();

    const bodyLines = [
      `Name: ${name}`,
      `Email: ${senderEmail}`,
      "",
      "Message:",
      message,
    ];

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

    window.location.href = mailtoUrl;
  });
});
