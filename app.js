const STORAGE_KEY = "safety-field-general-defaults";
const CLOUD_DOCUMENTS_KEY = "safety-field-cloud-documents";
const CLOUD_DOCUMENTS_COLLECTION = "safety_worker_documents";
const CLOUD_DOCUMENT_CHUNKS_COLLECTION = "safety_worker_document_chunks";
const FIRESTORE_PAYLOAD_CHUNK_SIZE = 180000;
const MAX_DOCUMENT_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_WORKER_DOCUMENTS = ["תעודת זהות", "רשיון נהיגה", "אישור עבודה בגובה"];
const FIREBASE_STORAGE_CONFIG = {
  apiKey: "AIzaSyCba5FEsy3WlrrkzjXFPZrKyW9nXsdZ5l4",
  authDomain: "nfc-demo-91f72.firebaseapp.com",
  projectId: "nfc-demo-91f72",
  storageBucket: "nfc-demo-91f72.firebasestorage.app",
  messagingSenderId: "1097334929129",
  appId: "1:1097334929129:web:73ee3cc80f0b86572d2278",
};
let workerDocumentRefreshToken = 0;
const workerDocumentUrlCache = new Map();

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
const workerDocsModal = document.getElementById("workerDocsModal");
const workerDocsTitle = document.getElementById("workerDocsTitle");
const workerDocsList = document.getElementById("workerDocsList");
const workerDocsClose = document.getElementById("workerDocsClose");
const workerDocsScan = document.getElementById("workerDocsScan");
const screenPanel = document.querySelector(".screen-panel");
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

function getFirebaseConfig() {
  return {
    ...FIREBASE_STORAGE_CONFIG,
    ...(window.SFATYGUY_FIREBASE_CONFIG ?? {}),
  };
}

function getFirebaseFirestore() {
  if (!window.firebase?.apps) {
    return null;
  }

  const app = window.firebase.apps.length
    ? window.firebase.app()
    : window.firebase.initializeApp(getFirebaseConfig());

  return window.firebase.firestore(app);
}

function loadCloudDocuments() {
  try {
    const stored = window.localStorage.getItem(CLOUD_DOCUMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function normalizeWorkerDocumentName(name = "") {
  const normalized = String(name).trim();

  if (normalized.includes("תעודת") && normalized.includes("זהות")) {
    return "תעודת זהות";
  }

  if (normalized.includes("רשיון") || normalized.includes("רישיון") || normalized.includes("נהיגה")) {
    return "רשיון נהיגה";
  }

  if (normalized.includes("עבודה") && normalized.includes("גובה")) {
    return "אישור עבודה בגובה";
  }

  return "";
}

function saveCloudDocumentRecord(record) {
  const records = loadCloudDocuments().filter((item) => item.id !== record.id);
  records.unshift(record);
  window.localStorage.setItem(CLOUD_DOCUMENTS_KEY, JSON.stringify(records.slice(0, 120)));
}

function saveCloudDocumentRecords(recordsToMerge) {
  const existing = loadCloudDocuments();
  const byId = new Map(existing.map((item) => [item.id, item]));
  recordsToMerge.forEach((item) => byId.set(item.id, item));
  const merged = Array.from(byId.values())
    .sort((a, b) => String(b.savedAt || "").localeCompare(String(a.savedAt || "")))
    .slice(0, 120);
  window.localStorage.setItem(CLOUD_DOCUMENTS_KEY, JSON.stringify(merged));
}

function getCloudDocumentsForWorker(worker) {
  return loadCloudDocuments()
    .filter((doc) => doc.workerId === worker.id)
    .map((doc) => ({
      ...doc,
      documentType: normalizeWorkerDocumentName(doc.documentType),
    }))
    .filter((doc) => ALLOWED_WORKER_DOCUMENTS.includes(doc.documentType))
    .map((doc) => ({
      id: doc.id,
      name: doc.documentType,
      status: "נשמר בענן",
      expiry: doc.savedAtDisplay,
      className: "ok",
      url: doc.publicUrl || doc.previewUrl || (doc.storageMode === "firestore-chunked" ? "cloud:" + doc.id : ""),
      cloudPath: doc.path,
      storageMode: doc.storageMode || "firestore",
      chunkCount: doc.chunkCount || 0,
      mimeType: doc.mimeType || "",
      fileName: doc.fileName || "",
    }));
}

function sanitizePathSegment(value) {
  return (value || "general")
    .toString()
    .trim()
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "general";
}

function getActiveSiteName() {
  return fields.siteName?.value?.trim() || "site";
}

async function uploadWorkerDocumentToCloud(worker, file, documentType) {
  if (!file) {
    return { ok: false, message: "לא נבחר קובץ." };
  }

  const now = new Date();
  return uploadWorkerDocumentToFirestore(worker, file, documentType, now);
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("קריאת הקובץ נכשלה."));
    reader.readAsDataURL(file);
  });
}

