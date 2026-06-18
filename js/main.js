/* ==========================================================================
   KSV PERFORMANCE GEAR — MAIN SCRIPT
   Theme switching, animated dropdown nav, animated tabs, mobile drawer.
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------
     THEME: default = system preference, persisted once user picks one
     ------------------------------------------------------------------ */
  var THEME_KEY = "ksv-theme";

  function getSystemTheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function getStoredTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (e) {
      return null;
    }
  }

  function setStoredTheme(value) {
    try {
      localStorage.setItem(THEME_KEY, value);
    } catch (e) {
      /* storage unavailable — theme just won't persist */
    }
  }

  function applyTheme(theme, animate) {
    var root = document.documentElement;
    if (animate) {
      root.classList.add("theme-transition");
      window.setTimeout(function () {
        root.classList.remove("theme-transition");
      }, 400);
    }
    root.setAttribute("data-theme", theme);
    var btns = document.querySelectorAll(".theme-toggle");
    btns.forEach(function (btn) {
      btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      );
    });
  }

  function initTheme() {
    var stored = getStoredTheme();
    var theme = stored || getSystemTheme();
    applyTheme(theme, false);

    // Follow system changes live, but only if the user hasn't made an explicit choice
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", function (e) {
        if (!getStoredTheme()) {
          applyTheme(e.matches ? "dark" : "light", true);
        }
      });
    }

    document.querySelectorAll(".theme-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var current = document.documentElement.getAttribute("data-theme");
        var next = current === "dark" ? "light" : "dark";
        applyTheme(next, true);
        setStoredTheme(next);
      });
    });
  }

  /* ------------------------------------------------------------------
     DROPDOWN NAV (animated open/close, hover on desktop, click on touch)
     ------------------------------------------------------------------ */
  function initDropdowns() {
    var items = document.querySelectorAll(".nav-item");

    function closeAll(except) {
      items.forEach(function (item) {
        if (item !== except) {
          item.classList.remove("open");
          var link = item.querySelector(".nav-link");
          if (link) link.setAttribute("aria-expanded", "false");
        }
      });
    }

    items.forEach(function (item) {
      var link = item.querySelector(".nav-link");
      var dropdown = item.querySelector(".dropdown");
      if (!link || !dropdown) return;

      link.setAttribute("aria-expanded", "false");

      function open() {
        closeAll(item);
        item.classList.add("open");
        link.setAttribute("aria-expanded", "true");
      }

      function close() {
        item.classList.remove("open");
        link.setAttribute("aria-expanded", "false");
      }

      function toggle() {
        if (item.classList.contains("open")) {
          close();
        } else {
          open();
        }
      }

      // Desktop: hover intent
      var hoverTimer;
      item.addEventListener("mouseenter", function () {
        if (window.matchMedia("(min-width: 861px)").matches) {
          clearTimeout(hoverTimer);
          open();
        }
      });
      item.addEventListener("mouseleave", function () {
        if (window.matchMedia("(min-width: 861px)").matches) {
          hoverTimer = window.setTimeout(close, 120);
        }
      });

      // Click/tap toggles (covers mobile + keyboard activation)
      link.addEventListener("click", function (e) {
        e.preventDefault();
        toggle();
      });

      link.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          close();
          link.blur();
        }
      });
    });

    document.addEventListener("click", function (e) {
      if (!e.target.closest(".nav-item")) {
        closeAll();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeAll();
    });
  }

  /* ------------------------------------------------------------------
     MOBILE NAV DRAWER
     ------------------------------------------------------------------ */
  function initMobileNav() {
    var toggle = document.querySelector(".menu-toggle");
    var links = document.querySelector(".nav-links");
    var scrim = document.querySelector(".nav-scrim");
    if (!toggle || !links || !scrim) return;

    function openDrawer() {
      links.classList.add("open");
      scrim.classList.add("active");
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }

    function closeDrawer() {
      links.classList.remove("open");
      scrim.classList.remove("active");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }

    toggle.addEventListener("click", function () {
      if (links.classList.contains("open")) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    scrim.addEventListener("click", closeDrawer);

    links.querySelectorAll("a:not(.nav-link)").forEach(function (a) {
      a.addEventListener("click", closeDrawer);
    });

    window.addEventListener("resize", function () {
      if (window.matchMedia("(min-width: 861px)").matches) {
        closeDrawer();
      }
    });
  }

  /* ------------------------------------------------------------------
     ANIMATED TABS — sliding indicator + crossfade panel switch
     Works for any [data-tabbar] group wired to [data-tab-panels]
     ------------------------------------------------------------------ */
  function initTabGroup(tabbar) {
    var indicator = tabbar.querySelector(".tabbar-indicator");
    var tabs = Array.prototype.slice.call(tabbar.querySelectorAll(".tab"));
    var panelGroupSelector = tabbar.getAttribute("data-tab-panels");
    var panelGroup = panelGroupSelector ? document.querySelector(panelGroupSelector) : null;

    function moveIndicator(tab) {
      if (!indicator) return;
      indicator.style.width = tab.offsetWidth + "px";
      indicator.style.transform = "translateX(" + tab.offsetLeft + "px)";
    }

    function activate(tab, focus) {
      tabs.forEach(function (t) {
        t.classList.toggle("active", t === tab);
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
      });
      moveIndicator(tab);

      if (panelGroup) {
        var targetId = tab.getAttribute("data-tab-target");
        var panels = panelGroup.querySelectorAll(".tab-panel");
        panels.forEach(function (panel) {
          var isMatch = panel.getAttribute("data-tab-id") === targetId;
          if (isMatch) {
            panel.classList.add("active");
          } else {
            panel.classList.remove("active");
          }
        });
      }

      if (focus) tab.focus();
    }

    tabs.forEach(function (tab, idx) {
      tab.setAttribute("role", "tab");
      tab.setAttribute("tabindex", tab.classList.contains("active") ? "0" : "-1");
      tab.addEventListener("click", function () {
        activate(tab, false);
      });
      tab.addEventListener("keydown", function (e) {
        var nextIdx = null;
        if (e.key === "ArrowRight") nextIdx = (idx + 1) % tabs.length;
        if (e.key === "ArrowLeft") nextIdx = (idx - 1 + tabs.length) % tabs.length;
        if (nextIdx !== null) {
          e.preventDefault();
          tabs[nextIdx].setAttribute("tabindex", "0");
          tab.setAttribute("tabindex", "-1");
          activate(tabs[nextIdx], true);
        }
      });
    });

    var initial = tabbar.querySelector(".tab.active") || tabs[0];
    if (initial) {
      // run after layout so offsetWidth/offsetLeft are accurate
      requestAnimationFrame(function () {
        moveIndicator(initial);
      });
    }

    window.addEventListener("resize", function () {
      var active = tabbar.querySelector(".tab.active");
      if (active) moveIndicator(active);
    });
  }

  function initTabs() {
    document.querySelectorAll("[data-tabbar]").forEach(initTabGroup);
  }

  /* ------------------------------------------------------------------
     TEAM KIT FRONT/BACK FLIP
     ------------------------------------------------------------------ */
  function initTeamFlip() {
    document.querySelectorAll(".team-flip").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var card = btn.closest(".team-card");
        if (!card) return;
        var front = card.querySelector(".img-front");
        var back = card.querySelector(".img-back");
        var showingBack = btn.classList.toggle("flipped");
        if (front && back) {
          front.classList.toggle("active", !showingBack);
          back.classList.toggle("active", showingBack);
        }
        btn.querySelector(".team-flip-label").textContent = showingBack
          ? "Show front"
          : "Show back";
      });
    });
  }

  /* ------------------------------------------------------------------
     SEARCH PILL — intentionally decorative, non-functional
     ------------------------------------------------------------------ */
  function initSearchPill() {
    document.querySelectorAll(".search-pill input").forEach(function (input) {
      input.addEventListener("keydown", function (e) {
        e.preventDefault();
      });
      input.addEventListener("paste", function (e) {
        e.preventDefault();
      });
    });
  }

  /* ------------------------------------------------------------------
     SCROLL-REVEAL for sections (subtle, respects reduced motion)
     ------------------------------------------------------------------ */
  function initScrollReveal() {
    var targets = document.querySelectorAll("[data-reveal]");
    var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !("IntersectionObserver" in window)) {
      targets.forEach(function (t) {
        t.classList.add("revealed");
      });
      return;
    }

    // Only opt an element into the hidden->reveal animation once JS is confirmed
    // running, so a slow/blocked script never leaves real content invisible.
    targets.forEach(function (t) {
      t.classList.add("reveal-armed");
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    targets.forEach(function (t) {
      observer.observe(t);
    });
  }

  /* ------------------------------------------------------------------
     ACTIVE NAV LINK (highlight current page in dropdown / top nav)
     ------------------------------------------------------------------ */
  function markActiveNav() {
    var path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("[data-nav-match]").forEach(function (link) {
      var match = link.getAttribute("data-nav-match");
      if (match === path) {
        link.classList.add("is-active");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initDropdowns();
    initMobileNav();
    initTabs();
    initTeamFlip();
    initSearchPill();
    initScrollReveal();
    markActiveNav();
  });
})();
