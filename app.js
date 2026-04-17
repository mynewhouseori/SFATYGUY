const stateCycle = {
  ok: { next: "warning", label: "בטיפול" },
  warning: { next: "danger", label: "קריטי" },
  danger: { next: "muted", label: "לא רלוונטי" },
  muted: { next: "ok", label: "תקין" },
};

document.querySelectorAll(".check-item").forEach((item) => {
  item.addEventListener("click", () => {
    const current = item.dataset.state;
    const next = stateCycle[current];

    item.dataset.state = next.next;
    item.querySelector(".state-button").textContent = next.label;
  });
});

const navItems = document.querySelectorAll("[data-view-target]");
const views = document.querySelectorAll(".app-view");

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    const target = item.dataset.viewTarget;

    navItems.forEach((nav) => nav.classList.toggle("is-active", nav === item));
    views.forEach((view) => {
      view.classList.toggle("is-active", view.dataset.view === target);
    });
  });
});