async function prepareDocumentPayload(file) {
  const isImage = file.type.startsWith("image/");

  if (file.size > MAX_DOCUMENT_FILE_SIZE) {
    throw new Error("The selected file is too large to upload from this device.");
  }

  if (!isImage) {
    return fileToDataUrl(file);
  }

  const sourceDataUrl = await fileToDataUrl(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Image processing failed."));
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    image.onerror = () => reject(new Error("Image loading failed."));
    image.src = sourceDataUrl;
  });
}


function splitIntoPayloadChunks(payload, chunkSize = FIRESTORE_PAYLOAD_CHUNK_SIZE) {
  const chunks = [];

  for (let index = 0; index < payload.length; index += chunkSize) {
    chunks.push(payload.slice(index, index + chunkSize));
  }

  return chunks;
}

async function saveChunkedDocumentPayload(firestore, documentId, payload, mimeType) {
  const chunks = splitIntoPayloadChunks(payload);

  if (!chunks.length) {
    throw new Error("Document payload is empty.");
  }

  for (let startIndex = 0; startIndex < chunks.length; startIndex += 200) {
    const batch = firestore.batch();
    const batchChunks = chunks.slice(startIndex, startIndex + 200);

    batchChunks.forEach((chunk, offset) => {
      const chunkIndex = startIndex + offset;
      const chunkRef = firestore.collection(CLOUD_DOCUMENT_CHUNKS_COLLECTION).doc(`${documentId}_${chunkIndex}`);
      batch.set(chunkRef, {
        documentId,
        index: chunkIndex,
        payload: chunk,
        mimeType,
        createdAt: new Date().toISOString(),
      });
    });

    await batch.commit();
  }

  return chunks.length;
}

async function loadChunkedDocumentPayload(firestore, documentId) {
  const snapshot = await firestore
    .collection(CLOUD_DOCUMENT_CHUNKS_COLLECTION)
    .where("documentId", "==", documentId)
    .get();

  if (snapshot.empty) {
    throw new Error("Document chunks were not found in cloud storage.");
  }

  return snapshot.docs
    .map((doc) => doc.data())
    .sort((a, b) => Number(a.index || 0) - Number(b.index || 0))
    .map((item) => String(item.payload || ""))
    .join("");
}

async function resolveWorkerDocumentUrl(doc) {
  if (doc.url && !String(doc.url).startsWith("cloud:")) {
    return doc.url;
  }

  if (workerDocumentUrlCache.has(doc.id)) {
    return workerDocumentUrlCache.get(doc.id);
  }

  const firestore = getFirebaseFirestore();

  if (!firestore) {
    throw new Error("Firebase Firestore is not available.");
  }

  if (doc.storageMode === "firestore-chunked") {
    const payload = await loadChunkedDocumentPayload(firestore, doc.id);
    workerDocumentUrlCache.set(doc.id, payload);
    return payload;
  }

  throw new Error("Document URL is not available.");
}

