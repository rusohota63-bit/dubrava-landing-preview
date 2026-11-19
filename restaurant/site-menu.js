const siteMenuButton = document.querySelector(".site-menu-button");
const siteNavigation = document.getElementById("site-navigation");
const mobileMenuViewport = window.matchMedia("(max-width: 710px)");

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
  if (mobileMenuViewport.matches && event.target.closest("a")) {
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
  if (event.key === "Escape" && mobileMenuViewport.matches && isSiteMenuOpen()) {
    siteMenuButton.focus();
    closeSiteMenu();
  }
});

mobileMenuViewport.addEventListener("change", closeSiteMenu);
siteMenuButton.hidden = false;
