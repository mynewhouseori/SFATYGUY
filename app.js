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
const selectedWorkerPanel = document.getElementById("selectedWorkerPanel");
const workerList = document.querySelector(".worker-list");
const workDateDisplay = document.getElementById("workDateDisplay");
const clockModal = document.getElementById("clockModal");
const clockValue = document.getElementById("clockValue");
const clockHours = document.getElementById("clockHours");
const clockMinutes = document.getElementById("clockMinutes");
const clockSave = document.getElementById("clockSave");
const clockCancel = document.getElementById("clockCancel");
const clockTriggers = Array.from(document.querySelectorAll("[data-clock-trigger]"));
const dateModal = document.getElementById("dateModal");
const dateValue = document.getElementById("dateValue");
const dateDay = document.getElementById("dateDay");
const dateMonth = document.getElementById("dateMonth");
const dateYear = document.getElementById("dateYear");
const dateSave = document.getElementById("dateSave");
const dateCancel = document.getElementById("dateCancel");
let activeClockTrigger = null;
let selectedClockHour = "06";
let selectedClockMinute = "35";

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
  return `${year}-${month}-${day}`;
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
  const value = dateValue ?? "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}${month}${year}`;
  }

  const digitsOnly = value.replace(/\D/g, "");
  return digitsOnly.length === 8 ? digitsOnly : "";
}

function formatDisplayDate(dateValue) {
  const normalizedDate = normalizeDateValue(dateValue);

  if (!normalizedDate) {
    return "DD/MM/YYYY";
  }

  return `${normalizedDate.slice(0, 2)}/${normalizedDate.slice(2, 4)}/${normalizedDate.slice(4, 8)}`;
}

function datePartsFromValue(dateValue) {
  const normalizedDate = normalizeDateValue(dateValue);
  const fallback = normalizeDateValue(getTodayValue());
  const value = normalizedDate || fallback;

  return {
    day: value.slice(0, 2),
    month: value.slice(2, 4),
    year: value.slice(4, 8),
  };
}

function toDateInputValue({ day, month, year }) {
  return `${year}-${month}-${day}`;
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
  setWorkDateValue(fields.workDate.value || todayValue);
}

function setWorkDateValue(dateValue) {
  if (!fields.workDate) {
    return;
  }

  fields.workDate.value = dateValue;
  updateReportDateDisplays();
}

function updateReportDateDisplays() {
  if (!fields.workDate) {
    return;
  }

  if (reportNumberField) {
    reportNumberField.textContent = formatReportNumber(fields.workDate.value);
  }
  if (reportWeekdayField) {
    reportWeekdayField.textContent = formatWeekday(fields.workDate.value);
  }
  if (workDateDisplay) {
    workDateDisplay.textContent = formatDisplayDate(fields.workDate.value);
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

setWorkDateValue(getTodayValue());

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.navTarget;
    if (target) {
      navigateTo(target);
    }
  });
});

function attachWorkerToggle(button) {
  button.addEventListener("click", () => {
    button.closest(".worker-card")?.classList.toggle("is-open");
  });
}

document.querySelectorAll("[data-worker-toggle]").forEach(attachWorkerToggle);

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

function updateClockValue() {
  if (clockValue) {
    clockValue.textContent = `${selectedClockHour}:${selectedClockMinute}`;
  }

  clockHours?.querySelectorAll("[data-hour]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.hour === selectedClockHour);
  });
  clockMinutes?.querySelectorAll("[data-minute]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.minute === selectedClockMinute);
  });
}

function openClockPicker(trigger) {
  activeClockTrigger = trigger;
  const [hour = "06", minute = "00"] = (trigger.dataset.timeValue || trigger.textContent || "06:00").split(":");
  selectedClockHour = hour.padStart(2, "0");
  selectedClockMinute = minute.padStart(2, "0");
  updateClockValue();
  clockModal?.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeClockPicker() {
  clockModal?.classList.remove("is-open");
  document.body.style.overflow = "";
  activeClockTrigger = null;
}

if (clockHours) {
  clockHours.innerHTML = Array.from({ length: 24 }, (_, hour) => {
    const value = String(hour).padStart(2, "0");
    return `<button class="clock-option" type="button" data-hour="${value}">${value}</button>`;
  }).join("");
}

if (clockMinutes) {
  clockMinutes.innerHTML = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"]
    .map((minute) => `<button class="clock-option" type="button" data-minute="${minute}">${minute}</button>`)
    .join("");
}

clockTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => openClockPicker(trigger));
});

clockHours?.querySelectorAll("[data-hour]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedClockHour = button.dataset.hour ?? selectedClockHour;
    updateClockValue();
  });
});