async function openWorkerDocument(doc) {
  try {
    const documentUrl = await resolveWorkerDocumentUrl(doc);
    window.open(documentUrl, "_blank", "noopener,noreferrer");
  } catch (error) {
    window.alert(error?.message || "Opening the document failed.");
  }
}
async function uploadWorkerDocumentToFirestore(worker, file, documentType, now = new Date()) {
  const firestore = getFirebaseFirestore();

  if (!firestore) {
    return {
      ok: false,
      message: "Firebase Firestore is not available. Check the network connection.",
    };
  }

  try {
    const previewUrl = await prepareDocumentPayload(file);
    const docRef = firestore.collection(CLOUD_DOCUMENTS_COLLECTION).doc();
    const record = buildCloudDocumentRecord(worker, file, documentType, "", "", now);
    record.id = docRef.id;
    record.mimeType = file.type || "application/octet-stream";

    if (previewUrl.length > FIRESTORE_PAYLOAD_CHUNK_SIZE) {
      record.storageMode = "firestore-chunked";
      record.chunkCount = await saveChunkedDocumentPayload(firestore, record.id, previewUrl, record.mimeType);
    } else {
      record.previewUrl = previewUrl;
      record.storageMode = "firestore";
      record.chunkCount = 1;
    }

    await docRef.set(record);
    saveCloudDocumentRecord(record);
    return { ok: true, record };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || "Saving the document to Firestore failed.",
    };
  }
}

async function syncWorkerDocumentsFromCloud(worker) {
  const firestore = getFirebaseFirestore();

  if (!firestore) {
    return [];
  }

  try {
    const snapshot = await firestore
      .collection(CLOUD_DOCUMENTS_COLLECTION)
      .where("workerId", "==", worker.id)
      .get();
    const records = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    saveCloudDocumentRecords(records);
    return records;
  } catch {
    return [];
  }
}

function buildCloudDocumentRecord(worker, file, documentType, objectPath, publicUrl, now) {
  const savedAtDisplay = new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);

  return {
    id: `${worker.id}-${now.getTime()}`,
    workerId: worker.id,
    workerName: worker.name,
    documentType: documentType || file.name || "מסמך עובד",
    fileName: file.name || "document",
    path: objectPath,
    publicUrl,
    savedAt: now.toISOString(),
    savedAtDisplay,
  };
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
  screenPanel?.classList.toggle("is-login-active", viewId === "loginView");
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

function getWorkerDocuments(worker) {
  const cloudDocs = getCloudDocumentsForWorker(worker);
  const cloudNames = new Set(cloudDocs.map((doc) => doc.name));
  const role = worker.role || "";

  const baseDocs = [
    { name: "\u05EA\u05E2\u05D5\u05D3\u05EA \u05D6\u05D4\u05D5\u05EA", status: "\u05D1\u05EA\u05D5\u05E7\u05E3", expiry: "\u05E7\u05D1\u05D5\u05E2", className: "ok" },
    {
      name: "\u05E8\u05E9\u05D9\u05D5\u05DF \u05E0\u05D4\u05D9\u05D2\u05D4",
      status: role.includes("\u05DE\u05E4\u05E2\u05D9\u05DC") ? "\u05D1\u05EA\u05D5\u05E7\u05E3" : "\u05D7\u05E1\u05E8",
      expiry: role.includes("\u05DE\u05E4\u05E2\u05D9\u05DC") ? "15/08/2026" : "\u05E0\u05D3\u05E8\u05E9 \u05E6\u05D9\u05DC\u05D5\u05DD",
      className: role.includes("\u05DE\u05E4\u05E2\u05D9\u05DC") ? "ok" : "warning",
    },
    {
      name: "\u05D0\u05D9\u05E9\u05D5\u05E8 \u05E2\u05D1\u05D5\u05D3\u05D4 \u05D1\u05D2\u05D5\u05D1\u05D4",
      status: ["\u05D8\u05E4\u05E1\u05DF", "\u05D1\u05E8\u05D6\u05DC\u05DF"].some((item) => role.includes(item)) ? "\u05D1\u05EA\u05D5\u05E7\u05E3" : "\u05D7\u05E1\u05E8",
      expiry: ["\u05D8\u05E4\u05E1\u05DF", "\u05D1\u05E8\u05D6\u05DC\u05DF"].some((item) => role.includes(item)) ? "20/11/2026" : "\u05E0\u05D3\u05E8\u05E9 \u05E6\u05D9\u05DC\u05D5\u05DD",
      className: ["\u05D8\u05E4\u05E1\u05DF", "\u05D1\u05E8\u05D6\u05DC\u05DF"].some((item) => role.includes(item)) ? "ok" : "warning",
    },
  ];

  return [
    ...cloudDocs,
    ...baseDocs.filter((doc) => !cloudNames.has(doc.name)),
  ];
}

