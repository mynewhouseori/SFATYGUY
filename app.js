const STORAGE_KEY = "safety-field-general-defaults";
const DAILY_WORKERS_KEY = "safety-field-daily-workers";
const CLOUD_DOCUMENTS_KEY = "safety-field-cloud-documents";
const WORKER_REGISTRY_KEY = "safety-field-worker-registry";
const DAILY_WORKFORCE_COLLECTION = "safety_daily_workforce";
const CLOUD_DOCUMENTS_COLLECTION = "safety_worker_documents";
const CLOUD_DOCUMENT_CHUNKS_COLLECTION = "safety_worker_document_chunks";
const WORKER_REGISTRY_COLLECTION = "safety_worker_registry";
const FIRESTORE_PAYLOAD_CHUNK_SIZE = 180000;
const MAX_DOCUMENT_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_WORKER_DOCUMENTS = [
  "\u05EA\u05E2\u05D5\u05D3\u05EA \u05D6\u05D4\u05D5\u05EA",
  "\u05E8\u05E9\u05D9\u05D5\u05DF \u05E0\u05D4\u05D9\u05D2\u05D4",
  "\u05D0\u05D9\u05E9\u05D5\u05E8 \u05E2\u05D1\u05D5\u05D3\u05D4 \u05D1\u05D2\u05D5\u05D1\u05D4",
];
const FIREBASE_STORAGE_CONFIG = {
  apiKey: "AIzaSyCba5FEsy3WlrrkzjXFPZrKyW9nXsdZ5l4",
  authDomain: "nfc-demo-91f72.firebaseapp.com",
  projectId: "nfc-demo-91f72",
  storageBucket: "nfc-demo-91f72.firebasestorage.app",
  messagingSenderId: "1097334929129",
  appId: "1:1097334929129:web:73ee3cc80f0b86572d2278",
};
let workerDocumentRefreshToken = 0;
let dailyWorkforceLoadToken = 0;
let dailyWorkersSaveTimeout = null;
let workerRegistryLoadToken = 0;
const workerDocumentUrlCache = new Map();
const pendingWorkerModalDocuments = new Map();

const enterButton = document.getElementById("enterButton");
const continueButton = document.getElementById("continueButton");
const detailsForm = document.getElementById("detailsForm");
const formNote = document.getElementById("formNote");
const workerModal = document.getElementById("workerModal");
const openWorkerModal = document.getElementById("openWorkerModal");
const closeWorkerModal = document.getElementById("closeWorkerModal");
const closeWorkerModalFooter = document.getElementById("closeWorkerModalFooter");
const workerModalDocumentRows = Array.from(document.querySelectorAll("[data-worker-modal-doc]"));
const newWorkerNameInput = document.getElementById("newWorkerName");
const newWorkerIdInput = document.getElementById("newWorkerId");
const newWorkerPhoneInput = document.getElementById("newWorkerPhone");
const newWorkerContractorInput = document.getElementById("newWorkerContractor");
const saveWorkerModalButton = document.getElementById("saveWorkerModalButton");
const workerPickerTrigger = document.getElementById("workerPickerTrigger");
const reportStatusSelect = document.getElementById("reportStatusSelect");
const reportStatusTrigger = document.getElementById("reportStatusTrigger");
const reportStatusMenu = document.getElementById("reportStatusMenu");
const workerSearch = document.getElementById("workerSearch");
const workerSuggestions = document.getElementById("workerSuggestions");
const selectedWorkerPanel = document.getElementById("selectedWorkerPanel");
const workerList = document.querySelector(".worker-list");
const workerCountValue = document.getElementById("workerCountValue");
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

const seedWorkerDatabase = [
  { name: "\u05D9\u05D5\u05E1\u05D9 \u05DB\u05D4\u05DF", id: "123456789", role: "\u05D1\u05E8\u05D6\u05DC\u05DF", contractor: "\u05D0\u05D5\u05E8 \u05E4\u05DC\u05D3\u05D4", status: "\u05DB\u05D1\u05E8 \u05D1\u05D9\u05D5\u05DE\u05DF \u05D4\u05D9\u05D5\u05DD" },
  { name: "\u05D0\u05DE\u05D9\u05E8 \u05DC\u05D5\u05D9", id: "234567891", role: "\u05D8\u05E4\u05E1\u05DF", contractor: "\u05D0\u05DC\u05E4\u05D0 \u05D1\u05D9\u05E6\u05D5\u05E2", status: "\u05DB\u05D1\u05E8 \u05D1\u05D9\u05D5\u05DE\u05DF \u05D4\u05D9\u05D5\u05DD" },
  { name: "\u05DE\u05D5\u05D7\u05DE\u05D3 \u05E1\u05D0\u05DC\u05D7", id: "345678912", role: "\u05DE\u05E4\u05E2\u05D9\u05DC \u05E6\u05D9\u05D5\u05D3", contractor: "\u05E6\u05D9\u05D5\u05D3 \u05D3\u05E8\u05D5\u05DD", status: "\u05D1\u05DE\u05D0\u05D2\u05E8" },
  { name: "\u05E9\u05DC\u05D5\u05DE\u05D9 \u05D3\u05D3\u05D5\u05DF", id: "456789123", role: "\u05E8\u05EA\u05DA", contractor: "\u05D0\u05DC\u05E4\u05D0 \u05D1\u05D9\u05E6\u05D5\u05E2", status: "\u05D1\u05DE\u05D0\u05D2\u05E8" },
  { name: "\u05E8\u05D0\u05DE\u05D9 \u05D7\u05D8\u05D9\u05D1", id: "567891234", role: "\u05DE\u05E4\u05E2\u05D9\u05DC \u05E6\u05D9\u05D5\u05D3", contractor: "\u05E6\u05D9\u05D5\u05D3 \u05D3\u05E8\u05D5\u05DD", status: "\u05D1\u05DE\u05D0\u05D2\u05E8" },
  { name: "\u05D9\u05E2\u05E7\u05D1 \u05D0\u05D1\u05D5 \u05E2\u05D5\u05D3\u05D4", id: "678912345", role: "\u05D1\u05E0\u05D0\u05D9", contractor: "\u05D1\u05E0\u05D9\u05D9\u05D4 \u05D3\u05E8\u05D5\u05DD", status: "\u05D1\u05DE\u05D0\u05D2\u05E8" },
  { name: "\u05D0\u05D9\u05D4\u05D0\u05D1 \u05DB\u05D0\u05E1\u05DD", id: "789123456", role: "\u05D7\u05E9\u05DE\u05DC\u05D0\u05D9", contractor: "\u05DB\u05D1\u05DC\u05D9\u05DD \u05D5\u05D7\u05E9\u05DE\u05DC", status: "\u05D1\u05DE\u05D0\u05D2\u05E8" },
  { name: "\u05DE\u05D5\u05E1\u05D8\u05E4\u05D0 \u05D7\u05DE\u05D3\u05D0\u05DF", id: "891234567", role: "\u05D0\u05D9\u05E0\u05E1\u05D8\u05DC\u05D8\u05D5\u05E8", contractor: "\u05DE\u05D9\u05D9\u05DD \u05D5\u05E6\u05E0\u05E8\u05EA", status: "\u05D1\u05DE\u05D0\u05D2\u05E8" },
  { name: "\u05D7\u05D0\u05DC\u05D3 \u05E1\u05E2\u05D9\u05D3", id: "912345678", role: "\u05E2\u05D5\u05D1\u05D3 \u05E4\u05D9\u05D2\u05D5\u05DE\u05D9\u05DD", contractor: "\u05E4\u05D9\u05D2\u05D5\u05DD \u05E4\u05DC\u05D5\u05E1", status: "\u05D1\u05DE\u05D0\u05D2\u05E8" },
  { name: "\u05E8\u05D0\u05E9\u05D3 \u05DE\u05E0\u05E1\u05D5\u05E8", id: "112233445", role: "\u05E2\u05D5\u05D1\u05D3 \u05D2\u05DE\u05E8", contractor: "\u05D2\u05DE\u05E8 \u05E4\u05E8\u05D9\u05DE\u05D9\u05D5\u05DD", status: "\u05D1\u05DE\u05D0\u05D2\u05E8" },
  { name: "\u05E1\u05D0\u05DE\u05D9 \u05D2'\u05D1\u05E8\u05D9\u05DF", id: "223344556", role: "\u05E2\u05D5\u05D1\u05D3 \u05D2\u05DE\u05E8", contractor: "\u05D2\u05DE\u05E8 \u05E4\u05E8\u05D9\u05DE\u05D9\u05D5\u05DD", status: "\u05D1\u05DE\u05D0\u05D2\u05E8" },
  { name: "\u05E4\u05D0\u05D3\u05D9 \u05E0\u05E6\u05D0\u05E8", id: "334455667", role: "\u05D8\u05D9\u05D9\u05D7", contractor: "\u05D8\u05D9\u05D9\u05D7 \u05D5\u05E6\u05D1\u05E2 \u05E9\u05E8\u05D5\u05DF", status: "\u05D1\u05DE\u05D0\u05D2\u05E8" },
  { name: "\u05DE\u05D5\u05D0\u05DE\u05DF \u05D7\u05D1\u05D9\u05D1", id: "445566778", role: "\u05E8\u05E6\u05E3", contractor: "\u05D8\u05D9\u05D9\u05D7 \u05D5\u05E6\u05D1\u05E2 \u05E9\u05E8\u05D5\u05DF", status: "\u05D1\u05DE\u05D0\u05D2\u05E8" },
  { name: "\u05E2\u05D5\u05DE\u05E8 \u05D3\u05E8\u05D0\u05D5\u05D5\u05E9\u05D4", id: "556677889", role: "\u05DE\u05E4\u05E2\u05D9\u05DC \u05DE\u05DC\u05D2\u05D6\u05D4", contractor: "\u05D4\u05E8\u05DE\u05D4 \u05D5\u05E9\u05D9\u05E0\u05D5\u05E2", status: "\u05D1\u05DE\u05D0\u05D2\u05E8" },
  { name: "\u05D0\u05D7\u05DE\u05D3 \u05E2\u05D1\u05D3 \u05D0\u05DC\u05DC\u05D4", id: "667788990", role: "\u05E2\u05D5\u05D1\u05D3 \u05DB\u05DC\u05DC\u05D9", contractor: "\u05D1\u05E0\u05D9\u05D9\u05D4 \u05D3\u05E8\u05D5\u05DD", status: "\u05D1\u05DE\u05D0\u05D2\u05E8" },
];
const workerDatabase = [...seedWorkerDatabase];
const DEFAULT_WORKDAY_START = "07:00";
const DEFAULT_WORKDAY_END = "17:00";
const selectedWorkerIds = new Set();
const initialTodayWorkers = [];

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

