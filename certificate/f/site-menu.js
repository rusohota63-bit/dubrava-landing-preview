const siteMenuButton = document.querySelector(".site-menu-button");
const siteNavigation = document.getElementById("site-navigation");
const mobileMenuViewport = window.matchMedia("(max-width: 710px)");
const menuRoot = document.documentElement;
let previousCompactMode = mobileMenuViewport.matches;

function isCompactSiteMenu() {
  return mobileMenuViewport.matches || menuRoot.classList.contains("menu-compact");
}

// Measure the ordinary header synchronously, with no intermediate paint.
function measureSiteMenu() {
  const wasCompact = previousCompactMode;
  menuRoot.classList.remove("menu-compact");
  const header = siteNavigation.closest(".site-menu");
  header.style.removeProperty("--site-menu-height");
  let wrapped = false;
  if (!mobileMenuViewport.matches) {
    header.style.setProperty("--site-menu-inset", getComputedStyle(header).paddingRight);
    const links = [...siteNavigation.querySelectorAll("a")].filter(a => a.getClientRects().length);
    const bounds = siteNavigation.getBoundingClientRect();
    const firstTop = links[0]?.getBoundingClientRect().top;
    wrapped = links.some(link => {
      const box = link.getBoundingClientRect();
      const text = document.createRange();
      text.selectNodeContents(link);
      const lines = [...text.getClientRects()].filter(rect => rect.width && rect.height);
      return Math.abs(box.top - firstTop) > 1 || box.left < bounds.left - 1 ||
        box.right > bounds.right + 1 || link.scrollWidth > link.clientWidth + 1 ||
        lines.some(rect => Math.abs(rect.top - lines[0].top) > 1);
    });
    if (wrapped) {
      // Measure logo, phones and min-height without navigation rows in the flow.
      const position = siteNavigation.style.getPropertyValue("position");
      const priority = siteNavigation.style.getPropertyPriority("position");
      try {
        siteNavigation.style.setProperty("position", "absolute");
        header.style.setProperty("--site-menu-height", header.getBoundingClientRect().height + "px");
      } finally {
        if (position) siteNavigation.style.setProperty("position", position, priority);
        else siteNavigation.style.removeProperty("position");
      }
    }
  }
  menuRoot.classList.toggle("menu-compact", wrapped);
  previousCompactMode = isCompactSiteMenu();
  if (wasCompact !== isCompactSiteMenu()) {
    const focused = document.activeElement;
    closeSiteMenu();
    if (isCompactSiteMenu() && siteNavigation.contains(focused)) siteMenuButton.focus();
    if (!isCompactSiteMenu() && focused === siteMenuButton) siteNavigation.querySelector("a:not(.site-menu-home)")?.focus();
  }
}

function isSiteMenuOpen() {
  return siteMenuButton.getAttribute("aria-expanded") === "true";
}

function closeSiteMenu() {
  siteMenuButton.setAttribute("aria-expanded", "false");
}

siteMenuButton.addEventListener("click", () => {
  siteMenuButton.setAttribute("aria-expanded", String(!isSiteMenuOpen()));
});

siteNavigation.addEventListener("click", (event) => {
  if (isCompactSiteMenu() && event.target.closest("a")) {
    siteMenuButton.focus();
    closeSiteMenu();
  }
});

document.addEventListener("click", (event) => {
  if (!siteMenuButton.contains(event.target) && !siteNavigation.contains(event.target)) {
    closeSiteMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isCompactSiteMenu() && isSiteMenuOpen()) {
    siteMenuButton.focus();
    closeSiteMenu();
  }
});

mobileMenuViewport.addEventListener("change", closeSiteMenu);
document.addEventListener("focusin", (event) => {
  if (!siteMenuButton.contains(event.target) && !siteNavigation.contains(event.target)) closeSiteMenu();
});
window.addEventListener("resize", measureSiteMenu);
siteMenuButton.hidden = false;
try {
  measureSiteMenu();
} finally {
  menuRoot.classList.add("menu-ready");
}
document.fonts.ready.then(measureSiteMenu);
document.fonts.addEventListener("loadingdone", measureSiteMenu);