function getSavedWorkerDocuments(worker) {
  return getWorkerDocuments(worker).filter((doc) => doc.status !== "חסר");
}

function openWorkerDocs(worker, selectedDocId = "") {
  if (!workerDocsModal || !workerDocsList) {
    return;
  }

  const allDocs = getWorkerDocuments(worker);
  const selectedDoc = selectedDocId
    ? allDocs.find((doc) => doc.id === selectedDocId)
    : null;

  if (workerDocsTitle) {
    workerDocsTitle.textContent = selectedDoc
      ? `${selectedDoc.name} - ${selectedDoc.expiry}`
      : worker.name;
  }

  const docs = selectedDoc ? [selectedDoc] : allDocs;

  workerDocsList.innerHTML = docs
    .map(
      (doc) => `
        <article class="doc-card">
          <div>
            <strong>${doc.name}</strong>
            <span>תוקף: ${doc.expiry}</span>
          </div>
          <div class="doc-card-actions">
            <span class="status-chip ${doc.className}">${doc.status}</span>
            ${doc.url ? `<button class="ghost-button doc-open-button" type="button" data-doc-id="${doc.id}">פתח קובץ</button>` : ""}
          </div>
        </article>
      `
    )
    .join("");

  workerDocsList.querySelectorAll("[data-doc-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const documentId = button.getAttribute("data-doc-id") ?? "";
      const selectedDocument = docs.find((item) => item.id === documentId);

      if (selectedDocument) {
        openWorkerDocument(selectedDocument);
      }
    });
  });

  workerDocsModal.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function refreshWorkerDocumentSelect(worker, select, selectedValue = "") {
  if (!select) {
    return;
  }

  select.innerHTML = `
    <option value="">בחר מסמך לפתיחה</option>
    ${getSavedWorkerDocuments(worker)
      .map((doc) => `<option value="${doc.id}">${doc.name} - ${doc.status} - ${doc.expiry}</option>`)
      .join("")}
  `;

  if (selectedValue) {
    select.value = selectedValue;
  }
}

async function refreshWorkerDocumentsFromCloud(worker, select, selectedValue = "") {
  const refreshId = ++workerDocumentRefreshToken;
  await syncWorkerDocumentsFromCloud(worker);

  if (refreshId !== workerDocumentRefreshToken) {
    return;
  }

  refreshWorkerDocumentSelect(worker, select, selectedValue);
}

function closeWorkerDocs() {
  workerDocsModal?.classList.remove("is-open");
  document.body.style.overflow = "";
}

workerDocsClose?.addEventListener("click", closeWorkerDocs);

workerDocsModal?.addEventListener("click", (event) => {
  if (event.target === workerDocsModal) {
    closeWorkerDocs();
  }
});