function loadDailyWorkersStore() {
  try {
    const stored = window.localStorage.getItem(DAILY_WORKERS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveDailyWorkersStore(store) {
  window.localStorage.setItem(DAILY_WORKERS_KEY, JSON.stringify(store));
}

function loadWorkerRegistryStore() {
  try {
    const stored = window.localStorage.getItem(WORKER_REGISTRY_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveWorkerRegistryStore(store) {
  window.localStorage.setItem(WORKER_REGISTRY_KEY, JSON.stringify(store));
}

function getWorkerRegistrySiteName() {
  return fields.siteName?.value?.trim() || "";
}

function sanitizeWorkerRecord(record) {
  const name = String(record?.name || "").trim();
  const id = String(record?.id || "").trim();

  if (!name || !id) {
    return null;
  }

  return {
    name,
    id,
    phone: String(record?.phone || "").trim(),
    role: String(record?.role || "\u05E2\u05D5\u05D1\u05D3 \u05DB\u05DC\u05DC\u05D9").trim() || "\u05E2\u05D5\u05D1\u05D3 \u05DB\u05DC\u05DC\u05D9",
    contractor:
      String(record?.contractor || "").trim() ||
      fields.contractorName?.value?.trim() ||
      "\u05DC\u05DC\u05D0 \u05E7\u05D1\u05DC\u05DF",
    status: "\u05D1\u05DE\u05D0\u05D2\u05E8",
    defaultStartTime: String(record?.defaultStartTime || DEFAULT_WORKDAY_START).trim() || DEFAULT_WORKDAY_START,
    defaultEndTime: String(record?.defaultEndTime || DEFAULT_WORKDAY_END).trim() || DEFAULT_WORKDAY_END,
    siteName: String(record?.siteName || getWorkerRegistrySiteName()).trim(),
    createdAt: String(record?.createdAt || new Date().toISOString()),
  };
}

function mergeWorkerRecords(records = []) {
  const byId = new Map();
  [...seedWorkerDatabase, ...records]
    .map(sanitizeWorkerRecord)
    .filter(Boolean)
    .forEach((worker) => {
      const existing = byId.get(worker.id) || {};
      byId.set(worker.id, { ...existing, ...worker });
    });

  workerDatabase.length = 0;
  workerDatabase.push(...Array.from(byId.values()));
}

function getStoredWorkersForCurrentSite() {
  const siteName = getWorkerRegistrySiteName();
  const store = loadWorkerRegistryStore();
  return Array.isArray(store[siteName]?.workers) ? store[siteName].workers : [];
}

function saveStoredWorkersForCurrentSite(workers) {
  const siteName = getWorkerRegistrySiteName();

  if (!siteName) {
    return;
  }

  const store = loadWorkerRegistryStore();
  store[siteName] = { workers };
  saveWorkerRegistryStore(store);
}

function buildWorkerRegistryDocumentId(workerId, siteName = getWorkerRegistrySiteName()) {
  return `${sanitizePathSegment(siteName || "site")}_${sanitizePathSegment(workerId || "worker")}`;
}

async function saveWorkerToCloud(worker) {
  const firestore = getFirebaseFirestore();
  const siteName = getWorkerRegistrySiteName();

  if (!firestore || !siteName) {
    return false;
  }

  const payload = sanitizeWorkerRecord({ ...worker, siteName });

  if (!payload) {
    return false;
  }

  await firestore.collection(WORKER_REGISTRY_COLLECTION).doc(buildWorkerRegistryDocumentId(payload.id, siteName)).set(payload);
  return true;
}

async function loadWorkersFromCloud() {
  const firestore = getFirebaseFirestore();
  const siteName = getWorkerRegistrySiteName();

  if (!firestore || !siteName) {
    return null;
  }

  const snapshot = await firestore.collection(WORKER_REGISTRY_COLLECTION).where("siteName", "==", siteName).get();
  return snapshot.docs.map((doc) => sanitizeWorkerRecord(doc.data())).filter(Boolean);
}

async function loadWorkerRegistryForCurrentSite() {
  const siteName = getWorkerRegistrySiteName();
  const loadToken = ++workerRegistryLoadToken;

  if (!siteName) {
    mergeWorkerRecords([]);
    return;
  }

  let workers = getStoredWorkersForCurrentSite();

  try {
    const cloudWorkers = await loadWorkersFromCloud();
    if (loadToken !== workerRegistryLoadToken) {
      return;
    }
    if (Array.isArray(cloudWorkers)) {
      workers = cloudWorkers;
      saveStoredWorkersForCurrentSite(cloudWorkers);
    }
  } catch {
    if (loadToken !== workerRegistryLoadToken) {
      return;
    }
  }

  mergeWorkerRecords(workers);
}

function getCurrentDateStorageKey() {
  return normalizeDateValue(fields.workDate?.value || getTodayValue());
}

function getDailyWorkforceSiteName() {
  return fields.siteName?.value?.trim() || "";
}

function buildDailyWorkforceDocumentId(dateKey = getCurrentDateStorageKey(), siteName = getDailyWorkforceSiteName()) {
  return `${sanitizePathSegment(siteName || "site")}_${dateKey || normalizeDateValue(getTodayValue())}`;
}

async function saveDailyWorkersToCloud(dateKey, workers) {
  const firestore = getFirebaseFirestore();
  const siteName = getDailyWorkforceSiteName();

  if (!firestore || !siteName) {
    return false;
  }

  const documentId = buildDailyWorkforceDocumentId(dateKey, siteName);
  await firestore.collection(DAILY_WORKFORCE_COLLECTION).doc(documentId).set({
    id: documentId,
    siteName,
    dateKey,
    workers,
    updatedAt: new Date().toISOString(),
  });
  return true;
}

async function loadDailyWorkersFromCloud(dateKey) {
  const firestore = getFirebaseFirestore();
  const siteName = getDailyWorkforceSiteName();

  if (!firestore || !siteName) {
    return null;
  }

  const snapshot = await firestore
    .collection(DAILY_WORKFORCE_COLLECTION)
    .doc(buildDailyWorkforceDocumentId(dateKey, siteName))
    .get();

  if (!snapshot.exists) {
    return [];
  }

  const payload = snapshot.data();
  return Array.isArray(payload?.workers) ? payload.workers : [];
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

function getFirebaseStorage() {
  if (!window.firebase?.apps || !window.firebase?.storage) {
    return null;
  }

  const app = window.firebase.apps.length
    ? window.firebase.app()
    : window.firebase.initializeApp(getFirebaseConfig());

  return window.firebase.storage(app);
}

function withTimeout(promise, timeoutMs, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

function buildWorkerDocumentViewerHtml(documentUrl, mimeType = "", fileName = "") {
  const safeTitle = String(fileName || "מסמך עובד").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const isImage = String(mimeType).startsWith("image/");
  const isPdf = String(mimeType).includes("pdf") || String(documentUrl).startsWith("data:application/pdf");
  const viewerBody = isImage
    ? `<div class="viewer-image-wrap"><img class="viewer-image" src="${documentUrl}" alt="${safeTitle}" /></div>`
    : isPdf
      ? `<iframe src="${documentUrl}" title="${safeTitle}" style="width:100%;height:100%;border:0;"></iframe>`
      : `<iframe src="${documentUrl}" title="${safeTitle}" style="width:100%;height:100%;border:0;"></iframe>`;

  return `<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <style>
      html, body { margin: 0; height: 100%; background: #0f1d22; color: #f8f4eb; font-family: Heebo, sans-serif; }
      .viewer-shell { height: 100%; display: grid; grid-template-rows: auto 1fr; }
      .viewer-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 18px; background: rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.12); }
      .viewer-name { font-size: 16px; font-weight: 700; }
      .viewer-frame { height: 100%; padding: 16px; overflow: auto; }
      .viewer-frame iframe { background: #ffffff; }
      .viewer-image-wrap { width: 100%; min-height: 100%; display: flex; align-items: flex-start; justify-content: center; }
      .viewer-image { width: 100%; max-width: 100%; height: auto; display: block; margin: 0 auto; border-radius: 18px; }
      .viewer-actions { display: flex; align-items: center; gap: 10px; }
      .viewer-share { color: #fff4e6; background: transparent; border: 1px solid rgba(209,138,58,0.45); padding: 8px 12px; border-radius: 999px; font: inherit; cursor: pointer; }
      .viewer-share:hover { background: rgba(209,138,58,0.18); }
      @media (max-width: 720px) {
        .viewer-bar { padding: 12px 14px; }
        .viewer-name { font-size: 14px; max-width: 55vw; word-break: break-word; }
        .viewer-frame { padding: 0; }
        .viewer-image-wrap { padding: 10px 0 20px; }
        .viewer-image { width: 100vw; max-width: 100vw; border-radius: 0; }
      }
    </style>
  </head>
  <body>
    <div class="viewer-shell">
      <div class="viewer-bar">
        <div class="viewer-name">${safeTitle}</div>
        <div class="viewer-actions">
          <button class="viewer-share" type="button" id="viewerShare">שתף</button>
        </div>
      </div>
      <div class="viewer-frame">${viewerBody}</div>
    </div>
    <script>
      const shareButton = document.getElementById("viewerShare");
      const shareUrl = ${JSON.stringify(documentUrl)};
      const shareTitle = ${JSON.stringify(fileName || "מסמך עובד")};

      shareButton?.addEventListener("click", async () => {
        try {
          if (navigator.share) {
            await navigator.share({ title: shareTitle, url: shareUrl });
            return;
          }

          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(shareUrl);
            shareButton.textContent = "הקישור הועתק";
            window.setTimeout(() => {
              shareButton.textContent = "שתף";
            }, 1800);
            return;
          }

          window.open(shareUrl, "_blank", "noopener,noreferrer");
        } catch {
          shareButton.textContent = "שיתוף נכשל";
          window.setTimeout(() => {
            shareButton.textContent = "שתף";
          }, 1800);
        }
      });
    </script>
  </body>
</html>`;
}

function createViewerPageUrl(viewerHtml) {
  const viewerBlob = new Blob([viewerHtml], { type: "text/html;charset=utf-8" });
  return URL.createObjectURL(viewerBlob);
}

async function prepareDocumentViewerSource(doc, documentUrl) {
  if (/^data:|^blob:/i.test(String(documentUrl))) {
    return {
      url: documentUrl,
      mimeType: doc.mimeType || "",
    };
  }

  const response = await withTimeout(
    fetch(documentUrl),
    25000,
    "הורדת המסמך ארכה יותר מדי זמן. נסה שוב."
  );

  if (!response.ok) {
    throw new Error("טעינת המסמך נכשלה.");
  }

  const blob = await response.blob();
  return {
    url: URL.createObjectURL(blob),
    mimeType: blob.type || doc.mimeType || "",
  };
}

function loadCloudDocuments() {
  try {
    const stored = window.localStorage.getItem(CLOUD_DOCUMENTS_KEY);
    return stored
      ? JSON.parse(stored)
          .map(sanitizeCloudDocumentRecord)
          .filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function normalizeWorkerDocumentName(name = "") {
  const normalized = String(name).trim();

  if (
    normalized.includes("\u05EA\u05E2\u05D5\u05D3\u05EA") &&
    normalized.includes("\u05D6\u05D4\u05D5\u05EA")
  ) {
    return "\u05EA\u05E2\u05D5\u05D3\u05EA \u05D6\u05D4\u05D5\u05EA";
  }

  if (
    normalized.includes("\u05E8\u05E9\u05D9\u05D5\u05DF") ||
    normalized.includes("\u05E8\u05D9\u05E9\u05D9\u05D5\u05DF") ||
    normalized.includes("\u05E0\u05D4\u05D9\u05D2\u05D4")
  ) {
    return "\u05E8\u05E9\u05D9\u05D5\u05DF \u05E0\u05D4\u05D9\u05D2\u05D4";
  }

  if (
    normalized.includes("\u05E2\u05D1\u05D5\u05D3\u05D4") &&
    normalized.includes("\u05D2\u05D5\u05D1\u05D4")
  ) {
    return "\u05D0\u05D9\u05E9\u05D5\u05E8 \u05E2\u05D1\u05D5\u05D3\u05D4 \u05D1\u05D2\u05D5\u05D1\u05D4";
  }

  return "";
}

function sanitizeCloudDocumentRecord(record) {
  if (!record || typeof record !== "object") {
    return null;
  }

  const documentType = normalizeWorkerDocumentName(record.documentType);

  if (!documentType || !ALLOWED_WORKER_DOCUMENTS.includes(documentType)) {
    return null;
  }

  return {
    ...record,
    documentType,
  };
}

function saveCloudDocumentRecord(record) {
  const sanitizedRecord = sanitizeCloudDocumentRecord(record);

  if (!sanitizedRecord) {
    return;
  }

  const records = loadCloudDocuments().filter((item) => item.id !== sanitizedRecord.id);
  records.unshift(sanitizedRecord);
  window.localStorage.setItem(CLOUD_DOCUMENTS_KEY, JSON.stringify(records.slice(0, 120)));
}

function saveCloudDocumentRecords(recordsToMerge) {
  const existing = loadCloudDocuments();
  const byId = new Map(existing.map((item) => [item.id, item]));
  recordsToMerge
    .map(sanitizeCloudDocumentRecord)
    .filter(Boolean)
    .forEach((item) => byId.set(item.id, item));
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
      status: "\u05E0\u05E9\u05DE\u05E8 \u05D1\u05E2\u05E0\u05DF",
      expiry: doc.savedAtDisplay,
      savedAt: doc.savedAt || "",
      className: "ok",
      url: doc.publicUrl || doc.previewUrl || (doc.storageMode === "firestore-chunked" ? "cloud:" + doc.id : ""),
      cloudPath: doc.path,
      storageMode: doc.storageMode || "firestore",
      chunkCount: doc.chunkCount || 0,
      mimeType: doc.mimeType || "",
      fileName: doc.fileName || "",
    }));
}

function getLatestCloudDocumentsByType(worker) {
  const latestByType = new Map();

  getCloudDocumentsForWorker(worker).forEach((doc) => {
    const existing = latestByType.get(doc.name);

    if (!existing) {
      latestByType.set(doc.name, doc);
      return;
    }

    const existingStamp = String(existing.savedAt || "");
    const nextStamp = String(doc.savedAt || "");

    if (nextStamp >= existingStamp) {
      latestByType.set(doc.name, doc);
    }
  });

  return latestByType;
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
    return { ok: false, message: "׳׳ ׳ ׳‘׳—׳¨ ׳§׳•׳‘׳¥." };
  }

  const now = new Date();
  const normalizedDocumentType = normalizeWorkerDocumentName(documentType) || ALLOWED_WORKER_DOCUMENTS[0];

  try {
    return await withTimeout(
      uploadWorkerDocumentToStorage(worker, file, normalizedDocumentType, now),
      25000,
      "העלאת המסמך ארכה יותר מדי זמן. נסה שוב."
    );
  } catch (storageError) {
    try {
      return await withTimeout(
        uploadWorkerDocumentToFirestore(worker, file, normalizedDocumentType, now),
        25000,
        "שמירת המסמך נכשלה בזמן ההמתנה לענן."
      );
    } catch (firestoreError) {
      return {
        ok: false,
        message: firestoreError?.message || storageError?.message || "שמירת המסמך נכשלה.",
      };
    }
  }
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("׳§׳¨׳™׳׳× ׳”׳§׳•׳‘׳¥ ׳ ׳›׳©׳׳”."));
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
  if (doc.url && /^(https?:|data:|blob:)/i.test(String(doc.url))) {
    return doc.url;
  }

  if (workerDocumentUrlCache.has(doc.id)) {
    return workerDocumentUrlCache.get(doc.id);
  }

  const firestore = getFirebaseFirestore();

  if (!firestore) {
    throw new Error("Firebase Firestore is not available.");
  }

  if (doc.storageMode === "firebase-storage") {
    const storage = getFirebaseStorage();

    if (!storage || !doc.cloudPath) {
      throw new Error("קישור המסמך בענן אינו זמין.");
    }

    const downloadUrl = await storage.ref(doc.cloudPath).getDownloadURL();

    if (!downloadUrl) {
      throw new Error("לא התקבל קישור תקין למסמך.");
    }

    workerDocumentUrlCache.set(doc.id, downloadUrl);
    return downloadUrl;
  }

  if (doc.storageMode === "firestore-chunked") {
    const payload = await loadChunkedDocumentPayload(firestore, doc.id);
    workerDocumentUrlCache.set(doc.id, payload);
    return payload;
  }

  if (doc.storageMode === "firestore" && doc.url) {
    workerDocumentUrlCache.set(doc.id, doc.url);
    return doc.url;
  }

  throw new Error("Document URL is not available.");
}

async function openWorkerDocument(doc) {
  let previewWindow = null;

  try {
    previewWindow = window.open("", "_blank");
  } catch {
    previewWindow = null;
  }

  try {
    const documentUrl = await resolveWorkerDocumentUrl(doc);

    if (!documentUrl) {
      throw new Error("לא נמצא קישור תקין למסמך.");
    }

    const viewerSource = await prepareDocumentViewerSource(doc, documentUrl);
    const viewerHtml = buildWorkerDocumentViewerHtml(
      viewerSource.url,
      viewerSource.mimeType || doc.mimeType || "",
      doc.fileName || doc.name || "מסמך עובד"
    );
    const viewerPageUrl = createViewerPageUrl(viewerHtml);

    if (previewWindow && !previewWindow.closed) {
      previewWindow.location.replace(viewerPageUrl);
      return;
    }

    const viewerTab = window.open(viewerPageUrl, "_blank");

    if (!viewerTab) {
      throw new Error("הדפדפן חסם את פתיחת המסמך.");
    }
  } catch (error) {
    if (previewWindow && !previewWindow.closed) {
      previewWindow.close();
    }
    window.alert(error?.message || "Opening the document failed.");
  }
}

async function uploadWorkerDocumentToStorage(worker, file, documentType, now = new Date()) {
  const storage = getFirebaseStorage();
  const firestore = getFirebaseFirestore();

  if (!storage || !firestore) {
    throw new Error("חיבור הענן למסמכים אינו זמין כרגע.");
  }

  const safeSite = sanitizePathSegment(getActiveSiteName());
  const safeWorker = sanitizePathSegment(worker.name);
  const safeDoc = sanitizePathSegment(documentType);
  const safeFileName = sanitizePathSegment(file.name || `${safeDoc}.bin`);
  const objectPath = `worker-documents/${safeSite}/${safeWorker}/${safeDoc}/${Date.now()}-${safeFileName}`;
  const storageRef = storage.ref(objectPath);
  const metadata = {
    contentType: file.type || "application/octet-stream",
    customMetadata: {
      workerId: worker.id,
      workerName: worker.name,
      documentType,
    },
  };

  await storageRef.put(file, metadata);
  const publicUrl = await storageRef.getDownloadURL();

  const docRef = firestore.collection(CLOUD_DOCUMENTS_COLLECTION).doc();
  const record = buildCloudDocumentRecord(worker, file, documentType, objectPath, publicUrl, now);
  record.id = docRef.id;
  record.storageMode = "firebase-storage";
  record.chunkCount = 1;
  record.mimeType = file.type || "application/octet-stream";

  await docRef.set(record);
  saveCloudDocumentRecord(record);
  return { ok: true, record };
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
    documentType: normalizeWorkerDocumentName(documentType) || ALLOWED_WORKER_DOCUMENTS[0],
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
  loadDailyWorkersForCurrentDate();
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

navigateTo("loginView");

function resetErrorState() {
  formNote.classList.remove("is-error");
  formNote.textContent =
    "׳”׳₪׳¨׳˜׳™׳ ׳™׳™׳©׳׳¨׳• ׳›׳‘׳¨׳™׳¨׳× ׳׳—׳“׳ ׳׳׳›׳©׳™׳¨ ׳”׳–׳”. ׳׳× ׳”׳×׳׳¨׳™׳ ׳×׳‘׳—׳¨ ׳׳—׳“׳© ׳‘׳›׳ ׳₪׳¢׳.";
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
    formNote.textContent = "׳™׳© ׳׳׳׳ ׳׳× ׳›׳ ׳©׳“׳•׳× ׳”׳—׳•׳‘׳” ׳׳₪׳ ׳™ ׳©׳׳׳©׳™׳›׳™׳.";
    return;
  }

  animateButton(continueButton);
  saveDefaults();
  formNote.textContent = "׳”׳₪׳¨׳˜׳™׳ ׳ ׳©׳׳¨׳•. ׳׳₪׳©׳¨ ׳׳”׳׳©׳™׳ ׳׳׳™׳׳•׳™ ׳”׳™׳•׳׳.";

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
    const currentCard = button.closest(".worker-card");

    if (!currentCard) {
      return;
    }

    const willOpen = !currentCard.classList.contains("is-open");
    workerList?.querySelectorAll(".worker-card.is-open").forEach((card) => {
      if (card !== currentCard) {
        card.classList.remove("is-open");
      }
    });
    currentCard.classList.toggle("is-open", willOpen);
  });
}

function clearSelectedWorkerPanel() {
  if (!selectedWorkerPanel) {
    return;
  }

  selectedWorkerPanel.classList.remove("is-open");
  selectedWorkerPanel.innerHTML = "";
}

function setWorkerModalDocumentState(row, file = null, source = "") {
  const docType = normalizeWorkerDocumentName(row?.dataset.workerModalDoc || "");
  const status = row?.querySelector("[data-worker-modal-doc-status]");
  const meta = row?.querySelector("[data-worker-modal-doc-meta]");
  const actionButtons = row?.querySelectorAll("[data-worker-modal-doc-action]");

  if (!row || !docType || !status || !meta) {
    return;
  }

  if (!file) {
    pendingWorkerModalDocuments.delete(docType);
    status.className = "status-chip danger worker-doc-missing";
    status.textContent = "\u05DC\u05D0 \u05E6\u05D5\u05E8\u05E3";
    meta.textContent = "";
    actionButtons?.forEach((button) => {
      button.disabled = true;
    });
    return;
  }

  pendingWorkerModalDocuments.set(docType, { file, source });
  status.className = "status-chip ok";
  status.textContent = source === "camera" ? "\u05E6\u05D5\u05DC\u05DD" : "\u05E0\u05D1\u05D7\u05E8";
  meta.textContent = file.name || docType;
  actionButtons?.forEach((button) => {
    button.disabled = false;
  });
}

function getWorkerModalDocumentEntry(row) {
  const docType = normalizeWorkerDocumentName(row?.dataset.workerModalDoc || "");

  if (!docType) {
    return null;
  }

  const entry = pendingWorkerModalDocuments.get(docType);
  return entry?.file ? { docType, file: entry.file, source: entry.source || "" } : null;
}

function openWorkerModalLocalDocument(row) {
  const entry = getWorkerModalDocumentEntry(row);

  if (!entry?.file) {
    return;
  }

  const fileUrl = URL.createObjectURL(entry.file);
  const viewerHtml = buildWorkerDocumentViewerHtml(fileUrl, entry.file.type || "", entry.file.name || entry.docType);
  const viewerPageUrl = createViewerPageUrl(viewerHtml);
  window.open(viewerPageUrl, "_blank", "noopener,noreferrer");
}

function resetWorkerModalDocuments() {
  pendingWorkerModalDocuments.clear();
  workerModalDocumentRows.forEach((row) => {
    row.querySelectorAll("[data-worker-modal-doc-input]").forEach((input) => {
      input.value = "";
    });
    setWorkerModalDocumentState(row);
  });
}

function openWorkerModalPanel() {
  workerModal?.classList.add("is-open");
  document.body.style.overflow = "hidden";
  resetWorkerModalForm();
  resetWorkerModalDocuments();
}

function closeWorkerModalPanel() {
  workerModal?.classList.remove("is-open");
  document.body.style.overflow = "";
}

function resetWorkerModalForm() {
  if (newWorkerNameInput) {
    newWorkerNameInput.value = "";
  }
  if (newWorkerIdInput) {
    newWorkerIdInput.value = "";
  }
  if (newWorkerPhoneInput) {
    newWorkerPhoneInput.value = "";
  }
  if (newWorkerContractorInput) {
    newWorkerContractorInput.value = fields.contractorName?.value?.trim() || "";
  }
  workerModal?.querySelectorAll('[data-clock-trigger][data-time-value]').forEach((button, index) => {
    const value = index === 0 ? DEFAULT_WORKDAY_START : DEFAULT_WORKDAY_END;
    button.dataset.timeValue = value;
    button.textContent = value;
  });
}

function getWorkerModalPayload() {
  const name = newWorkerNameInput?.value?.trim() || "";
  const id = newWorkerIdInput?.value?.trim() || "";

  if (!name || !id) {
    return null;
  }

  const timeButtons = Array.from(workerModal?.querySelectorAll('[data-clock-trigger][data-time-value]') || []);
  return sanitizeWorkerRecord({
    name,
    id,
    phone: newWorkerPhoneInput?.value?.trim() || "",
    contractor: newWorkerContractorInput?.value?.trim() || "",
    role: "\u05E2\u05D5\u05D1\u05D3 \u05DB\u05DC\u05DC\u05D9",
    defaultStartTime: timeButtons[0]?.dataset.timeValue || DEFAULT_WORKDAY_START,
    defaultEndTime: timeButtons[1]?.dataset.timeValue || DEFAULT_WORKDAY_END,
    siteName: getWorkerRegistrySiteName(),
  });
}

async function uploadPendingWorkerModalDocuments(worker) {
  const uploads = Array.from(pendingWorkerModalDocuments.entries());

  for (const [documentType, entry] of uploads) {
    if (!entry?.file) {
      continue;
    }

    await uploadWorkerDocumentToCloud(worker, entry.file, documentType);
  }
}

async function handleSaveWorkerModal() {
  if (!getWorkerRegistrySiteName()) {
    window.alert("\u05D9\u05E9 \u05DC\u05D1\u05D7\u05D5\u05E8 \u05E9\u05DD \u05D0\u05EA\u05E8 \u05DC\u05E4\u05E0\u05D9 \u05E9\u05DE\u05D9\u05E8\u05EA \u05E2\u05D5\u05D1\u05D3 \u05D7\u05D3\u05E9.");
    return;
  }

  const worker = getWorkerModalPayload();

  if (!worker) {
    window.alert("\u05D9\u05E9 \u05DC\u05DE\u05DC\u05D0 \u05DC\u05E4\u05D7\u05D5\u05EA \u05E9\u05DD \u05DE\u05DC\u05D0 \u05D5-\u05EA\"\u05D6.");
    return;
  }

  const existingWorker = workerDatabase.find((entry) => entry.id === worker.id);

  if (existingWorker) {
    window.alert("\u05DB\u05D1\u05E8 \u05E7\u05D9\u05D9\u05DD \u05E2\u05D5\u05D1\u05D3 \u05D1\u05DE\u05D0\u05D2\u05E8 \u05E2\u05DD \u05EA\"\u05D6 \u05D6\u05D4.");
    return;
  }

  const originalLabel = saveWorkerModalButton?.textContent || "";

  if (saveWorkerModalButton) {
    saveWorkerModalButton.disabled = true;
    saveWorkerModalButton.textContent = "\u05E9\u05D5\u05DE\u05E8...";
  }

  try {
    const currentWorkers = getStoredWorkersForCurrentSite().filter((entry) => entry.id !== worker.id);
    currentWorkers.push(worker);
    saveStoredWorkersForCurrentSite(currentWorkers);
    mergeWorkerRecords(currentWorkers);
    await saveWorkerToCloud(worker);
    try {
      await uploadPendingWorkerModalDocuments(worker);
    } catch {
      // Keep the new worker in the registry even if a document upload fails.
    }
    renderWorkerPicker();
    resetWorkerModalDocuments();
    resetWorkerModalForm();
    closeWorkerModalPanel();
  } catch {
    window.alert("\u05E9\u05DE\u05D9\u05E8\u05EA \u05D4\u05E2\u05D5\u05D1\u05D3 \u05E0\u05DB\u05E9\u05DC\u05D4. \u05E0\u05E1\u05D4 \u05E9\u05D5\u05D1.");
  } finally {
    if (saveWorkerModalButton) {
      saveWorkerModalButton.disabled = false;
      saveWorkerModalButton.textContent = originalLabel;
    }
  }
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

openWorkerModal?.addEventListener("click", openWorkerModalPanel);

closeWorkerModal?.addEventListener("click", closeWorkerModalPanel);

closeWorkerModalFooter?.addEventListener("click", closeWorkerModalPanel);
saveWorkerModalButton?.addEventListener("click", () => {
  handleSaveWorkerModal();
});

workerModal?.addEventListener("click", (event) => {
  if (event.target === workerModal) {
    closeWorkerModalPanel();
  }
});

workerModalDocumentRows.forEach((row) => {
  const cameraTrigger = row.querySelector('[data-worker-modal-doc-trigger="camera"]');
  const cameraInput = row.querySelector('[data-worker-modal-doc-input="camera"]');
  const viewButton = row.querySelector('[data-worker-modal-doc-action="view"]');
  const deleteButton = row.querySelector('[data-worker-modal-doc-action="delete"]');

  attachPressFeedback(cameraTrigger);
  attachPressFeedback(viewButton);
  attachPressFeedback(deleteButton);
  setWorkerModalDocumentState(row);

  cameraTrigger?.addEventListener("click", () => {
    cameraInput?.click();
  });

  cameraInput?.addEventListener("change", () => {
    setWorkerModalDocumentState(row, cameraInput.files?.[0] || null, "camera");
  });

  viewButton?.addEventListener("click", () => {
    openWorkerModalLocalDocument(row);
  });

  deleteButton?.addEventListener("click", () => {
    row.querySelectorAll("[data-worker-modal-doc-input]").forEach((input) => {
      input.value = "";
    });
    setWorkerModalDocumentState(row);
  });
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
  const cloudDocsByType = getLatestCloudDocumentsByType(worker);

  return ALLOWED_WORKER_DOCUMENTS.map((documentName) => {
    const cloudDoc = cloudDocsByType.get(documentName);

    if (cloudDoc) {
      return cloudDoc;
    }

    return {
      id: `missing:${documentName}`,
      name: documentName,
      status: "\u05D7\u05E1\u05E8",
      expiry: "\u05E2\u05D3\u05D9\u05D9\u05DF \u05DC\u05D0 \u05E6\u05D5\u05E8\u05E3",
      className: "warning",
      url: "",
      fileName: "",
    };
  });
}

function getSavedWorkerDocuments(worker) {
  return getWorkerDocuments(worker).filter((doc) => Boolean(doc.url));
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
            <span>\u05EA\u05D5\u05E7\u05E3: ${doc.expiry}</span>
          </div>
          <div class="doc-card-actions">
            <span class="status-chip ${doc.className}">${doc.status}</span>
            ${doc.url ? `<button class="ghost-button doc-open-button" type="button" data-doc-id="${doc.id}">\u05E4\u05EA\u05D7 \u05E7\u05D5\u05D1\u05E5</button>` : `<button class="ghost-button doc-open-button" type="button" data-doc-upload="${doc.name}">\u05E6\u05E8\u05E3 \u05DE\u05E1\u05DE\u05DA</button>`}
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

  workerDocsList.querySelectorAll("[data-doc-upload]").forEach((button) => {
    button.addEventListener("click", () => {
      queueWorkerDocumentUpload(button.getAttribute("data-doc-upload") ?? "");
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
    <option value="">בחר מסמך</option>
    ${getWorkerDocuments(worker)
      .map((doc) => `<option value="${doc.name}">${doc.name}</option>`)
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

function queueWorkerDocumentUpload(documentName = "") {
  if (!selectedWorkerPanel) {
    return;
  }

  selectedWorkerPanel.dataset.pendingDocType = documentName;
  closeWorkerDocs();
  selectedWorkerPanel.querySelector("[data-worker-doc-file]")?.click();
}

function attachPressFeedback(button) {
  if (!button) {
    return;
  }

  let releaseTimer = null;
  const clearPressed = () => {
    if (releaseTimer) {
      window.clearTimeout(releaseTimer);
      releaseTimer = null;
    }
    button.classList.remove("is-pressed");
  };
  const scheduleRelease = () => {
    if (releaseTimer) {
      window.clearTimeout(releaseTimer);
    }
    releaseTimer = window.setTimeout(() => {
      button.classList.remove("is-pressed");
      releaseTimer = null;
    }, 180);
  };

  button.addEventListener("pointerdown", () => {
    button.classList.add("is-pressed");
  });
  button.addEventListener("pointerup", scheduleRelease);
  button.addEventListener("pointercancel", clearPressed);
  button.addEventListener("pointerleave", scheduleRelease);
  button.addEventListener("blur", clearPressed);
}

workerDocsClose?.addEventListener("click", closeWorkerDocs);

workerDocsModal?.addEventListener("click", (event) => {
  if (event.target === workerDocsModal) {
    closeWorkerDocs();
  }
});

workerDocsScan?.addEventListener("click", () => {
  queueWorkerDocumentUpload();
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

  if (
    !workerSuggestions?.contains(event.target) &&
    event.target !== workerSearch &&
    event.target !== workerPickerTrigger
  ) {
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
        <span>\u05DC\u05D0 \u05E0\u05DE\u05E6\u05D0 \u05E2\u05D5\u05D1\u05D3 \u05DE\u05EA\u05D0\u05D9\u05DD</span>
        <button class="ghost-button" type="button" id="openWorkerModalFromSearch">+ \u05D4\u05D5\u05E1\u05E3 \u05E2\u05D5\u05D1\u05D3 \u05D7\u05D3\u05E9</button>
      </div>
    `;
    document.getElementById("openWorkerModalFromSearch")?.addEventListener("click", () => {
      openWorkerModalPanel();
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

fields.siteName?.addEventListener("change", () => {
  loadWorkerRegistryForCurrentSite().then(() => {
    renderWorkerPicker();
  });
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
          <span class="mini-label">\u05E2\u05D5\u05D1\u05D3 \u05E0\u05D1\u05D7\u05E8 \u05DE\u05D4\u05DE\u05D0\u05D2\u05E8</span>
          <h3>${worker.name}</h3>
          <p>${worker.role} • ${worker.contractor} • ${worker.status}</p>
        </div>
        <span class="status-chip ok">\u05DE\u05D0\u05D5\u05DE\u05EA</span>
      </div>
      <div class="selected-worker-fields">
        <label class="mini-field">
          <span>\u05E9\u05E2\u05EA \u05D4\u05EA\u05D7\u05DC\u05D4</span>
          <input class="time-input" type="time" value="07:00" />
        </label>
        <label class="mini-field">
          <span>\u05E9\u05E2\u05EA \u05E1\u05D9\u05D5\u05DD</span>
          <input class="time-input" type="time" value="16:30" />
        </label>
        <label class="mini-field">
          <span>\u05DE\u05E1\u05DE\u05DB\u05D9\u05DD \u05E9\u05DE\u05D5\u05E8\u05D9\u05DD</span>
          <select data-worker-doc-select>
            <option value="">בחר מסמך</option>
          </select>
        </label>
      </div>
      <input class="sr-only" type="file" accept="image/*,.pdf" capture="environment" data-worker-doc-file />
      <div class="selected-worker-actions">
        <button class="ghost-button action-button scan-doc-button" type="button" data-scan-worker-doc>\u05E1\u05E8\u05D5\u05E7/\u05E6\u05DC\u05DD \u05DE\u05E1\u05DE\u05DA</button>
        <button class="primary-button action-button" type="button" data-add-worker-today>\u05D4\u05D5\u05E1\u05E3 \u05DC\u05D9\u05D5\u05DE\u05DF \u05D4\u05D9\u05D5\u05DD</button>
      </div>
    </article>
  `;

  const docSelect = selectedWorkerPanel.querySelector("[data-worker-doc-select]");
  const docFile = selectedWorkerPanel.querySelector("[data-worker-doc-file]");
  const scanButton = selectedWorkerPanel.querySelector("[data-scan-worker-doc]");
  const addTodayButton = selectedWorkerPanel.querySelector("[data-add-worker-today]");
  let selectedDocText = "\u05DE\u05E1\u05DE\u05DB\u05D9\u05DD \u05D1\u05DE\u05D0\u05D2\u05E8";

  attachPressFeedback(scanButton);
  attachPressFeedback(addTodayButton);

  refreshWorkerDocumentSelect(worker, docSelect);
  refreshWorkerDocumentsFromCloud(worker, docSelect);

  docSelect?.addEventListener("change", () => {
    if (!docSelect.value) {
      selectedDocText = "\u05DE\u05E1\u05DE\u05DB\u05D9\u05DD \u05D1\u05DE\u05D0\u05D2\u05E8";
      return;
    }

    const selectedDoc = getWorkerDocuments(worker).find((doc) => doc.name === docSelect.value);
    selectedDocText = selectedDoc?.name || "\u05DE\u05E1\u05DE\u05DA \u05E2\u05D5\u05D1\u05D3";

    if (selectedDoc?.url) {
      openWorkerDocument(selectedDoc);
      return;
    }

    queueWorkerDocumentUpload(selectedDoc?.name || "");
  });

  docFile?.addEventListener("change", async () => {
    const fileName = docFile.files?.[0]?.name;

    if (!fileName) {
      return;
    }

    const originalLabel = scanButton?.textContent ?? "\u05E1\u05E8\u05D5\u05E7/\u05E6\u05DC\u05DD \u05DE\u05E1\u05DE\u05DA";
    const pendingDocType = selectedWorkerPanel.dataset.pendingDocType?.trim();
    const selectedDocumentName = docSelect?.value?.trim();
    const firstMissingDocument = getWorkerDocuments(worker).find((doc) => !doc.url)?.name;
    const documentType = pendingDocType || selectedDocumentName || firstMissingDocument || ALLOWED_WORKER_DOCUMENTS[0];

    if (scanButton) {
      scanButton.textContent = "\u05DE\u05E2\u05DC\u05D4 \u05DC\u05E2\u05E0\u05DF...";
      scanButton.disabled = true;
    }

    try {
      const result = await uploadWorkerDocumentToCloud(worker, docFile.files[0], documentType);

      if (result.ok) {
        selectedDocText = result.record.documentType;
        selectedWorkerPanel.dataset.pendingDocType = "";
        refreshWorkerDocumentSelect(worker, docSelect, result.record.documentType);
        if (scanButton) {
          scanButton.textContent = "\u05E0\u05E9\u05DE\u05E8 \u05D1\u05E2\u05E0\u05DF";
        }
      } else if (scanButton) {
        selectedDocText = fileName;
        selectedWorkerPanel.dataset.pendingDocType = "";
        scanButton.textContent = "\u05E2\u05E0\u05DF \u05DC\u05D0 \u05DE\u05D7\u05D5\u05D1\u05E8";
        window.setTimeout(() => {
          scanButton.textContent = originalLabel;
        }, 2200);
        window.alert(result.message);
      }
    } catch (error) {
      selectedDocText = fileName;
      selectedWorkerPanel.dataset.pendingDocType = "";
      if (scanButton) {
        scanButton.textContent = "\u05E9\u05DE\u05D9\u05E8\u05D4 \u05E0\u05DB\u05E9\u05DC\u05D4";
        window.setTimeout(() => {
          scanButton.textContent = originalLabel;
        }, 2200);
      }
      window.alert("\u05E9\u05DE\u05D9\u05E8\u05EA \u05D4\u05DE\u05E1\u05DE\u05DA \u05D1\u05E2\u05E0\u05DF \u05E0\u05DB\u05E9\u05DC\u05D4. \u05D1\u05D3\u05D5\u05E7 \u05D7\u05D9\u05D1\u05D5\u05E8 \u05D5-Firebase.");
    } finally {
      if (scanButton) {
        scanButton.disabled = false;
        if (scanButton.textContent === "\u05E0\u05E9\u05DE\u05E8 \u05D1\u05E2\u05E0\u05DF") {
          window.setTimeout(() => {
            scanButton.textContent = originalLabel;
          }, 1800);
        } else if (scanButton.textContent !== originalLabel) {
          window.setTimeout(() => {
            scanButton.textContent = originalLabel;
          }, 2200);
        }
      }
    }
  });

  selectedWorkerPanel.querySelector("[data-scan-worker-doc]")?.addEventListener("click", () => {
    docFile?.click();
  });

  selectedWorkerPanel.querySelector("[data-add-worker-today]")?.addEventListener("click", () => {
    addWorkerToToday(worker, "\u05EA\u05E7\u05D9\u05DF", docFile?.files?.[0]?.name ?? selectedDocText);
    selectedWorkerPanel.classList.remove("is-open");
    selectedWorkerPanel.innerHTML = "";
    workerSearch.value = "";
  });
}

function addWorkerToToday(worker, docStatus = "\u05EA\u05E7\u05D9\u05DF", docFileName = "") {
  if (!workerList) {
    return;
  }

  const statusClass = docStatus === "\u05EA\u05E7\u05D9\u05DF" ? "ok" : docStatus === "\u05DC\u05D0 \u05E8\u05DC\u05D5\u05D5\u05E0\u05D8\u05D9" ? "muted" : "warning";
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
        <span class="status-chip ok">\u05E0\u05D5\u05E1\u05E3 \u05D4\u05D9\u05D5\u05DD</span>
      </div>
    </button>
    <div class="worker-body">
      <div class="worker-grid">
        <div class="worker-line"><span>\u05E9\u05E2\u05EA \u05D4\u05EA\u05D7\u05DC\u05D4</span><strong>07:00</strong></div>
        <div class="worker-line"><span>\u05E9\u05E2\u05EA \u05E1\u05D9\u05D5\u05DD</span><strong>16:30</strong></div>
        <div class="worker-line"><span>\u05E1\u05D4\"\u05DB \u05E9\u05E2\u05D5\u05EA</span><strong>9.5</strong></div>
        <div class="worker-line"><span>\u05DE\u05E7\u05D5\u05E8</span><strong>\u05DE\u05D0\u05D2\u05E8 \u05E2\u05D5\u05D1\u05D3\u05D9\u05DD</strong></div>
      </div>
      <div class="worker-tags">
        <span>\u05EA\u05D3\u05E8\u05D9\u05DA: \u05DC\u05D1\u05D9\u05E6\u05D5\u05E2/\u05D0\u05D9\u05E9\u05D5\u05E8</span>
        <span>\u05E1\u05D5\u05D2 \u05E2\u05D1\u05D5\u05D3\u05D4: ${worker.role}</span>
        <span>\u05E1\u05D8\u05D8\u05D5\u05E1: \u05E0\u05D5\u05E1\u05E3 \u05DC\u05D9\u05D5\u05DE\u05DF \u05D4\u05D9\u05D5\u05DD</span>
      </div>
      <div class="doc-row">
        <span class="status-chip ok">\u05EA.\u05D6.</span>
        <span class="status-chip ${statusClass}">${docText}</span>
        <span class="status-chip muted">\u05E6\u05D9\u05DC\u05D5\u05DD \u05DC\u05E4\u05D9 \u05E6\u05D5\u05E8\u05DA</span>
      </div>
    </div>
  `;

  attachWorkerToggle(card.querySelector("[data-worker-toggle]"));
  workerList.prepend(card);
}

function getCurrentWorkerIds() {
  return new Set(
    Array.from(workerList?.querySelectorAll(".worker-card[data-worker-id]") ?? []).map(
      (card) => card.dataset.workerId
    )
  );
}

function formatWorkRange(startTime, endTime) {
  return `${startTime} - ${endTime}`;
}

function calculateHours(startTime, endTime) {
  const [startHour = "0", startMinute = "0"] = startTime.split(":");
  const [endHour = "0", endMinute = "0"] = endTime.split(":");
  const startMinutes = Number(startHour) * 60 + Number(startMinute);
  const endMinutes = Number(endHour) * 60 + Number(endMinute);
  const diff = Math.max(endMinutes - startMinutes, 0) / 60;
  const rounded = Math.round(diff * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

function updateWorkerCount() {
  if (workerCountValue) {
    workerCountValue.textContent = String(workerList?.querySelectorAll(".worker-card").length ?? 0);
  }
}

function serializeWorkerCard(card) {
  const workerId = card.dataset.workerId ?? "";
  const startTime = card.querySelector("[data-worker-start]")?.value || DEFAULT_WORKDAY_START;
  const endTime = card.querySelector("[data-worker-end]")?.value || DEFAULT_WORKDAY_END;
  const area = card.querySelector("[data-worker-area]")?.value || "";
  const note = card.querySelector("[data-worker-note]")?.value || "";
  const role = card.querySelector("[data-worker-role]")?.value || "";
  const contractor = card.querySelector("[data-worker-contractor]")?.value || "";

  return {
    workerId,
    startTime,
    endTime,
    area,
    note,
    role,
    contractor,
  };
}

function saveCurrentDailyWorkers() {
  if (!workerList) {
    return;
  }

  const store = loadDailyWorkersStore();
  const dateKey = getCurrentDateStorageKey();
  const workers = Array.from(workerList.querySelectorAll(".worker-card[data-worker-id]")).map(serializeWorkerCard);

  store[dateKey] = { workers };
  saveDailyWorkersStore(store);
  scheduleDailyWorkersCloudSave(dateKey, workers);
}

function scheduleDailyWorkersCloudSave(dateKey, workers) {
  if (dailyWorkersSaveTimeout) {
    window.clearTimeout(dailyWorkersSaveTimeout);
  }

  dailyWorkersSaveTimeout = window.setTimeout(async () => {
    try {
      await saveDailyWorkersToCloud(dateKey, workers);
    } catch {
      // Keep the local cache as fallback if cloud sync fails temporarily.
    }
  }, 250);
}

function getStatusClass(status = "") {
  if (status === "\u05EA\u05E7\u05D9\u05DF" || status === "\u05D1\u05D0\u05EA\u05E8 \u05D4\u05D9\u05D5\u05DD" || status === "\u05E0\u05D5\u05E1\u05E3 \u05D4\u05D9\u05D5\u05DD") {
    return "ok";
  }

  if (status.includes("\u05D7\u05E1\u05E8")) {
    return "warning";
  }

  return "muted";
}

function createWorkerCard(worker, options = {}) {
  const startTime = options.startTime || DEFAULT_WORKDAY_START;
  const endTime = options.endTime || DEFAULT_WORKDAY_END;
  const area = options.area || "\u05DC\u05D1\u05D7\u05D9\u05E8\u05D4";
  const note = options.note || "\u05DC\u05DC\u05D0 \u05D4\u05E2\u05E8\u05D4";
  const role = options.role || worker.role;
  const contractor = options.contractor || worker.contractor;
  const briefing = options.briefing || "\u05DC\u05D1\u05D9\u05E6\u05D5\u05E2";
  const docStatus = options.docStatus || "\u05EA\u05E7\u05D9\u05DF";
  const statusLabel = options.statusLabel || "\u05E0\u05D5\u05E1\u05E3 \u05D4\u05D9\u05D5\u05DD";
  const card = document.createElement("article");

  card.className = "worker-card";
  card.dataset.workerId = worker.id;
  card.innerHTML = `
    <button class="worker-head" type="button" data-worker-toggle>
      <div>
        <h3>${worker.name}</h3>
        <p>${role} • ${contractor}</p>
      </div>
      <div class="worker-head-meta">
        <span data-worker-range>${formatWorkRange(startTime, endTime)}</span>
        <span class="status-chip ${getStatusClass(statusLabel)}">${statusLabel}</span>
      </div>
    </button>
    <div class="worker-body">
      <div class="worker-grid worker-edit-grid">
        <label class="worker-edit-field">
          <span>\u05E9\u05E2\u05EA \u05D4\u05EA\u05D7\u05DC\u05D4</span>
          <input type="time" value="${startTime}" data-worker-start />
        </label>
        <label class="worker-edit-field">
          <span>\u05E9\u05E2\u05EA \u05E1\u05D9\u05D5\u05DD</span>
          <input type="time" value="${endTime}" data-worker-end />
        </label>
        <label class="worker-edit-field">
          <span>\u05E1\u05D4\"\u05DB \u05E9\u05E2\u05D5\u05EA</span>
          <input type="text" value="${calculateHours(startTime, endTime)}" data-worker-total readonly />
        </label>
        <label class="worker-edit-field">
          <span>\u05D0\u05D6\u05D5\u05E8 \u05E2\u05D1\u05D5\u05D3\u05D4</span>
          <input type="text" value="${area}" data-worker-area />
        </label>
        <label class="worker-edit-field">
          <span>\u05EA\u05E4\u05E7\u05D9\u05D3</span>
          <input type="text" value="${role}" data-worker-role />
        </label>
        <label class="worker-edit-field">
          <span>\u05E7\u05D1\u05DC\u05DF \u05DE\u05E9\u05E0\u05D4</span>
          <input type="text" value="${contractor}" data-worker-contractor />
        </label>
        <label class="worker-edit-field worker-edit-field-wide">
          <span>\u05D4\u05E2\u05E8\u05D4</span>
          <input type="text" value="${note}" data-worker-note />
        </label>
      </div>
      <div class="worker-tags">
        <span>\u05EA\u05D3\u05E8\u05D9\u05DA: ${briefing}</span>
        <span>\u05E1\u05D8\u05D8\u05D5\u05E1 \u05DE\u05E1\u05DE\u05DB\u05D9\u05DD: ${docStatus}</span>
        <span>\u05DE\u05E7\u05D5\u05E8: \u05DE\u05D0\u05D2\u05E8 \u05E2\u05D5\u05D1\u05D3\u05D9\u05DD</span>
      </div>
      <div class="doc-row">
        <span class="status-chip ok">\u05EA.\u05D6.</span>
        <span class="status-chip ${getStatusClass(docStatus)}">${docStatus}</span>
        <span class="status-chip muted">${worker.id}</span>
      </div>
    </div>
  `;

  return card;
}

function getWorkerCardOptions(card, worker) {
  if (!card) {
    return {
      startTime: DEFAULT_WORKDAY_START,
      endTime: DEFAULT_WORKDAY_END,
      area: "\u05DC\u05D1\u05D7\u05D9\u05E8\u05D4",
      note: "\u05DC\u05DC\u05D0 \u05D4\u05E2\u05E8\u05D4",
      role: worker.role,
      contractor: worker.contractor,
      briefing: "\u05DC\u05D1\u05D9\u05E6\u05D5\u05E2",
      docStatus: "\u05EA\u05E7\u05D9\u05DF",
      statusLabel: "\u05D1\u05D0\u05EA\u05E8 \u05D4\u05D9\u05D5\u05DD",
    };
  }

  return {
    startTime: card.querySelector("[data-worker-start]")?.value || DEFAULT_WORKDAY_START,
    endTime: card.querySelector("[data-worker-end]")?.value || DEFAULT_WORKDAY_END,
    area: card.querySelector("[data-worker-area]")?.value || "\u05DC\u05D1\u05D7\u05D9\u05E8\u05D4",
    note: card.querySelector("[data-worker-note]")?.value || "\u05DC\u05DC\u05D0 \u05D4\u05E2\u05E8\u05D4",
    role: card.querySelector("[data-worker-role]")?.value || worker.role,
    contractor: card.querySelector("[data-worker-contractor]")?.value || worker.contractor,
    briefing: "\u05DC\u05D1\u05D9\u05E6\u05D5\u05E2",
    docStatus: "\u05E0\u05D1\u05D3\u05E7 \u05D1\u05DE\u05D0\u05D2\u05E8",
    statusLabel:
      card.querySelector(".worker-head-meta .status-chip")?.textContent?.trim() ||
      "\u05D1\u05D0\u05EA\u05E8 \u05D4\u05D9\u05D5\u05DD",
  };
}

function mirrorWorkerFieldValue(sourceCard, targetCard, selector) {
  const sourceField = sourceCard?.querySelector(selector);
  const targetField = targetCard?.querySelector(selector);

  if (!sourceField || !targetField) {
    return;
  }

  targetField.value = sourceField.value;
  targetField.dispatchEvent(new Event("input", { bubbles: true }));
  targetField.dispatchEvent(new Event("change", { bubbles: true }));
}

function syncWorkerCardToSource(panelCard, sourceCard) {
  [
    "[data-worker-start]",
    "[data-worker-end]",
    "[data-worker-area]",
    "[data-worker-note]",
    "[data-worker-role]",
    "[data-worker-contractor]",
  ].forEach((selector) => mirrorWorkerFieldValue(panelCard, sourceCard, selector));
}

function renderSelectedWorkerEditor(worker, sourceCard) {
  if (!selectedWorkerPanel || !sourceCard) {
    return false;
  }

  selectedWorkerPanel.classList.add("is-open");
  selectedWorkerPanel.innerHTML = "";

  const editorCard = createWorkerCard(worker, getWorkerCardOptions(sourceCard, worker));
  editorCard.classList.add("selected-worker-card", "is-open");
  attachWorkerCardControls(editorCard);

  const actions = document.createElement("div");
  actions.className = "selected-worker-actions";
  actions.innerHTML = `
    <button class="ghost-button action-button" type="button" data-close-selected-worker>\u05E1\u05D2\u05D5\u05E8</button>
  `;
  editorCard.querySelector(".worker-body")?.append(actions);
  selectedWorkerPanel.append(editorCard);

  [
    "[data-worker-start]",
    "[data-worker-end]",
    "[data-worker-area]",
    "[data-worker-note]",
    "[data-worker-role]",
    "[data-worker-contractor]",
  ].forEach((selector) => {
    const field = editorCard.querySelector(selector);
    field?.addEventListener("input", () => syncWorkerCardToSource(editorCard, sourceCard));
    field?.addEventListener("change", () => syncWorkerCardToSource(editorCard, sourceCard));
  });

  const closeButton = selectedWorkerPanel.querySelector("[data-close-selected-worker]");
  attachPressFeedback(closeButton);
  closeButton?.addEventListener("click", clearSelectedWorkerPanel);
  return true;
}

function attachWorkerCardControls(card) {
  const toggleButton = card.querySelector("[data-worker-toggle]");
  const startInput = card.querySelector("[data-worker-start]");
  const endInput = card.querySelector("[data-worker-end]");
  const totalInput = card.querySelector("[data-worker-total]");
  const rangeText = card.querySelector("[data-worker-range]");
  const roleInput = card.querySelector("[data-worker-role]");
  const contractorInput = card.querySelector("[data-worker-contractor]");
  const headDescription = toggleButton?.querySelector("p");

  attachWorkerToggle(toggleButton);

  function syncCardSummary() {
    const startTime = startInput?.value || DEFAULT_WORKDAY_START;
    const endTime = endInput?.value || DEFAULT_WORKDAY_END;
    if (rangeText) {
      rangeText.textContent = formatWorkRange(startTime, endTime);
    }
    if (totalInput) {
      totalInput.value = calculateHours(startTime, endTime);
    }
    if (headDescription) {
      headDescription.textContent = `${roleInput?.value || ""} • ${contractorInput?.value || ""}`;
    }
  }

  startInput?.addEventListener("input", syncCardSummary);
  endInput?.addEventListener("input", syncCardSummary);
  roleInput?.addEventListener("input", syncCardSummary);
  contractorInput?.addEventListener("input", syncCardSummary);
  [startInput, endInput, roleInput, contractorInput, card.querySelector("[data-worker-area]"), card.querySelector("[data-worker-note]")]
    .filter(Boolean)
    .forEach((input) => {
      input.addEventListener("input", saveCurrentDailyWorkers);
      input.addEventListener("change", saveCurrentDailyWorkers);
    });
  syncCardSummary();
}

addWorkerToToday = function addWorkerToTodayFromPicker(worker, options = {}) {
  if (!workerList || !worker?.id || getCurrentWorkerIds().has(worker.id)) {
    return;
  }

  const card = createWorkerCard(worker, options);
  attachWorkerCardControls(card);
  workerList.prepend(card);
  updateWorkerCount();
  saveCurrentDailyWorkers();
};

function removeWorkerFromToday(workerId) {
  const existingCard = workerList?.querySelector(`.worker-card[data-worker-id="${workerId}"]`);

  if (!existingCard) {
    return false;
  }

  existingCard.remove();
  updateWorkerCount();
  saveCurrentDailyWorkers();
  return true;
}

function focusWorkerCard(workerId) {
  const existingCard = workerList?.querySelector(`.worker-card[data-worker-id="${workerId}"]`);
  const worker = workerDatabase.find((entry) => entry.id === workerId);

  if (!existingCard || !worker) {
    return false;
  }

  workerList?.querySelectorAll(".worker-card.is-open").forEach((card) => {
    if (card !== existingCard) {
      card.classList.remove("is-open");
    }
  });
  existingCard.classList.add("is-highlighted");
  const didRender = renderSelectedWorkerEditor(worker, existingCard);
  selectedWorkerPanel?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  window.setTimeout(() => existingCard.classList.remove("is-highlighted"), 1800);
  return didRender;
}

function renderSelectedWorkerPreview(worker) {
  if (!selectedWorkerPanel) {
    return;
  }

  selectedWorkerPanel.classList.add("is-open");
  selectedWorkerPanel.innerHTML = "";

  const previewCard = createWorkerCard(worker, {
    startTime: DEFAULT_WORKDAY_START,
    endTime: DEFAULT_WORKDAY_END,
    area: "\u05DC\u05D1\u05D7\u05D9\u05E8\u05D4",
    note: "\u05E0\u05D9\u05EA\u05DF \u05DC\u05E2\u05D3\u05DB\u05DF \u05DC\u05E4\u05E0\u05D9 \u05D4\u05D5\u05E1\u05E4\u05D4",
    briefing: "\u05DC\u05D1\u05D9\u05E6\u05D5\u05E2",
    docStatus: "\u05E0\u05D1\u05D3\u05E7 \u05D1\u05DE\u05D0\u05D2\u05E8",
    statusLabel: "\u05EA\u05E6\u05D5\u05D2\u05D4 \u05DC\u05E4\u05E0\u05D9 \u05D4\u05D5\u05E1\u05E4\u05D4",
  });

  previewCard.classList.add("selected-worker-card");
  attachWorkerCardControls(previewCard);

  const actions = document.createElement("div");
  actions.className = "selected-worker-actions";
  actions.innerHTML = `
    <button class="ghost-button action-button" type="button" data-close-selected-worker>\u05E1\u05D2\u05D5\u05E8</button>
    <button class="primary-button action-button" type="button" data-add-preview-worker>\u05D4\u05D5\u05E1\u05E3 \u05DC\u05DE\u05E6\u05D1\u05D4</button>
  `;

  previewCard.querySelector(".worker-body")?.append(actions);
  selectedWorkerPanel.append(previewCard);

  const addButton = selectedWorkerPanel.querySelector("[data-add-preview-worker]");
  const closeButton = selectedWorkerPanel.querySelector("[data-close-selected-worker]");
  const startInput = selectedWorkerPanel.querySelector("[data-worker-start]");
  const endInput = selectedWorkerPanel.querySelector("[data-worker-end]");
  const areaInput = selectedWorkerPanel.querySelector("[data-worker-area]");
  const noteInput = selectedWorkerPanel.querySelector("[data-worker-note]");

  attachPressFeedback(addButton);
  attachPressFeedback(closeButton);

  addButton?.addEventListener("click", () => {
    addWorkerToToday(worker, {
      startTime: startInput?.value || DEFAULT_WORKDAY_START,
      endTime: endInput?.value || DEFAULT_WORKDAY_END,
      area: areaInput?.value || "\u05DC\u05D1\u05D7\u05D9\u05E8\u05D4",
      note: noteInput?.value || "",
      briefing: "\u05DC\u05D1\u05D9\u05E6\u05D5\u05E2",
      docStatus: "\u05E0\u05D1\u05D3\u05E7 \u05D1\u05DE\u05D0\u05D2\u05E8",
      statusLabel: "\u05E0\u05D5\u05E1\u05E3 \u05D4\u05D9\u05D5\u05DD",
    });
    selectedWorkerIds.delete(worker.id);
    clearSelectedWorkerPanel();
    renderWorkerPicker();
  });

  closeButton?.addEventListener("click", clearSelectedWorkerPanel);
}

function renderWorkerPicker() {
  if (!workerSuggestions) {
    return;
  }

  const activeWorkerIds = getCurrentWorkerIds();
  const sortedWorkers = [...workerDatabase].sort((left, right) =>
    left.name.localeCompare(right.name, "he")
  );
  workerSuggestions.innerHTML = `
    <div class="worker-picker-shell">
      <div class="worker-picker-head">
        <div>
          <strong>\u05D1\u05D7\u05E8 \u05E2\u05D5\u05D1\u05D3\u05D9\u05DD \u05DE\u05D4\u05DE\u05D0\u05D2\u05E8</strong>
        </div>
      </div>
      <div class="worker-picker-list">
        ${sortedWorkers
          .map((worker) => {
            const isActive = activeWorkerIds.has(worker.id);
            const isChecked = isActive;
            return `
              <div class="worker-picker-item">
                <input type="checkbox" value="${worker.id}" ${isChecked ? "checked" : ""} data-worker-pick />
                <button class="worker-picker-open" type="button" data-worker-open="${worker.id}">
                  <strong>${worker.name}</strong>
                  <span>${worker.role} • ${worker.contractor}</span>
                </button>
              </div>
            `;
          })
          .join("")}
      </div>
    </div>
  `;

  workerSuggestions.querySelectorAll("[data-worker-pick]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        const worker = workerDatabase.find((entry) => entry.id === checkbox.value);
        if (worker) {
          addWorkerToToday(worker, {
            startTime: DEFAULT_WORKDAY_START,
            endTime: DEFAULT_WORKDAY_END,
            area: "\u05DC\u05D1\u05D7\u05D9\u05E8\u05D4",
            note: "\u05D4\u05D5\u05E1\u05E3 \u05D1\u05E1\u05D9\u05DE\u05D5\u05DF \u05DE\u05D4\u05D0\u05EA\u05E8",
            briefing: "\u05DC\u05D1\u05D9\u05E6\u05D5\u05E2",
            docStatus: "\u05E0\u05D1\u05D3\u05E7 \u05D1\u05DE\u05D0\u05D2\u05E8",
            statusLabel: "\u05E0\u05D5\u05E1\u05E3 \u05D4\u05D9\u05D5\u05DD",
          });
        }
      } else {
        removeWorkerFromToday(checkbox.value);
        if (selectedWorkerPanel?.classList.contains("is-open")) {
          const previewCard = selectedWorkerPanel.querySelector(`.worker-card[data-worker-id="${checkbox.value}"]`);
          if (previewCard) {
            clearSelectedWorkerPanel();
          }
        }
      }
      renderWorkerPicker();
      workerSuggestions.classList.add("is-open");
    });
  });

  workerSuggestions.querySelectorAll("[data-worker-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const workerId = button.getAttribute("data-worker-open") ?? "";
      const worker = workerDatabase.find((entry) => entry.id === workerId);

      if (!worker) {
        return;
      }

      if (!focusWorkerCard(worker.id)) {
        renderSelectedWorkerPreview(worker);
        selectedWorkerPanel?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  });
}

async function loadDailyWorkersForCurrentDate() {
  if (!workerList) {
    return;
  }

  const dateKey = getCurrentDateStorageKey();
  const store = loadDailyWorkersStore();
  const loadToken = ++dailyWorkforceLoadToken;
  let savedWorkers = Array.isArray(store[dateKey]?.workers) ? store[dateKey].workers : [];

  try {
    const cloudWorkers = await loadDailyWorkersFromCloud(dateKey);
    if (loadToken !== dailyWorkforceLoadToken) {
      return;
    }
    if (Array.isArray(cloudWorkers)) {
      savedWorkers = cloudWorkers;
      store[dateKey] = { workers: cloudWorkers };
      saveDailyWorkersStore(store);
    }
  } catch {
    if (loadToken !== dailyWorkforceLoadToken) {
      return;
    }
  }

  workerList.innerHTML = "";
  clearSelectedWorkerPanel();
  savedWorkers.forEach((entry) => {
    const worker = workerDatabase.find((item) => item.id === entry.workerId);
    if (worker) {
      addWorkerToToday(worker, {
        startTime: entry.startTime,
        endTime: entry.endTime,
        area: entry.area,
        note: entry.note,
        role: entry.role,
        contractor: entry.contractor,
        briefing: "\u05DC\u05D1\u05D9\u05E6\u05D5\u05E2",
        docStatus: "\u05E0\u05D1\u05D3\u05E7 \u05D1\u05DE\u05D0\u05D2\u05E8",
        statusLabel: "\u05D1\u05D0\u05EA\u05E8 \u05D4\u05D9\u05D5\u05DD",
      });
    }
  });

  updateWorkerCount();
  renderWorkerPicker();
}

function initializeTodayWorkers() {
  if (!workerList) {
    return;
  }

  if (!loadDailyWorkersStore()[getCurrentDateStorageKey()]) {
    saveCurrentDailyWorkers();
  }
  loadDailyWorkersForCurrentDate();
}

workerPickerTrigger?.addEventListener("click", async () => {
  await loadWorkerRegistryForCurrentSite();
  renderWorkerPicker();
  workerSuggestions?.classList.toggle("is-open");
});

loadWorkerRegistryForCurrentSite();
initializeTodayWorkers();

