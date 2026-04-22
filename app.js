const STORAGE_KEY = "safety-field-general-defaults";

const enterButton = document.getElementById("enterButton");
const continueButton = document.getElementById("continueButton");
const detailsForm = document.getElementById("detailsForm");
const formNote = document.getElementById("formNote");
const workerModal = document.getElementById("workerModal");
const openWorkerModal = document.getElementById("openWorkerModal");
const closeWorkerModal = document.getElementById("closeWorkerModal");
const reportStatusSelect = document.getElementById("reportStatusSelect");
const reportStatusTrigger = document.getElementById("reportStatusTrigger");
const reportStatusMenu = document.getElementById("reportStatusMenu");
const workerSearch = document.getElementById("workerSearch");
const workerSuggestions = document.getElementById("workerSuggestions");
const timePickers = Array.from(document.querySelectorAll("[data-time-picker]"));

const workerDatabase = [
  { name: "יוסי כהן", id: "123456789", role: "ברזלן", contractor: "אור פלדה", status: "כבר ביומן היום" },
  { name: "אמיר לוי", id: "234567891", role: "טפסן", contractor: "אלפא ביצוע", status: "כבר ביומן היום" },
  { name: "מוחמד סאלח", id: "345678912", role: "מפעיל ציוד", contractor: "ציוד דרום", status: "במאגר" },
  { name: "שלומי דדון", id: "456789123", role: "רתך", contractor: "אלפא ביצוע", status: "במאגר" },
  { name: "ראמי חטיב", id: "567891234", role: "מפעיל ציוד", contractor: "ציוד דרום", status: "במאגר" },
];

const fields = {
  workDate: document.getElementById("workDate"),
  managerName: document.getElementById("managerName"),
  siteName: document.getElementById("siteName"),
  contractorName: document.getElementById("contractorName"),
};
const reportNumberField = document.getElementById("reportNumber");
const reportWeekdayField = document.getElementById("reportWeekday");

const views = Array.from(document.querySelectorAll(".screen-view"));
const navButtons = Array.from(document.querySelectorAll("[data-nav-target]"));

function animateButton(button) {
  button.classList.add("is-pressed");
  window.setTimeout(() => button.classList.remove("is-pressed"), 180);
}

function getTodayValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${day}${month}${year}`;
}

function formatReportNumber(dateValue) {
  const normalizedDate = normalizeDateValue(dateValue);

  if (!normalizedDate) {
    return "00000000-001";
  }

  return `${normalizedDate}-001`;
}

function formatWeekday(dateValue) {
  const normalizedDate = normalizeDateValue(dateValue);

  if (!normalizedDate) {
    return "";
  }

  const day = Number(normalizedDate.slice(0, 2));
  const month = Number(normalizedDate.slice(2, 4));
  const year = Number(normalizedDate.slice(4, 8));
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("he-IL", { weekday: "long" }).format(date);
}

function normalizeDateValue(dateValue) {
  const digitsOnly = (dateValue ?? "").replace(/\D/g, "");
  return digitsOnly.length === 8 ? digitsOnly : "";
}

function loadDefaults() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveDefaults() {
  const defaults = {
    managerName: fields.managerName.value.trim(),
    siteName: fields.siteName.value.trim(),
    contractorName: fields.contractorName.value.trim(),
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
}

function populateForm() {
  const defaults = loadDefaults();
  const todayValue = getTodayValue();
  fields.managerName.value = defaults.managerName ?? "";
  fields.siteName.value = defaults.siteName ?? "";
  fields.contractorName.value = defaults.contractorName ?? "";
  fields.workDate.value = todayValue;

  if (reportNumberField) {
    reportNumberField.textContent = formatReportNumber(todayValue);
  }
  if (reportWeekdayField) {
    reportWeekdayField.textContent = formatWeekday(todayValue);
  }
}

function navigateTo(viewId) {
  views.forEach((view) => {
    view.classList.toggle("is-active", view.id === viewId);
  });
}

function resetErrorState() {
  formNote.classList.remove("is-error");
  formNote.textContent =
    "הפרטים יישמרו כברירת מחדל למכשיר הזה. את התאריך תבחר מחדש בכל פעם.";
}

enterButton.addEventListener("click", () => {
  animateButton(enterButton);
  populateForm();
  window.setTimeout(() => navigateTo("detailsView"), 160);
});

detailsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  resetErrorState();

  if (!detailsForm.reportValidity()) {
    formNote.classList.add("is-error");
    formNote.textContent = "יש למלא את כל שדות החובה לפני שממשיכים.";
    return;
  }

  animateButton(continueButton);
  saveDefaults();
  formNote.textContent = "הפרטים נשמרו. אפשר להמשיך למילוי היומן.";

  window.setTimeout(() => navigateTo("dashboardView"), 180);
});

fields.workDate?.addEventListener("change", () => {
  if (reportNumberField) {
    reportNumberField.textContent = formatReportNumber(fields.workDate.value);
  }
  if (reportWeekdayField) {
    reportWeekdayField.textContent = formatWeekday(fields.workDate.value);
  }
});

fields.workDate?.addEventListener("input", () => {
  fields.workDate.value = fields.workDate.value.replace(/\D/g, "").slice(0, 8);

  if (reportNumberField) {
    reportNumberField.textContent = formatReportNumber(fields.workDate.value);
  }
  if (reportWeekdayField) {
    reportWeekdayField.textContent = formatWeekday(fields.workDate.value);
  }
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.navTarget;
    if (target) {
      navigateTo(target);
    }
  });
});

document.querySelectorAll("[data-worker-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    button.closest(".worker-card")?.classList.toggle("is-open");
  });
});

document.querySelectorAll(".choice-group").forEach((group) => {
  group.querySelectorAll(".choice-chip").forEach((button) => {
    button.addEventListener("click", () => {
      group.querySelectorAll(".choice-chip").forEach((chip) => {
        chip.classList.toggle("is-selected", chip === button);
      });
    });
  });
});

openWorkerModal?.addEventListener("click", () => {
  workerModal?.classList.add("is-open");
  document.body.style.overflow = "hidden";
});

closeWorkerModal?.addEventListener("click", () => {
  workerModal?.classList.remove("is-open");
  document.body.style.overflow = "";
});

workerModal?.addEventListener("click", (event) => {
  if (event.target === workerModal) {
    workerModal.classList.remove("is-open");
    document.body.style.overflow = "";
  }
});

reportStatusTrigger?.addEventListener("click", () => {
  const isOpen = reportStatusSelect?.classList.toggle("is-open");
  reportStatusTrigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
});

reportStatusMenu?.querySelectorAll("[data-value]").forEach((button) => {
  button.addEventListener("click", () => {
    const value = button.getAttribute("data-value") ?? "";
    reportStatusTrigger.textContent = value;
    reportStatusMenu.querySelectorAll(".custom-select-option").forEach((option) => {
      option.classList.toggle("is-selected", option === button);
    });
    reportStatusSelect?.classList.remove("is-open");
    reportStatusTrigger.setAttribute("aria-expanded", "false");
  });
});

document.addEventListener("click", (event) => {
  if (!reportStatusSelect?.contains(event.target)) {
    reportStatusSelect?.classList.remove("is-open");
    reportStatusTrigger?.setAttribute("aria-expanded", "false");
  }

  if (!workerSuggestions?.contains(event.target) && event.target !== workerSearch) {
    workerSuggestions?.classList.remove("is-open");
  }

  timePickers.forEach((picker) => {
    if (!picker.contains(event.target)) {
      picker.classList.remove("is-open");
      picker.querySelector(".custom-time-trigger")?.setAttribute("aria-expanded", "false");
    }
  });
});

function renderWorkerSuggestions(query) {
  if (!workerSuggestions) {
    return;
  }

  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    workerSuggestions.classList.remove("is-open");
    workerSuggestions.innerHTML = "";
    return;
  }

  const matches = workerDatabase.filter((worker) =>
    worker.name.toLowerCase().startsWith(normalizedQuery)
  );

  workerSuggestions.classList.add("is-open");

  if (matches.length === 0) {
    workerSuggestions.innerHTML = `
      <div class="suggestion-empty">
        <span>לא נמצא עובד מתאים</span>
        <button class="ghost-button" type="button" id="openWorkerModalFromSearch">+ הוסף עובד חדש</button>
      </div>
    `;
    document.getElementById("openWorkerModalFromSearch")?.addEventListener("click", () => {
      workerModal?.classList.add("is-open");
      document.body.style.overflow = "hidden";
    });
    return;
  }

  workerSuggestions.innerHTML = matches
    .map(
      (worker) => `
        <button class="suggestion-item" type="button" data-worker-name="${worker.name}">
          <strong>${worker.name}</strong>
          <span>${worker.role} • ${worker.contractor} • ${worker.status}</span>
        </button>
      `
    )
    .join("");

  workerSuggestions.querySelectorAll(".suggestion-item").forEach((button) => {
    button.addEventListener("click", () => {
      workerSearch.value = button.getAttribute("data-worker-name") ?? "";
      workerSuggestions.classList.remove("is-open");
    });
  });
}

workerSearch?.addEventListener("input", (event) => {
  renderWorkerSuggestions(event.target.value);
});

function buildTimeOptions() {
  const options = [];

  for (let hour = 0; hour < 24; hour += 1) {
    for (const minute of [0, 15, 30, 45]) {
      options.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }
  }

  return options;
}

const timeOptions = buildTimeOptions();

timePickers.forEach((picker) => {
  const trigger = picker.querySelector(".custom-time-trigger");
  const menu = picker.querySelector(".custom-time-menu");

  if (!trigger || !menu) {
    return;
  }

  menu.innerHTML = timeOptions
    .map((time) => `<button class="custom-time-option" type="button" data-time="${time}">${time}</button>`)
    .join("");

  trigger.addEventListener("click", () => {
    const isOpen = picker.classList.toggle("is-open");
    trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  menu.querySelectorAll("[data-time]").forEach((button) => {
    button.addEventListener("click", () => {
      trigger.textContent = button.getAttribute("data-time") ?? "";
      menu.querySelectorAll(".custom-time-option").forEach((option) => {
        option.classList.toggle("is-selected", option === button);
      });
      picker.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
    });
  });
});