clockMinutes?.querySelectorAll("[data-minute]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedClockMinute = button.dataset.minute ?? selectedClockMinute;
    updateClockValue();
  });
});

clockSave?.addEventListener("click", () => {
  if (activeClockTrigger) {
    const value = `${selectedClockHour}:${selectedClockMinute}`;
    activeClockTrigger.dataset.timeValue = value;
    activeClockTrigger.textContent = value;
  }

  closeClockPicker();
});

clockCancel?.addEventListener("click", closeClockPicker);

clockModal?.addEventListener("click", (event) => {
  if (event.target === clockModal) {
    closeClockPicker();
  }
});

function populateDateSelect(select, values) {
  if (!select) {
    return;
  }

  select.innerHTML = values
    .map((value) => `<option value="${value}">${value}</option>`)
    .join("");
}

populateDateSelect(dateDay, Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, "0")));
populateDateSelect(dateMonth, Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0")));
populateDateSelect(dateYear, Array.from({ length: 7 }, (_, index) => String(new Date().getFullYear() - 1 + index)));

function updateDateValuePreview() {
  if (!dateValue || !dateDay || !dateMonth || !dateYear) {
    return;
  }

  dateValue.textContent = `${dateDay.value}/${dateMonth.value}/${dateYear.value}`;
}

function openDatePicker() {
  const parts = datePartsFromValue(fields.workDate?.value);

  if (dateDay) dateDay.value = parts.day;
  if (dateMonth) dateMonth.value = parts.month;
  if (dateYear) dateYear.value = parts.year;
  updateDateValuePreview();
  dateModal?.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeDatePicker() {
  dateModal?.classList.remove("is-open");
  document.body.style.overflow = "";
}

workDateDisplay?.addEventListener("click", openDatePicker);

[dateDay, dateMonth, dateYear].forEach((select) => {
  select?.addEventListener("change", updateDateValuePreview);
});

dateSave?.addEventListener("click", () => {
  if (!dateDay || !dateMonth || !dateYear) {
    return;
  }

  setWorkDateValue(toDateInputValue({ day: dateDay.value, month: dateMonth.value, year: dateYear.value }));
  closeDatePicker();
});

dateCancel?.addEventListener("click", closeDatePicker);

dateModal?.addEventListener("click", (event) => {
  if (event.target === dateModal) {
    closeDatePicker();
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
    workerSearch?.classList.remove("has-worker-match");
  }

});

function renderWorkerSuggestions(query) {
  if (!workerSuggestions) {
    return;
  }

  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    workerSuggestions.classList.remove("is-open");
    workerSuggestions.innerHTML = "";
    if (selectedWorkerPanel) {
      selectedWorkerPanel.classList.remove("is-open");
      selectedWorkerPanel.innerHTML = "";
    }
    workerSearch?.classList.remove("has-worker-match");
    return;
  }

  const matches = workerDatabase.filter((worker) =>
    worker.name.toLowerCase().startsWith(normalizedQuery)
  );

  workerSuggestions.classList.add("is-open");
  workerSearch?.classList.toggle("has-worker-match", matches.length > 0);

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
      const workerName = button.getAttribute("data-worker-name") ?? "";
      const selectedWorker = workerDatabase.find((worker) => worker.name === workerName);

      workerSearch.value = workerName;
      workerSearch.classList.remove("has-worker-match");
      workerSuggestions.classList.remove("is-open");

      if (selectedWorker) {
        renderSelectedWorker(selectedWorker);
      }
    });
  });
}

workerSearch?.addEventListener("input", (event) => {
  renderWorkerSuggestions(event.target.value);
});