workerDocsScan?.addEventListener("click", () => {
  closeWorkerDocs();
  selectedWorkerPanel?.querySelector("[data-worker-doc-file]")?.click();
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
          <span>מסמכים שמורים</span>
          <select data-worker-doc-select>
            <option value="">בחר מסמך לפתיחה</option>
          </select>
        </label>
      </div>
      <input class="sr-only" type="file" accept="image/*,.pdf" capture="environment" data-worker-doc-file />
      <div class="selected-worker-actions">
        <button class="ghost-button" type="button" data-worker-docs>מסמכי עובד</button>
        <button class="ghost-button" type="button" data-scan-worker-doc>סרוק/צלם מסמך</button>
        <button class="primary-button" type="button" data-add-worker-today>הוסף ליומן היום</button>
      </div>
    </article>
  `;

  const docSelect = selectedWorkerPanel.querySelector("[data-worker-doc-select]");
  const docFile = selectedWorkerPanel.querySelector("[data-worker-doc-file]");
  let selectedDocText = "מסמכים במאגר";

  refreshWorkerDocumentSelect(worker, docSelect);
  refreshWorkerDocumentsFromCloud(worker, docSelect);

  docSelect?.addEventListener("change", () => {
    if (!docSelect.value) {
      selectedDocText = "מסמכים במאגר";
      return;
    }

    const selectedOption = docSelect.selectedOptions?.[0];
    selectedDocText = selectedOption?.textContent?.split(" - ")[0] || "מסמך עובד";
    openWorkerDocs(worker, docSelect.value);
  });

  docFile?.addEventListener("change", async () => {
    const fileName = docFile.files?.[0]?.name;

    if (!fileName) {
      return;
    }

    const scanButton = selectedWorkerPanel.querySelector("[data-scan-worker-doc]");
    const originalLabel = scanButton?.textContent ?? "סרוק/צלם מסמך";
    const selectedOption = docSelect?.selectedOptions?.[0];
    const selectedDocumentName = selectedOption?.textContent?.split(" - ")[0]?.trim();
    const documentType = selectedDocumentName || "מסמך עובד";

    if (scanButton) {
      scanButton.textContent = "מעלה לענן...";
      scanButton.disabled = true;
    }

    try {
      const result = await uploadWorkerDocumentToCloud(worker, docFile.files[0], documentType);

      if (result.ok) {
        selectedDocText = result.record.documentType;
        refreshWorkerDocumentSelect(worker, docSelect, result.record.id);
        if (scanButton) {
          scanButton.textContent = "נשמר בענן";
        }
      } else if (scanButton) {
        selectedDocText = fileName;
        scanButton.textContent = "ענן לא מחובר";
        window.setTimeout(() => {
          scanButton.textContent = originalLabel;
        }, 2200);
        window.alert(result.message);
      }
    } catch (error) {
      selectedDocText = fileName;
      if (scanButton) {
        scanButton.textContent = "שמירה נכשלה";
        window.setTimeout(() => {
          scanButton.textContent = originalLabel;
        }, 2200);
      }
      window.alert("שמירת המסמך בענן נכשלה. בדוק חיבור ו-Firebase.");
    } finally {
      if (scanButton) {
        scanButton.disabled = false;
        if (scanButton.textContent === "נשמר בענן") {
          window.setTimeout(() => {
            scanButton.textContent = originalLabel;
          }, 1800);
        }
      }
    }
  });

  selectedWorkerPanel.querySelector("[data-scan-worker-doc]")?.addEventListener("click", () => {
    docFile?.click();
  });

  selectedWorkerPanel.querySelector("[data-worker-docs]")?.addEventListener("click", () => {
    openWorkerDocs(worker);
  });

  selectedWorkerPanel.querySelector("[data-add-worker-today]")?.addEventListener("click", () => {
    addWorkerToToday(worker, "תקין", docFile?.files?.[0]?.name ?? selectedDocText);
    selectedWorkerPanel.classList.remove("is-open");
    selectedWorkerPanel.innerHTML = "";
    workerSearch.value = "";
  });
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