function renderSelectedWorker(worker) {
  if (!selectedWorkerPanel) {
    return;
  }

  selectedWorkerPanel.classList.add("is-open");
  selectedWorkerPanel.innerHTML = `
    <article class="selected-worker-card">
      <div class="selected-worker-head">
        <div>
          <span class="mini-label">עובד נבחר מהמאגר</span>
          <h3>${worker.name}</h3>
          <p>${worker.role} • ${worker.contractor} • ${worker.status}</p>
        </div>
        <span class="status-chip ok">מאומת</span>
      </div>
      <div class="selected-worker-fields">
        <label class="mini-field">
          <span>שעת התחלה</span>
          <input class="time-input" type="time" value="07:00" />
        </label>
        <label class="mini-field">
          <span>שעת סיום</span>
          <input class="time-input" type="time" value="16:30" />
        </label>
        <label class="mini-field">
          <span>סטטוס מסמכים</span>
          <select data-worker-doc-status>
            <option value="תקין">תקין</option>
            <option value="חסר מסמך">חסר מסמך</option>
            <option value="נדרש צילום">נדרש צילום</option>
            <option value="לא רלוונטי">לא רלוונטי</option>
          </select>
        </label>
      </div>
      <div class="doc-status-note" data-doc-status-note>
        <span class="status-chip ok">מסמכים תקינים</span>
        <strong>אפשר להוסיף את העובד ליומן היום.</strong>
      </div>
      <input class="sr-only" type="file" accept="image/*,.pdf" capture="environment" data-worker-doc-file />
      <div class="selected-worker-actions">
        <button class="ghost-button" type="button" data-scan-worker-doc>סרוק/צלם מסמך</button>
        <button class="primary-button" type="button" data-add-worker-today>הוסף ליומן היום</button>
      </div>
    </article>
  `;

  const docStatus = selectedWorkerPanel.querySelector("[data-worker-doc-status]");
  const docNote = selectedWorkerPanel.querySelector("[data-doc-status-note]");
  const docFile = selectedWorkerPanel.querySelector("[data-worker-doc-file]");

  docStatus?.addEventListener("change", () => {
    updateSelectedWorkerDocNote(docStatus.value, docNote);
  });

  docFile?.addEventListener("change", () => {
    const fileName = docFile.files?.[0]?.name;

    if (fileName) {
      docStatus.value = "תקין";
      docNote.innerHTML = `
        <span class="status-chip ok">מסמך צורף</span>
        <strong>${fileName}</strong>
      `;
    }
  });

  selectedWorkerPanel.querySelector("[data-scan-worker-doc]")?.addEventListener("click", () => {
    docFile?.click();
  });

  selectedWorkerPanel.querySelector("[data-add-worker-today]")?.addEventListener("click", () => {
    addWorkerToToday(worker, docStatus?.value ?? "תקין", docFile?.files?.[0]?.name ?? "");
    selectedWorkerPanel.classList.remove("is-open");
    selectedWorkerPanel.innerHTML = "";
    workerSearch.value = "";
  });
}

function updateSelectedWorkerDocNote(status, noteElement) {
  if (!noteElement) {
    return;
  }

  const states = {
    "תקין": ["ok", "מסמכים תקינים", "אפשר להוסיף את העובד ליומן היום."],
    "חסר מסמך": ["warning", "חסר מסמך", "יש לצלם/לצרף מסמך או לסמן לטיפול."],
    "נדרש צילום": ["warning", "נדרש צילום", "לחץ על סרוק/צלם מסמך לפני ההוספה."],
    "לא רלוונטי": ["muted", "לא רלוונטי", "אין מסמך נדרש לעבודה הזו היום."],
  };
  const [className, label, text] = states[status] ?? states["תקין"];

  noteElement.innerHTML = `
    <span class="status-chip ${className}">${label}</span>
    <strong>${text}</strong>
  `;
}

function addWorkerToToday(worker, docStatus = "תקין", docFileName = "") {
  if (!workerList) {
    return;
  }

  const statusClass = docStatus === "תקין" ? "ok" : docStatus === "לא רלוונטי" ? "muted" : "warning";
  const docText = docFileName || docStatus;

  const card = document.createElement("article");
  card.className = "worker-card is-open";
  card.innerHTML = `
    <button class="worker-head" type="button" data-worker-toggle>
      <div>
        <h3>${worker.name}</h3>
        <p>${worker.role} • ${worker.contractor}</p>
      </div>
      <div class="worker-head-meta">
        <span>07:00 - 16:30</span>
        <span class="status-chip ok">נוסף היום</span>
      </div>
    </button>
    <div class="worker-body">
      <div class="worker-grid">
        <div class="worker-line"><span>שעת התחלה</span><strong>07:00</strong></div>
        <div class="worker-line"><span>שעת סיום</span><strong>16:30</strong></div>
        <div class="worker-line"><span>סה"כ שעות</span><strong>9.5</strong></div>
        <div class="worker-line"><span>מקור</span><strong>מאגר עובדים</strong></div>
      </div>
      <div class="worker-tags">
        <span>תדריך: לביצוע/אישור</span>
        <span>סוג עבודה: ${worker.role}</span>
        <span>סטטוס: נוסף ליומן היום</span>
      </div>
      <div class="doc-row">
        <span class="status-chip ok">ת"ז</span>
        <span class="status-chip ${statusClass}">${docText}</span>
        <span class="status-chip muted">צילום לפי צורך</span>
      </div>
    </div>
  `;

  attachWorkerToggle(card.querySelector("[data-worker-toggle]"));
  workerList.prepend(card);
}
