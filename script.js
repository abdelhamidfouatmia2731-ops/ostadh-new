/**
 * ============================================================================
 * منصة الأستاذ الذكية - المحرك البرمجي الأساسي (JavaScript)
 * النسخة المحدثة والمحسنة مع الدعم الذكي لاستيراد ملفات Excel والرقمنة
 * ============================================================================
 */
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then((isPersisted) => {
    if (isPersisted) {
      console.log("التخزين محمي ولن يتم حذفه تلقائياً بواسطة المتصفح.");
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  // ==========================================================================
  // 1. إدارة قاعدة البيانات المحلية (IndexedDB)
  // ==========================================================================
  // ==========================================================================
// 1. إدارة قاعدة البيانات المحلية (IndexedDB)
// ==========================================================================

// ==========================================================================
// 1. قاعدة البيانات المحلية IndexedDB
// ==========================================================================

const DB_NAME = "SmartTeacherPlatformDB";

// الإصدار 5 لإضافة annualResources
const DB_VERSION = 5;

const STORES = [
  "students",
  "classes",
  "schedules",
  "monitoring",
  "dailyLogs",
  "annualFiles",

  // حفظ الموارد المستخرجة من المخطط السنوي
  "annualResources",

  "memos",
  "exams",
  "documents",
  "profile"
];

let dbInstance = null;


// ==========================================================================
// فتح قاعدة البيانات
// ==========================================================================

function openDB() {

  // إذا كانت قاعدة البيانات مفتوحة بالفعل
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  // التحقق من دعم IndexedDB
  if (!window.indexedDB) {

    console.error(
      "IndexedDB غير مدعوم أو محجوب في هذه البيئة."
    );

    return Promise.reject(
      new Error("IndexedDB Restricted")
    );
  }

  // ============================================================
  // هنا الإصلاح الأساسي:
  // resolve و reject أصبحا داخل Promise
  // ============================================================

  return new Promise((resolve, reject) => {

    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION
    );


    // ==========================================================
    // إنشاء / تحديث مخازن قاعدة البيانات
    // ==========================================================

    request.onupgradeneeded = function (event) {

      const database = event.target.result;

      const storesList =
        Array.isArray(STORES)
          ? STORES
          : Object.values(STORES);

      storesList.forEach((storeName) => {

        if (
          !database.objectStoreNames.contains(storeName)
        ) {

          database.createObjectStore(
            storeName,
            {
              keyPath: "id",
              autoIncrement: true
            }
          );

          console.log(
            `تم إنشاء مخزن IndexedDB: ${storeName}`
          );
        }

      });

    };


    // ==========================================================
    // نجاح فتح قاعدة البيانات
    // ==========================================================

    request.onsuccess = function (event) {

      dbInstance = event.target.result;

      // في حالة فتح قاعدة البيانات من تبويب آخر
      dbInstance.onversionchange = function () {

        dbInstance.close();

        dbInstance = null;

        console.warn(
          "تم إغلاق اتصال IndexedDB بسبب تغيير الإصدار."
        );
      };

      console.log(
        "تم فتح قاعدة البيانات المحلية بنجاح:",
        DB_NAME,
        "الإصدار:",
        DB_VERSION
      );

      resolve(dbInstance);
    };


    // ==========================================================
    // فشل فتح قاعدة البيانات
    // ==========================================================

    request.onerror = function (event) {

      const error =
        event.target.error ||
        new Error("فشل فتح قاعدة البيانات");

      console.error(
        "خطأ في فتح قاعدة البيانات IndexedDB:",
        error
      );

      dbInstance = null;

      reject(error);
    };


    // ==========================================================
    // قاعدة البيانات محجوبة بسبب اتصال قديم
    // ==========================================================

    request.onblocked = function () {

      console.warn(
        "فتح قاعدة البيانات محجوب. قد يكون هناك اتصال قديم مفتوح."
      );

    };

  });
}


// ==========================================================================
// قراءة جميع البيانات من مخزن
// ==========================================================================

async function dbGetAll(storeName) {

  const db = await openDB();

  return new Promise((resolve, reject) => {

    try {

      const tx =
        db.transaction(
          storeName,
          "readonly"
        );

      const store =
        tx.objectStore(storeName);

      const req =
        store.getAll();


      req.onsuccess = function () {

        resolve(
          Array.isArray(req.result)
            ? req.result
            : []
        );

      };


      req.onerror = function () {

        reject(
          req.error ||
          new Error(
            `فشل قراءة البيانات من ${storeName}`
          )
        );

      };

    } catch (error) {

      reject(error);

    }

  });
}


// ==========================================================================
// إضافة / تحديث بيانات
// ==========================================================================

/* ============================================================
   حفظ البيانات في IndexedDB - نسخة آمنة ومفصلة
   ============================================================ */

async function dbPut(storeName, data) {

  const db = await openDB();

  return new Promise((resolve, reject) => {

    try {

      /* ----------------------------------------
         التحقق من وجود المخزن
         ---------------------------------------- */

      if (!db.objectStoreNames.contains(storeName)) {

        const error = new Error(
          `Object Store غير موجود: ${storeName}`
        );

        console.error(
          "❌ IndexedDB:",
          error.message,
          "المخازن الموجودة:",
          Array.from(db.objectStoreNames)
        );

        reject(error);
        return;
      }


      /* ----------------------------------------
         إنشاء المعاملة
         ---------------------------------------- */

      const tx = db.transaction(
        storeName,
        "readwrite"
      );


      const store =
        tx.objectStore(storeName);


      /* ----------------------------------------
         حفظ البيانات
         ---------------------------------------- */

      const req =
        store.put(data);


      /* ----------------------------------------
         نجاح الطلب
         ---------------------------------------- */

      req.onsuccess = function () {

        resolve(req.result);

      };


      /* ----------------------------------------
         خطأ الطلب
         ---------------------------------------- */

      req.onerror = function () {

        const error =
          req.error ||
          new Error(
            `فشل حفظ البيانات في ${storeName}`
          );


        console.error(
          `❌ خطأ dbPut في ${storeName}:`,
          error,
          error?.message,
          error?.name
        );


        reject(error);

      };


      /* ----------------------------------------
         خطأ المعاملة بالكامل
         ---------------------------------------- */

      tx.onerror = function () {

        const error =
          tx.error ||
          new Error(
            `فشلت معاملة IndexedDB في ${storeName}`
          );


        console.error(
          `❌ Transaction Error في ${storeName}:`,
          error,
          error?.message,
          error?.name
        );


        reject(error);

      };


      tx.onabort = function () {

        const error =
          tx.error ||
          new Error(
            `تم إلغاء معاملة IndexedDB في ${storeName}`
          );


        console.error(
          `❌ Transaction Aborted في ${storeName}:`,
          error,
          error?.message,
          error?.name
        );


        reject(error);

      };

    } catch (error) {

      console.error(
        `❌ Exception داخل dbPut(${storeName}):`,
        error,
        error?.message,
        error?.name,
        error?.stack
      );


      reject(error);

    }

  });
}
// ==========================================================================
// مسح مخزن بالكامل
// ==========================================================================

async function dbClear(storeName) {

  const db = await openDB();

  return new Promise((resolve, reject) => {

    try {

      const tx =
        db.transaction(
          storeName,
          "readwrite"
        );

      const store =
        tx.objectStore(storeName);

      const req =
        store.clear();


      req.onsuccess = function () {

        resolve();

      };


      req.onerror = function () {

        reject(
          req.error ||
          new Error(
            `فشل مسح البيانات من ${storeName}`
          )
        );

      };

    } catch (error) {

      reject(error);

    }

  });
}


// ==========================================================================
// 2. حالة التطبيق العامة
// ==========================================================================

const state = {

  profile: {},

  classes: [],

  schedules: [],

  monitoring: [],

  dailyLogs: [],

  annualFiles: [],

  // الموارد المستخرجة من التخطيط السنوي
  annualResources: [],

  memos: [],

  exams: [],

  documents: [],

  selectedClassId: null,

  currentView: "homeView"

};
  // ==========================================================================
  // 3. أدوات مساعدة ونظام التنبيهات (Utilities & Toasts)
  // ==========================================================================
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
  }
function getClassLevel(currentLevel = "") {
  if (currentLevel && String(currentLevel).trim()) {
    return String(currentLevel).trim().toUpperCase();
  }

  let level = prompt(
    "أدخل مستوى القسم:\n\nمثال:\n1AM\n2AM\n3AM\n4AM"
  );

  if (level === null) {
    return null;
  }

  level = level.trim().toUpperCase();

  if (!level) {
    showToast("يجب إدخال مستوى القسم", "error");
    return getClassLevel("");
  }

  return level;
}

  function escapeHTML(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconClass = "fa-circle-info";
    if (type === "success") iconClass = "fa-circle-check";
    if (type === "error") iconClass = "fa-circle-xmark";
    if (type === "warning") iconClass = "fa-triangle-exclamation";

    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i><span>${escapeHTML(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function formatFileSize(bytes) {
    if (!bytes || isNaN(bytes)) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function base64ToBlob(base64, type = "application/octet-stream") {
    try {
      const parts = base64.split(",");
      const rawBase64 = parts.length > 1 ? parts[1] : parts[0];
      const byteCharacters = atob(rawBase64);
      const byteArrays = [];
      for (let i = 0; i < byteCharacters.length; i += 512) {
        const slice = byteCharacters.slice(i, i + 512);
        const byteNumbers = new Array(slice.length);
        for (let j = 0; j < slice.length; j++) {
          byteNumbers[j] = slice.charCodeAt(j);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      return new Blob(byteArrays, { type: type });
    } catch (e) {
      console.error("خطأ في تحويل Base64 إلى Blob:", e);
      return new Blob([], { type: type });
    }
  }

  // ==========================================================================
  // 4. تهيئة واسترجاع البيانات الأولية
  // ==========================================================================
  async function loadAllData() {
    try {
      state.classes = await dbGetAll("classes");
      state.schedules = await dbGetAll("schedules");
      state.monitoring = await dbGetAll("monitoring");
      state.dailyLogs = await dbGetAll("dailyLogs");
      state.annualFiles = await dbGetAll("annualFiles");
      state.memos = await dbGetAll("memos");
      state.exams = await dbGetAll("exams");
      state.documents = await dbGetAll("documents");

      const profiles = await dbGetAll("profile");
      if (profiles.length > 0) {
        state.profile = profiles[0];
      } else {
        state.profile = {
          id: "main_profile",
          firstName: "الأستاذ",
          lastName: "",
          birth: "",
          certificate: "",
          firstAppointment: "",
          rank: "",
          rankDate: "",
          grade: "",
          gradeDate: "",
          photoBlob: null
        };
        await dbPut("profile", state.profile);
      }

      updateProfileUI();
      renderDashboard();
      renderClasses();
      renderSchedule();
      populateClassSelectors();
      renderDailyLogs();
      renderAnnualFiles();
      renderMemosFiles();
      renderExamsFiles();
      renderAdminDocuments();
      renderStatistics();
    } catch (err) {
      console.error("خطأ في تحميل البيانات:", err);
      showToast("حدث خطأ أثناء تحميل البيانات المحلية", "error");
    }
  }

  // ==========================================================================
  // 5. التنقل والواجهات (Navigation)
  // ==========================================================================
  function switchView(viewId) {

  const views = document.querySelectorAll(".view");
  const navItems = document.querySelectorAll(".nav-item");

  /* =========================================
     إظهار الصفحة المطلوبة وإخفاء باقي الصفحات
     ========================================= */
  views.forEach((view) => {
    view.classList.toggle("active", view.id === viewId);
  });

  /* =========================================
     تحديث التبويب النشط
     ========================================= */
  navItems.forEach((item) => {
    item.classList.toggle(
      "active",
      item.getAttribute("data-view") === viewId
    );
  });

  /* =========================================
     حفظ الصفحة الحالية
     ========================================= */
  state.currentView = viewId;

  /* =========================================
     عناوين الصفحات
     ========================================= */
  const pageTitle = document.getElementById("pageTitle");

  const titleMap = {
    homeView: "لوحة القيادة",
    studentsView: "إدارة التلاميذ والأقسام",
    scheduleView: "استعمال الزمن",
    monitoringView: "المتابعة والتقييم",
    dailyLogView: "دفتر اليومي",
    annualPlanView: "التوزيع السنوي",
    memosView: "أرشيف المذكرات",
    examsView: "الفروض والاختبارات",
    statisticsView: "الإحصائيات البيداغوجية",
    profileView: "الملف المهني",
    documentsView: "الوثائق الإدارية",
    backupView: "النسخ الاحتياطي",
    assistantView: "المساعد البيداغوجي"
  };

  if (pageTitle && titleMap[viewId]) {
    pageTitle.textContent = titleMap[viewId];
  }

  /* =========================================
     إغلاق القائمة الجانبية
     ========================================= */
  const sidebar = document.getElementById("sidebar");

  if (sidebar) {
    sidebar.classList.remove("open");
  }

  /* =========================================
     تحديث البيانات
     ========================================= */
  if (typeof populateClassSelectors === "function") {
    populateClassSelectors();
  }

  if (
    viewId === "homeView" &&
    typeof renderDashboard === "function"
  ) {
    renderDashboard();
  }

  if (
    viewId === "studentsView" &&
    typeof renderClasses === "function"
  ) {
    renderClasses();
  }

  if (
    viewId === "scheduleView" &&
    typeof renderSchedule === "function"
  ) {
    renderSchedule();
  }

  if (viewId === "monitoringView") {

    if (typeof renderAbsenceHistory === "function") {
      renderAbsenceHistory();
    }

    if (typeof renderEvaluationTable === "function") {
      renderEvaluationTable();
    }
  }

  if (
    viewId === "dailyLogView" &&
    typeof renderDailyLogs === "function"
  ) {
    renderDailyLogs();
  }

  if (
    viewId === "statisticsView" &&
    typeof renderStatistics === "function"
  ) {
    renderStatistics();
  }

  /* =========================================
     نظام الهاتف
     ========================================= */

  const mobileBackBtn =
    document.getElementById("mobileBackBtn");

  if (window.innerWidth <= 768) {

    if (viewId === "homeView") {

      /*
       * الرئيسية:
       * إلغاء وضع الصفحة الداخلية
       */
      document.body.classList.remove("mobile-page-open");

      if (mobileBackBtn) {
        mobileBackBtn.classList.remove("show");
      }

    } else {

      /*
       * صفحة داخلية:
       * إخفاء القائمة الجانبية
       * وإظهار زر الرجوع
       */
      document.body.classList.add("mobile-page-open");

      if (mobileBackBtn) {
        mobileBackBtn.classList.add("show");
      }
    }
  }
}


/* =========================================
   إعداد نظام التنقل
   ========================================= */

function setupNavigation() {

  /* =========================================
     أزرار التنقل
     ========================================= */

  document.querySelectorAll("[data-view]").forEach((btn) => {

    btn.addEventListener("click", () => {

      const targetView =
        btn.getAttribute("data-view");

      if (targetView) {
        switchView(targetView);
      }

    });

  });


  /* =========================================
     زر القائمة في الهاتف
     ========================================= */

  const mobileMenuBtn =
    document.getElementById("mobileMenuBtn");

  const sidebar =
    document.getElementById("sidebar");

  if (mobileMenuBtn && sidebar) {

    mobileMenuBtn.addEventListener("click", () => {

      /*
       * عند الضغط على زر القائمة
       * نسمح بفتح القائمة
       */
      sidebar.classList.toggle("open");

    });

  }


  /* =========================================
     زر الرجوع إلى الرئيسية في الهاتف
     ========================================= */

  const mobileBackBtn =
    document.getElementById("mobileBackBtn");

  if (mobileBackBtn) {

    mobileBackBtn.addEventListener("click", () => {

      switchView("homeView");

    });

  }


  /* =========================================
     التاريخ
     ========================================= */

  const currentDateText =
    document.getElementById("currentDateText");

  if (currentDateText) {

    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    };

    currentDateText.textContent =
      new Date().toLocaleDateString(
        "ar-DZ",
        options
      );

  }
}

  // ==========================================================================
  // 6. لوحة القيادة (Dashboard)
  // ==========================================================================
  function renderDashboard() {
    let totalStudents = 0;
    state.classes.forEach((c) => {
      totalStudents += (c.students || []).length;
    });

    const dashStudents = document.getElementById("dashboardStudents");
    const dashClasses = document.getElementById("dashboardClasses");
    if (dashStudents) dashStudents.textContent = totalStudents;
    if (dashClasses) dashClasses.textContent = state.classes.length;

    const daysMap = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "السبت", "الجمعة"];
    const todayName = daysMap[new Date().getDay()];
    const todayLessons = state.schedules.filter((s) => s.day === todayName);

    const dashTodayLessons = document.getElementById("dashboardTodayLessons");
    if (dashTodayLessons) dashTodayLessons.textContent = todayLessons.length;

    const todayDateLabel = document.getElementById("todayScheduleDate");
    if (todayDateLabel) todayDateLabel.textContent = todayName;

    const todayList = document.getElementById("todayLessonsList");
    if (todayList) {
      if (todayLessons.length === 0) {
        todayList.innerHTML = `<div class="empty-state">لا توجد حصص مسجلة اليوم (${escapeHTML(todayName)}).</div>`;
      } else {
        todayLessons.sort((a, b) => a.sessionNum - b.sessionNum);
        todayList.innerHTML = todayLessons
          .map((lesson) => {
            const cls = state.classes.find((c) => String(c.id) === String(lesson.classId));
            return `
            <div class="lesson-item">
              <div class="lesson-time">الحصة ${escapeHTML(lesson.sessionNum)}</div>
              <div class="lesson-details">
                <strong>${cls ? escapeHTML(cls.name) : "قسم غير محدد"}</strong>
                <small>${escapeHTML(lesson.subject || "")} - ${escapeHTML(lesson.room || "قاعة عادية")}</small>

              </div>
            </div>`;
          })
          .join("");
      }
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const todayAbsences = state.monitoring.filter(
      (m) => m.date === todayStr && m.attendance === "absent"
    );
    const dashAbsences = document.getElementById("dashboardAbsences");
    if (dashAbsences) dashAbsences.textContent = todayAbsences.length;

    const notifList = document.getElementById("notificationsList");
    if (notifList) {
      const notifs = [];
      if (state.classes.length === 0) {
        notifs.push("قم بإضافة الأقسام واستيراد قوائم التلاميذ لبدء العمل.");
      }
      if (state.schedules.length === 0) {
        notifs.push("لم تقم بضبط استعمال الزمن الأسبوعي بعد.");
      }
      if (todayAbsences.length > 0) {
        notifs.push(`تم تسجيل ${todayAbsences.length} غياب(ات) هذا اليوم.`);
      }

      if (notifs.length === 0) {
        notifList.innerHTML = `<p class="empty-state">لا توجد تنبيهات جديدة، جميع الأمور منظمة!</p>`;
      } else {
        notifList.innerHTML = notifs
          .map((n) => `<div class="notification-item"><i class="fa-solid fa-bell"></i> <span>${escapeHTML(n)}</span></div>`)
          .join("");
      }
    }

    const targetLessons = 100;
    const progressPct = Math.min(100, Math.round((state.dailyLogs.length / targetLessons) * 100));

    const progText = document.getElementById("annualProgressText");
    const progBar = document.getElementById("annualProgressBar");
    if (progText) progText.textContent = `${progressPct}%`;
    if (progBar) progBar.style.width = `${progressPct}%`;
  }

  // ==========================================================================
  // 7. إدارة التلاميذ والأقسام (Students & Classes)
  // ==========================================================================
  function renderClasses() {
    const grid = document.getElementById("classesGrid");
    if (!grid) return;

    if (state.classes.length === 0) {
      grid.innerHTML = `
        <div class="empty-state full-width">
          <i class="fa-solid fa-users-slash fa-2x"></i>
          <p>لا توجد أقسام مضافة بعد. أضف قسماً جديداً أو استورد ملف Excel.</p>
        </div>`;
      return;
    }

    grid.innerHTML = state.classes
      .map((c) => {
        const count = (c.students || []).length;
        return `
        <div class="class-card" data-class-id="${escapeHTML(c.id)}">
          <div class="class-card-header">
            <h3>${escapeHTML(c.name)}</h3>
            <span class="badge">${escapeHTML(c.level || "مستوى غير محدد")}</span>
          </div>
          <div class="class-card-body">
            <p><i class="fa-solid fa-user-graduate"></i> عدد التلاميذ: <strong>${count}</strong></p>
            <p><i class="fa-solid fa-location-dot"></i> القاعة: ${escapeHTML(c.room || "غير محددة")}</p>
          </div>
        </div>`;
      })
      .join("");

    grid.querySelectorAll(".class-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.getAttribute("data-class-id");
        if (id) window.selectClass(id);
      });
    });
  }

  window.selectClass = function (classId) {
    state.selectedClassId = classId;
    const cls = state.classes.find((c) => String(c.id) === String(classId));
    if (!cls) return;

    const classTableScreen = document.getElementById("classTableScreen");
    const selectedClassTitle = document.getElementById("selectedClassTitle");
    const selectedClassMeta = document.getElementById("selectedClassMeta");

    if (selectedClassTitle) selectedClassTitle.textContent = cls.name;
    if (selectedClassMeta) {
      selectedClassMeta.textContent = `المستوى: ${cls.level || "-"} | القاعة: ${cls.room || "-"}`;
    }

    if (classTableScreen) classTableScreen.classList.remove("hidden");

    renderStudentList();
    setupAbsenceTab();
    renderEvaluationTable();
  };

  const backToClassesBtn = document.getElementById("backToClassesBtn");
  if (backToClassesBtn) {
    backToClassesBtn.addEventListener("click", () => {
      const classTableScreen = document.getElementById("classTableScreen");
      if (classTableScreen) classTableScreen.classList.add("hidden");
      state.selectedClassId = null;
    });
  }

  const addClassBtn = document.getElementById("addClassBtn");
  if (addClassBtn) {
    addClassBtn.addEventListener("click", () => {
      showModal("إضافة قسم جديد", `
        <div class="field">
          <label>اسم القسم (مثال: 3 م 1)</label>
          <input type="text" id="modalClassName" placeholder="3 م 1">
        </div>
        <div class="field">
          <label>المستوى</label>
          <select id="modalClassLevel">
            <option value="1AM">السنة الأولى متوسط</option>
            <option value="2AM">السنة الثانية متوسط</option>
            <option value="3AM">السنة الثالثة متوسط</option>
            <option value="4AM">السنة الرابعة متوسط</option>
          </select>
        </div>
        <div class="field">
          <label>القاعة</label>
          <input type="text" id="modalClassRoom" placeholder="القاعة 04">
        </div>
        <div class="form-actions">
          <button class="primary-btn" id="confirmAddClassBtn">حفظ القسم</button>
        </div>
      `);

      setTimeout(() => {
        const confirmBtn = document.getElementById("confirmAddClassBtn");
        if (confirmBtn) {
          confirmBtn.addEventListener("click", async () => {
            const nameEl = document.getElementById("modalClassName");
            const levelEl = document.getElementById("modalClassLevel");
            const roomEl = document.getElementById("modalClassRoom");

            const name = nameEl ? nameEl.value.trim() : "";
            const level = levelEl ? levelEl.value.trim() : "";
            const room = roomEl ? roomEl.value.trim() : "";

            if (!name) {
              showToast("يرجى إدخال اسم القسم", "warning");
              return;
            }

            const newClass = {
              id: generateId(),
              name,
              level,
              room,
              students: []
            };

            await dbPut("classes", newClass);
            state.classes.push(newClass);
            renderClasses();
            populateClassSelectors();
            closeModal();
            showToast("تمت إضافة القسم بنجاح", "success");
          });
        }
      }, 100);
    });
  }

  const deleteClassBtn = document.getElementById("deleteClassBtn");
  if (deleteClassBtn) {
    deleteClassBtn.addEventListener("click", async () => {
      const classId = state.selectedClassId;
      if (!classId) return;

      if (!confirm("هل أنت تأكد من حذف هذا القسم وكل البيانات المتعلقة به؟")) return;

      await dbDelete("classes", classId);
      state.classes = state.classes.filter((c) => String(c.id) !== String(classId));

      const monitoringToDelete = state.monitoring.filter((m) => String(m.classId) === String(classId));
      for (const m of monitoringToDelete) {
        await dbDelete("monitoring", m.id);
      }
      state.monitoring = state.monitoring.filter((m) => String(m.classId) !== String(classId));

      const logsToDelete = state.dailyLogs.filter((l) => String(l.classId) === String(classId));
      for (const l of logsToDelete) {
        await dbDelete("dailyLogs", l.id);
      }
      state.dailyLogs = state.dailyLogs.filter((l) => String(l.classId) !== String(classId));

      const schedulesToDelete = state.schedules.filter((s) => String(s.classId) === String(classId));
      for (const s of schedulesToDelete) {
        await dbDelete("schedules", s.id);
      }
      state.schedules = state.schedules.filter((s) => String(s.classId) !== String(classId));

      const classTableScreen = document.getElementById("classTableScreen");
      if (classTableScreen) classTableScreen.classList.add("hidden");

      state.selectedClassId = null;
      renderClasses();
      renderSchedule();
      populateClassSelectors();
      showToast("تم حذف القسم وكافة سجلاته المرتبطة بنجاح", "success");
    });
  }

  function renderStudentList() {
    const cls = state.classes.find((c) => String(c.id) === String(state.selectedClassId));
    if (!cls) return;

    const tbody = document.getElementById("studentsTableBody");
    const searchInput = document.getElementById("studentSearch");
    const filterText = searchInput ? searchInput.value.trim().toLowerCase() : "";

    if (!tbody) return;

    let students = cls.students || [];
    if (filterText) {
      students = students.filter(
        (s) =>
          (s.lastName && s.lastName.toLowerCase().includes(filterText)) ||
          (s.firstName && s.firstName.toLowerCase().includes(filterText))
      );
    }

    if (students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">لا يوجد تلاميذ في هذا القسم.</td></tr>`;
      return;
    }

    tbody.innerHTML = students
      .map((student, index) => {
        const studentRecords = state.monitoring.filter((m) => String(m.studentId) === String(student.id));
        const presentCount = studentRecords.filter((m) => m.attendance === "present").length;
        const absentCount = studentRecords.filter((m) => m.attendance === "absent").length;

        return `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${escapeHTML(student.lastName || "-")}</strong></td>
          <td>${escapeHTML(student.firstName || "-")}</td>
          <td><span class="badge badge-success">${presentCount}</span></td>
          <td><span class="badge badge-danger">${absentCount}</span></td>
          <td>
            <button class="icon-button danger-text delete-student-btn" data-class-id="${escapeHTML(cls.id)}" data-student-id="${escapeHTML(student.id)}" title="حذف">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>`;
      })
      .join("");

    tbody.querySelectorAll(".delete-student-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cId = btn.getAttribute("data-class-id");
        const sId = btn.getAttribute("data-student-id");
        if (cId && sId) window.deleteStudent(cId, sId);
      });
    });
  }

  const studentSearch = document.getElementById("studentSearch");
  if (studentSearch) {
    studentSearch.addEventListener("input", renderStudentList);
  }

  window.deleteStudent = async function (classId, studentId) {
    const cls = state.classes.find((c) => String(c.id) === String(classId));
    if (!cls) return;

    if (!confirm("هل أنت تأكد من حذف هذا التلميذ وسجلاته؟")) return;

    cls.students = cls.students.filter((s) => String(s.id) !== String(studentId));
    await dbPut("classes", cls);

    const recordsToDelete = state.monitoring.filter((m) => String(m.studentId) === String(studentId));
    for (const record of recordsToDelete) {
      await dbDelete("monitoring", record.id);
    }
    state.monitoring = state.monitoring.filter((m) => String(m.studentId) !== String(studentId));

    showToast("تم حذف التلميذ وتنظيف كافة بياناته المترابطة بنجاح", "success");
    renderStudentList();
    renderEvaluationTable();
  };

  // استيراد ملفات Excel مع دعم كافة التنسيقات (الرقمنة، كشوف النقاط، والتسميات المتنوعة)
  const excelFileInput = document.getElementById("excelFile");
  if (excelFileInput) {
    excelFileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (typeof XLSX === "undefined") {
        showToast("تعذر تحميل مكتبة استيراد Excel (XLSX). يرجى التأكد من الاتصال.", "error");
        return;
      }

      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        // 1. قراءة البيانات كمصفوفة صفوف خام لتجنب مشكلة الترويسة العلوية
        const rawRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" });

        if (!rawRows || rawRows.length === 0) {
          showToast("الملف لا يحتوي على بيانات كافية", "warning");
          return;
        }

        // 2. البحث الديناميكي عن السطر الذي يحتوي على عناوين الأعمدة
        const targetHeaders = ["اللقب", "الاسم", "nom", "prenom", "prénom", "الاسم واللقب"];
        let headerRowIndex = -1;

        for (let i = 0; i < rawRows.length; i++) {
          const rowText = rawRows[i].join(" ").toLowerCase();
          if (targetHeaders.some(key => rowText.includes(key))) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          showToast("لم يتم العثور على عناوين صالحة (اللقب / الاسم) في الملف", "warning");
          return;
        }

        // 3. استخراج أسماء الأعمدة ومواقعها
        const headers = rawRows[headerRowIndex].map(h => String(h).trim().toLowerCase());
        const dataRows = rawRows.slice(headerRowIndex + 1);

        const lastNameIdx = headers.findIndex(h => ["اللقب", "لقب", "nom"].includes(h));
        const firstNameIdx = headers.findIndex(h => ["الاسم", "إسم", "اسم", "prenom", "prénom"].includes(h));
        const fullNameIdx = headers.findIndex(h => ["الاسم واللقب", "اللقب والاسم", "اسم التلميذ", "nom et prenom"].includes(h));

        const importedStudents = [];

        // 4. استخراج بيانات التلاميذ
        dataRows.forEach(row => {
          let lastName = lastNameIdx !== -1 ? String(row[lastNameIdx] || "").trim() : "";
          let firstName = firstNameIdx !== -1 ? String(row[firstNameIdx] || "").trim() : "";
          let fullName = fullNameIdx !== -1 ? String(row[fullNameIdx] || "").trim() : "";

          // معالجة عمود "الاسم واللقب" المدمج
          if (!lastName && !firstName && fullName) {
            const parts = fullName.split(" ").filter(Boolean);
            lastName = parts[0] || "";
            firstName = parts.slice(1).join(" ") || "غير محدد";
          }

          if (lastName || firstName) {
            importedStudents.push({
              id: generateId(),
              lastName: lastName || "غير محدد",
              firstName: firstName || "غير محدد"
            });
          }
        });

        if (importedStudents.length === 0) {
          showToast("لم يتم العثور على أسماء صالحة في الملف", "warning");
          return;
        }

        const classNamePrompt = prompt("أدخل اسم القسم الجديد لهذه القائمة:", file.name.replace(/\.[^/.]+$/, ""));
        if (!classNamePrompt) return;

        const classLevel = getClassLevel("");

if (classLevel === null) {
  return;
}
           
const newClass = {
  id: generateId(),
  name: classNamePrompt.trim(),
  level: classLevel,
  room: "غير محددة",
  students: importedStudents
};

        await dbPut("classes", newClass);
        state.classes.push(newClass);
        renderClasses();
        populateClassSelectors();
        showToast(`تم استيراد ${importedStudents.length} تلميذ بنجاح`, "success");
      } catch (err) {
        console.error("خطأ قراءة Excel:", err);
        showToast("فشل قراءة ملف Excel", "error");
      } finally {
        excelFileInput.value = "";
      }
    });
  }

  const exportClassBtn = document.getElementById("exportClassBtn");
  if (exportClassBtn) {
    exportClassBtn.addEventListener("click", () => {
      const cls = state.classes.find((c) => String(c.id) === String(state.selectedClassId));
      if (!cls || !cls.students || cls.students.length === 0) {
        showToast("لا توجد بيانات لتصديرها", "warning");
        return;
      }

      if (typeof XLSX === "undefined") {
        showToast("مكتبة تصدير Excel غير متوفرة", "error");
        return;
      }

      const exportData = cls.students.map((s, idx) => ({
    "اللقب": s.lastName,
    "الاسم": s.firstName,
    "الفرض": s.fard !== undefined ? s.fard : "",
    "الاختبار": s.ikhtibar !== undefined ? s.ikhtibar : "",
    "مراقبة مستمرة": s.totalScore !== undefined ? s.totalScore : ""
}));




 

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, cls.name);
      XLSX.writeFile(workbook, `قائمة_تلاميذ_${cls.name}.xlsx`);
      showToast("تم تصدير القائمة بنجاح", "success");
    });
  }
  const addStudentBtn = document.getElementById("addStudentBtn");
  if (addStudentBtn) {
    addStudentBtn.addEventListener("click", () => {
      if (!state.selectedClassId) {
        showToast("يرجى اختيار القسم أولاً", "warning");
        return;
      }

      showModal("إضافة تلميذ جديد", `
        <div class="field">
          <label>اللقب</label>
          <input type="text" id="modalStudentLastName" placeholder="اللقب">
        </div>
        <div class="field">
          <label>الاسم</label>
          <input type="text" id="modalStudentFirstName" placeholder="الاسم">
        </div>
        <div class="form-actions">
          <button class="primary-btn" id="confirmAddStudentBtn">حفظ التلميذ</button>
        </div>
      `);

      setTimeout(() => {
        const confirmBtn = document.getElementById("confirmAddStudentBtn");
        if (confirmBtn) {
          confirmBtn.addEventListener("click", async () => {
            const lastNameEl = document.getElementById("modalStudentLastName");
            const firstNameEl = document.getElementById("modalStudentFirstName");

            const lastName = lastNameEl ? lastNameEl.value.trim() : "";
            const firstName = firstNameEl ? firstNameEl.value.trim() : "";

            if (!lastName && !firstName) {
              showToast("يرجى إدخال اللقب أو الاسم على الأقل", "warning");
              return;
            }

            const cls = state.classes.find((c) => String(c.id) === String(state.selectedClassId));
            if (!cls) return;

            if (!cls.students) {
              cls.students = [];
            }

            const newStudent = {
              id: generateId(),
              lastName: lastName || "غير محدد",
              firstName: firstName || "غير محدد"
            };

            cls.students.push(newStudent);

            await dbPut("classes", cls);
            renderStudentList();
            renderEvaluationTable();
            closeModal();
            showToast("تمت إضافة التلميذ بنجاح", "success");
          });
        }
      }, 100);
    });
  }

  document.querySelectorAll("#classTableScreen .tab").forEach((tabBtn) => {
    tabBtn.addEventListener("click", () => {
      document.querySelectorAll("#classTableScreen .tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll("#classTableScreen .tab-content").forEach((tc) => tc.classList.remove("active"));

      tabBtn.classList.add("active");
      const targetId = tabBtn.getAttribute("data-tab");
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add("active");
    });
  });

  function setupAbsenceTab() {
    const filterDateInput = document.getElementById("filterDateInput");
    if (filterDateInput && !filterDateInput.value) {
      filterDateInput.value = new Date().toISOString().split("T")[0];
    }
    renderAbsenceHistory();
  }

  const loadSessionBtn = document.getElementById("loadSessionBtn");
  if (loadSessionBtn) {
    loadSessionBtn.addEventListener("click", () => {
      const filterDateEl = document.getElementById("filterDateInput");
      const filterSessionEl = document.getElementById("filterSessionNumSelect");
      const dateVal = filterDateEl ? filterDateEl.value : "";
      const sessionVal = filterSessionEl ? filterSessionEl.value : "";
      const cls = state.classes.find((c) => String(c.id) === String(state.selectedClassId));

      if (!cls || !dateVal) return;

      const records = state.monitoring.filter(
        (m) => String(m.classId) === String(cls.id) && m.date === dateVal && String(m.session) === String(sessionVal)
      );

      const targetDiv = document.getElementById("singleSessionTable");
      if (!targetDiv) return;

      if (records.length === 0) {
        targetDiv.innerHTML = `<div class="empty-state">لا توجد سجلات متابعة مسجلة لهذه الحصة والتاريخ.</div>`;
        return;
      }

      targetDiv.innerHTML = `
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>التلميذ</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${records
                .map((r) => {
                  const st = (cls.students || []).find((s) => String(s.id) === String(r.studentId));
                  const name = st ? `${st.lastName} ${st.firstName}` : "تلميذ مجهول";
                  const isPresent = r.attendance === "present";
                  return `
                  <tr>
                    <td>${escapeHTML(name)}</td>
                    <td><span class="badge ${isPresent ? "badge-success" : "badge-danger"}">${isPresent ? "حاضر" : "غائب"}</span></td>
                  </tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>`;
    });
  }

  function renderAbsenceHistory() {
    const cls = state.classes.find((c) => String(c.id) === String(state.selectedClassId || document.getElementById("monitoringClassSelect")?.value));
    const historyDiv = document.getElementById("absenceHistory");
    if (!cls || !historyDiv) return;

    const classRecords = state.monitoring.filter((m) => String(m.classId) === String(cls.id) && m.attendance === "absent");
    if (classRecords.length === 0) {
      historyDiv.innerHTML = `<p class="empty-state">لا توجد غيابات مسجلة لهذا القسم.</p>`;
      return;
    }

    const historyMap = {};
    classRecords.forEach((r) => {
      if (!historyMap[r.date]) historyMap[r.date] = [];
      const st = (cls.students || []).find((s) => String(s.id) === String(r.studentId));
      if (st) historyMap[r.date].push(`${st.lastName} ${st.firstName}`);
    });

    historyDiv.innerHTML = Object.keys(historyMap)
      .sort()
      .reverse()
      .map(
        (d) => `
      <div class="history-card">
        <strong><i class="fa-solid fa-calendar-day"></i> ${escapeHTML(d)}</strong>
        <p>الغائبون: ${escapeHTML(historyMap[d].join("، "))}</p>
      </div>`
      )
      .join("");
  }

  function renderEvaluationTable() {
    const targetClassId = state.selectedClassId || document.getElementById("monitoringClassSelect")?.value;
    const cls = state.classes.find((c) => String(c.id) === String(targetClassId));
    const tbody = document.getElementById("evaluationTableBody");
    if (!cls || !tbody) return;

    const students = cls.students || [];
    if (students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" class="empty-state">لا يوجد تلاميذ لحساب التقييم.</td></tr>`;
      return;
    }

    const weights = {
      behavior: 3,
      tools: 3,
      notebook: 3,
      participation: 3,
      individual: 3,
      group: 1,
      initiative: 1,
      absence: 3
    };

    tbody.innerHTML = students
      .map((st) => {
        const records = state.monitoring.filter((m) => String(m.studentId) === String(st.id));

        const calcScore = (key) => {
          if (records.length === 0) return weights[key];
          let totalFraction = 0;
          records.forEach((r) => {
            const val = (r.criteria && r.criteria[key]) || "A";
            if (val === "A") totalFraction += 1.0;
            else if (val === "B") totalFraction += 0.75;
            else if (val === "C") totalFraction += 0.5;
            else if (val === "D") totalFraction += 0.25;
          });
          const avgFraction = totalFraction / records.length;
          return parseFloat((avgFraction * weights[key]).toFixed(2));
        };

        const behaviorScore = calcScore("behavior");
        const toolsScore = calcScore("tools");
        const notebookScore = calcScore("notebook");
        const partScore = calcScore("participation");
        const indivScore = calcScore("individual");
        const groupScore = calcScore("group");
        const initScore = calcScore("initiative");
        const fardVal = st.fard !== undefined ? st.fard : "";
        const ikhtibarVal = st.ikhtibar !== undefined ? st.ikhtibar : "";


        // حساب عدد مرات الغياب المسجلة للطالب
        const absenceCount = records.filter(
          (r) => r.attendance === "absent" || r.type === "absence" || r.status === "absent" || r.type === "غياب"
        ).length;

        // خصم 0.5 نقطة عن كل حصة غياب مع ضمان عدم النزول عن الصفر
        const deductionPerAbsence = 0.5; 
        const absenceScore = Math.max(0, parseFloat((weights.absence - (absenceCount * deductionPerAbsence)).toFixed(2)));

        const totalScore = parseFloat(
          (behaviorScore + toolsScore + notebookScore + partScore + indivScore + groupScore + initScore + absenceScore).toFixed(2)
        );

// أضف هذا السطر هنا:
st.totalScore = totalScore;


        return `
        <tr>
          <td><strong>${escapeHTML(st.lastName)} ${escapeHTML(st.firstName)}</strong></td>
          <td>${absenceScore} / 3</td> 
          <td>${behaviorScore} / 3</td>
          <td>${toolsScore} / 3</td>
          <td>${notebookScore} / 3</td>
          <td>${partScore} / 3</td>
          <td>${indivScore} / 3</td>
          <td>${groupScore} / 1</td>
          <td>${initScore} / 1</td>
          <td><strong class="badge badge-primary">${totalScore} / 20</strong>

          </td>
                    <td>
            <input type="number" class="grade-input" data-student-id="${escapeHTML(st.id)}" data-field="fard" value="${fardVal}" min="0" max="20" step="0.25" placeholder="0">
          </td>
          <td>
            <input type="number" class="grade-input" data-student-id="${escapeHTML(st.id)}" data-field="ikhtibar" value="${ikhtibarVal}" min="0" max="20" step="0.25" placeholder="0">
          </td>

        </tr>`;
      })
      .join("");
        tbody.querySelectorAll(".grade-input").forEach((input) => {
      input.addEventListener("change", async (e) => {
        const studentId = input.getAttribute("data-student-id");
        const field = input.getAttribute("data-field");
        const value = input.value === "" ? "" : parseFloat(input.value);

        const student = cls.students.find((s) => String(s.id) === String(studentId));
        if (!student) return;

        student[field] = value;
        await dbPut("classes", cls);
        showToast("تم حفظ الدرجة بنجاح", "success");
      });
    });

  }

  // ==========================================================================
  // 8. استعمال الزمن (Schedule)
  // ==========================================================================
  function renderSchedule() {
    const grid = document.getElementById("scheduleGrid");
    if (!grid) return;

    const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];
    const sessions = [1, 2, 3, 4, 5, 6, 7, 8];

    let html = `<div class="schedule-table-wrapper"><table><thead><tr><th>اليوم / الحصة</th>`;
    sessions.forEach((s) => {
      html += `<th>الحصة ${s}</th>`;
    });
    html += `</tr></thead><tbody>`;

    days.forEach((day) => {
      html += `<tr><th>${escapeHTML(day)}</th>`;
      sessions.forEach((sNum) => {
        const item = state.schedules.find((s) => s.day === day && Number(s.sessionNum) === sNum);
        if (item) {
          const cls = state.classes.find((c) => String(c.id) === String(item.classId));
          html += `
          <td class="schedule-cell occupied" data-schedule-id="${escapeHTML(item.id)}" title="انقر للحذف">
            <div class="cell-class">${cls ? escapeHTML(cls.name) : "قسم"}</div>
            <div class="cell-subject">${escapeHTML(item.subject || "")}</div>
            <div class="cell-room">${escapeHTML(item.room || "")}</div>
          </td>`;
        } else {
          html += `<td class="schedule-cell empty"></td>`;
        }
      });
      html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    grid.innerHTML = html;

    grid.querySelectorAll(".schedule-cell.occupied").forEach((cell) => {
      cell.addEventListener("click", () => {
        const id = cell.getAttribute("data-schedule-id");
        if (id) window.deleteScheduleItem(id);
      });
    });
  }

  const addScheduleBtn = document.getElementById("addScheduleBtn");
  if (addScheduleBtn) {
    addScheduleBtn.addEventListener("click", () => {
      if (state.classes.length === 0) {
        showToast("قم بإضافة أقسام أولاً لتتمكن من جدولتها", "warning");
        return;
      }

      const classOptions = state.classes
        .map((c) => `<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)}</option>`)
        .join("");

      showModal("إضافة حصة إلى استعمال الزمن", `
        <div class="field">
          <label>اليوم</label>
          <select id="modalSchedDay">
            <option value="الأحد">الأحد</option>
            <option value="الإثنين">الإثنين</option>
            <option value="الثلاثاء">الثلاثاء</option>
            <option value="الأربعاء">الأربعاء</option>
            <option value="الخميس">الخميس</option>
          </select>
        </div>
        <div class="field">
          <label>الحصة</label>
          <select id="modalSchedSession">
            ${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<option value="${n}">الحصة ${n}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label>القسم</label>
          <select id="modalSchedClass">${classOptions}</select>
        </div>
        <div class="field">
          <label>القاعة</label>
          <input type="text" id="modalSchedRoom" placeholder="القاعة 02">
        </div>
        <div class="form-actions">
          <button class="primary-btn" id="confirmAddScheduleBtn">حفظ الحصة</button>
        </div>
      `);

      setTimeout(() => {
        const confirmBtn = document.getElementById("confirmAddScheduleBtn");
        if (confirmBtn) {
          confirmBtn.addEventListener("click", async () => {
            const dayEl = document.getElementById("modalSchedDay");
            const sessionEl = document.getElementById("modalSchedSession");
            const classEl = document.getElementById("modalSchedClass");
            const subjectEl = document.getElementById("modalSchedSubject");
            const roomEl = document.getElementById("modalSchedRoom");

            const day = dayEl ? dayEl.value : "الأحد";
            const sessionNum = sessionEl ? Number(sessionEl.value) : 1;
            const classId = classEl ? classEl.value : "";
            const subject = subjectEl ? subjectEl.value.trim() : "";
            const room = roomEl ? roomEl.value.trim() : "";

            const existing = state.schedules.find((s) => s.day === day && Number(s.sessionNum) === sessionNum);
            if (existing) {
              await dbDelete("schedules", existing.id);
              state.schedules = state.schedules.filter((s) => String(s.id) !== String(existing.id));
            }

            const newItem = {
              id: generateId(),
              day,
              sessionNum,
              classId,
              subject,
              room
            };

            await dbPut("schedules", newItem);
            state.schedules.push(newItem);
            renderSchedule();
            closeModal();
            showToast("تمت إضافة الحصة بنجاح", "success");
          });
        }
      }, 100);
    });
  }

  window.deleteScheduleItem = async function (id) {
    if (!confirm("هل تريد إزالة هذه الحصة من استعمال الزمن؟")) return;
    await dbDelete("schedules", id);
    state.schedules = state.schedules.filter((s) => String(s.id) !== String(id));
    renderSchedule();
    showToast("تمت إزالة الحصة", "info");
  };

  function populateClassSelectors() {
    const classSelectors = ["monitoringClassSelect", "logClass"];
    const options = state.classes.map((c) => `<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)}</option>`).join("");

    classSelectors.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = options;
    });
  }

  // ==========================================================================
  // 9. المتابعة والتقييم (Monitoring)
  // ==========================================================================
  const monitoringDateInput = document.getElementById("monitoringDate");
  if (monitoringDateInput && !monitoringDateInput.value) {
    monitoringDateInput.value = new Date().toISOString().split("T")[0];
  }

  const openMonitoringBtn = document.getElementById("openMonitoringBtn");
  if (openMonitoringBtn) {
    openMonitoringBtn.addEventListener("click", () => {
      const classSelect = document.getElementById("monitoringClassSelect");
      const dateSelect = document.getElementById("monitoringDate");
      const sessionSelect = document.getElementById("monitoringSession");

      const classId = classSelect ? classSelect.value : "";
      const dateVal = dateSelect ? dateSelect.value : "";
      const sessionVal = sessionSelect ? sessionSelect.value : "";

      if (!classId) {
        showToast("يرجى اختيار قسم أولاً", "warning");
        return;
      }

      const cls = state.classes.find((c) => String(c.id) === String(classId));
      if (!cls || !cls.students || cls.students.length === 0) {
        showToast("هذا القسم لا يحتوي على تلاميذ", "warning");
        return;
      }

      state.selectedClassId = classId;
      renderMonitoringGrid(cls, dateVal, sessionVal);
      renderEvaluationTable();
    });
  }

  function renderMonitoringGrid(cls, dateVal, sessionVal) {
    const tbody = document.getElementById("monitoringTableBody");
    if (!tbody) return;

    tbody.innerHTML = cls.students
      .map((st) => {
        const existing = state.monitoring.find(
          (m) =>
            String(m.studentId) === String(st.id) &&
            m.date === dateVal &&
            String(m.session) === String(sessionVal)
        ) || {
          attendance: "present",
          criteria: {
            behavior: "A",
            tools: "A",
            notebook: "A",
            participation: "A",
            individual: "A",
            group: "A",
            initiative: "A"
          }
        };

        const renderSelect = (key, val) => `
        <select data-student="${escapeHTML(st.id)}" data-key="${key}" class="criteria-select">
          <option value="A" ${val === "A" ? "selected" : ""}>A</option>
          <option value="B" ${val === "B" ? "selected" : ""}>B</option>
          <option value="C" ${val === "C" ? "selected" : ""}>C</option>
          <option value="D" ${val === "D" ? "selected" : ""}>D</option>
        </select>`;

        return `
        <tr data-student-row="${escapeHTML(st.id)}">
          <td><strong>${escapeHTML(st.lastName)} ${escapeHTML(st.firstName)}</strong></td>
          <td>
            <select data-student="${escapeHTML(st.id)}" data-key="attendance" class="attendance-select">
              <option value="present" ${existing.attendance === "present" ? "selected" : ""}>حاضر</option>
              <option value="absent" ${existing.attendance === "absent" ? "selected" : ""}>غائب</option>
            </select>
          </td>
          <td>${renderSelect("behavior", existing.criteria.behavior)}</td>
          <td>${renderSelect("tools", existing.criteria.tools)}</td>
          <td>${renderSelect("notebook", existing.criteria.notebook)}</td>
          <td>${renderSelect("participation", existing.criteria.participation)}</td>
          <td>${renderSelect("individual", existing.criteria.individual)}</td>
          <td>${renderSelect("group", existing.criteria.group)}</td>
          <td>${renderSelect("initiative", existing.criteria.initiative)}</td>
        </tr>`;
      })
      .join("");
  }

  const saveMonitoringBtn = document.getElementById("saveMonitoringBtn");
  if (saveMonitoringBtn) {
    saveMonitoringBtn.addEventListener("click", async () => {
      const classSelect = document.getElementById("monitoringClassSelect");
      const dateSelect = document.getElementById("monitoringDate");
      const sessionSelect = document.getElementById("monitoringSession");

      const classId = classSelect ? classSelect.value : "";
      const dateVal = dateSelect ? dateSelect.value : "";
      const sessionVal = sessionSelect ? sessionSelect.value : "";

      if (!classId || !dateVal) {
        showToast("يرجى تحديد البيانات الأساسية أولاً", "warning");
        return;
      }

      const rows = document.querySelectorAll("#monitoringTableBody tr[data-student-row]");
      if (rows.length === 0) {
        showToast("لا توجد بيانات لحفظها", "warning");
        return;
      }

      for (const row of rows) {
        const studentId = row.getAttribute("data-student-row");
        const attendanceSelect = row.querySelector('.attendance-select[data-key="attendance"]');
        const attendance = attendanceSelect ? attendanceSelect.value : "present";

        const getCriteriaVal = (key) => {
          const el = row.querySelector(`.criteria-select[data-key="${key}"]`);
          return el ? el.value : "A";
        };

        const criteria = {
          behavior: getCriteriaVal("behavior"),
          tools: getCriteriaVal("tools"),
          notebook: getCriteriaVal("notebook"),
          participation: getCriteriaVal("participation"),
          individual: getCriteriaVal("individual"),
          group: getCriteriaVal("group"),
          initiative: getCriteriaVal("initiative")
        };

        const existingIndex = state.monitoring.findIndex(
          (m) =>
            String(m.studentId) === String(studentId) &&
            m.date === dateVal &&
            String(m.session) === String(sessionVal)
        );

        const recordData = {
          id: existingIndex >= 0 ? state.monitoring[existingIndex].id : generateId(),
          classId,
          studentId,
          date: dateVal,
          session: sessionVal,
          attendance,
          criteria
        };

        try {
          await dbPut("monitoring", recordData);
        } catch (err) {
          console.warn("تعذر التخزين الداخلي، سيتم التحديث في الذاكرة الحالية:", err);
        }

        if (existingIndex >= 0) {
          state.monitoring[existingIndex] = recordData;
        } else {
          state.monitoring.push(recordData);
        }
      }

      showToast("تم حفظ سجل المتابعة والغياب بنجاح", "success");
      renderDashboard();
      renderEvaluationTable();
      renderAbsenceHistory();
    });
  }

// ==========================================================================
// 10. دفتر اليومي (Daily Log) + الربط مع التوزيع السنوي + التنبيه الأسبوعي
// ==========================================================================


/* ============================================================
   1) عناصر دفتر اليومي
   ============================================================ */

const logDateInput = document.getElementById("logDate");

if (logDateInput && !logDateInput.value) {
  logDateInput.value = new Date().toISOString().split("T")[0];
}


/* ============================================================
   2) دالة قراءة قيمة عنصر
   ============================================================ */

const getVal = (id) => {
  const el = document.getElementById(id);
  return el ? String(el.value || "").trim() : "";
};


/* ============================================================
   3) توحيد صيغة المستوى
   ============================================================ */

function normalizeDailyLogLevel(level) {

  if (level === null || level === undefined) {
    return "";
  }

  let value = String(level)
    .trim()
    .toUpperCase();

  value = value
    .replace(/\s+/g, "")
    .replace(/-/g, "")
    .replace(/_/g, "");

  const arabicLevels = {

    "الأولىمتوسط": "1AM",
    "الاولىمتوسط": "1AM",
    "أولىمتوسط": "1AM",
    "اولىمتوسط": "1AM",
    "1متوسط": "1AM",

    "الثانيةمتوسط": "2AM",
    "الثانيهمتوسط": "2AM",
    "ثانيةمتوسط": "2AM",
    "ثانيهمتوسط": "2AM",
    "2متوسط": "2AM",

    "الثالثةمتوسط": "3AM",
    "الثالثهمتوسط": "3AM",
    "ثالثةمتوسط": "3AM",
    "ثالثهمتوسط": "3AM",
    "3متوسط": "3AM",

    "الرابعةمتوسط": "4AM",
    "الرابعهمتوسط": "4AM",
    "رابعةمتوسط": "4AM",
    "رابعهمتوسط": "4AM",
    "4متوسط": "4AM"

  };

  if (arabicLevels[value]) {
    return arabicLevels[value];
  }

  if (
    value === "1AM" ||
    value === "1A.M" ||
    value === "1A"
  ) {
    return "1AM";
  }

  if (
    value === "2AM" ||
    value === "2A.M" ||
    value === "2A"
  ) {
    return "2AM";
  }

  if (
    value === "3AM" ||
    value === "3A.M" ||
    value === "3A"
  ) {
    return "3AM";
  }

  if (
    value === "4AM" ||
    value === "4A.M" ||
    value === "4A"
  ) {
    return "4AM";
  }

  return value;
}


/* ============================================================
   4) معرفة مستوى القسم
   ============================================================ */

function getClassLevel(classId) {

  if (!classId || !state.classes) {
    return "";
  }

  const cls = state.classes.find(
    c => String(c.id) === String(classId)
  );

  if (!cls) {
    return "";
  }

  const rawLevel =
    cls.level ||
    cls.grade ||
    cls.niveau ||
    cls.classLevel ||
    cls.levelName ||
    cls.studyLevel ||
    "";

  return normalizeDailyLogLevel(rawLevel);
}


/* ============================================================
   5) تحويل التوزيع الافتراضي إلى نفس صيغة annualResources
   ============================================================ */

function getDefaultAnnualResourcesForLevel(level) {

  const normalizedLevel =
    normalizeDailyLogLevel(level);

  if (
    typeof DEFAULT_MATH_ANNUAL_PLANS === "undefined" ||
    !DEFAULT_MATH_ANNUAL_PLANS
  ) {
    return [];
  }

  let plans = null;

  /*
     البحث أولاً بالمستوى الموحد
  */

  if (
    DEFAULT_MATH_ANNUAL_PLANS[
      normalizedLevel
    ]
  ) {

    plans =
      DEFAULT_MATH_ANNUAL_PLANS[
        normalizedLevel
      ];

  }

  /*
     محاولة البحث بالمفتاح الأصلي
  */

  if (
    !plans &&
    DEFAULT_MATH_ANNUAL_PLANS[level]
  ) {

    plans =
      DEFAULT_MATH_ANNUAL_PLANS[level];

  }

  if (!Array.isArray(plans)) {
    return [];
  }


  const result = [];


  plans.forEach(section => {

    if (!section) {
      return;
    }

    const sectionNumber =
      section.number ??
      section.sectionNumber ??
      "";

    const sectionName =
      section.name ||
      section.section ||
      section.segment ||
      "";


    if (!sectionName) {
      return;
    }


    const sectionId =
      section.id ||
      section.sectionId ||
      `${sectionNumber}_${sectionName}`;


    const month =
      section.month ||
      section.monthNumber ||
      null;


    /*
       كل مورد يتحول إلى سجل مستقل
    */

    if (
      Array.isArray(section.resources)
    ) {

      section.resources.forEach(
        (resource, index) => {

          let resourceName = "";

          if (
            typeof resource === "string"
          ) {

            resourceName =
              resource.trim();

          }

          else if (
            resource &&
            typeof resource === "object"
          ) {

            resourceName =
              resource.resource ||
              resource.name ||
              resource.title ||
              resource.lessonTitle ||
              "";

          }


          if (!resourceName) {
            return;
          }


          result.push({

            id:
              `default_${normalizedLevel}_${sectionNumber}_${index}`,

            resourceId:
              `default_${normalizedLevel}_${sectionNumber}_${index}`,

            level:
              normalizedLevel,

            sectionId:
              sectionId,

            sectionNumber:
              sectionNumber,

            section:
              sectionName,

            resource:
              resourceName,

            month:
              month,

            source:
              "default"

          });

        }
      );

    }

  });


  return result;
}


/* ============================================================
   6) الحصول على بيانات التوزيع السنوي للمستوى
   ============================================================ */

function getAnnualResourcesForLevel(level) {

  const normalizedLevel =
    normalizeDailyLogLevel(level);

  if (!normalizedLevel) {
    return [];
  }


  const allResources = [];


  /* ----------------------------------------------------------
     أولاً: التوزيع الافتراضي
     ---------------------------------------------------------- */

  const defaultResources =
    getDefaultAnnualResourcesForLevel(
      normalizedLevel
    );


  if (defaultResources.length) {

    allResources.push(
      ...defaultResources
    );

  }


  /* ----------------------------------------------------------
     ثانياً: التوزيع الذي أضافه الأستاذ يدوياً
     ---------------------------------------------------------- */

  if (
    Array.isArray(state.annualResources)
  ) {

    state.annualResources.forEach(
      item => {

        if (!item) {
          return;
        }


        const itemLevel =
          normalizeDailyLogLevel(
            item.level ||
            item.grade ||
            item.niveau ||
            item.classLevel ||
            ""
          );


        if (
          itemLevel !== normalizedLevel
        ) {
          return;
        }


        allResources.push(item);

      }
    );

  }


  /*
     إذا لم توجد بيانات
  */

  if (!allResources.length) {
    return [];
  }


  /* ----------------------------------------------------------
     إزالة التكرار
     ---------------------------------------------------------- */

  const unique = [];
  const keys = new Set();


  allResources.forEach(item => {

    const sectionNumber =
      item.sectionNumber ||
      item.number ||
      "";

    const section =
      item.section ||
      item.name ||
      item.segment ||
      "";

    const resource =
      item.resource ||
      item.lessonTitle ||
      item.name ||
      "";


    const key =
      `${normalizedLevel}|${sectionNumber}|${section}|${resource}`;


    if (keys.has(key)) {
      return;
    }


    keys.add(key);


    unique.push({
      ...item,

      level:
        normalizedLevel,

      sectionNumber:
        sectionNumber,

      section:
        section,

      resource:
        resource
    });

  });


  return unique;
}


/* ============================================================
   7) الحصول على بيانات المقطع من التوزيع الأساسي
   ============================================================ */

function getDefaultAnnualSection(
  level,
  sectionNumber,
  sectionName
) {

  const normalizedLevel =
    normalizeDailyLogLevel(level);


  if (
    typeof DEFAULT_MATH_ANNUAL_PLANS === "undefined" ||
    !DEFAULT_MATH_ANNUAL_PLANS
  ) {
    return null;
  }


  const plans =
    DEFAULT_MATH_ANNUAL_PLANS[
      normalizedLevel
    ];


  if (!Array.isArray(plans)) {
    return null;
  }


  return plans.find(section => {

    const sameNumber =
      sectionNumber !== undefined &&
      sectionNumber !== null &&
      String(section.number || "")
        .trim() ===
      String(sectionNumber || "")
        .trim();


    const sameName =
      sectionName &&
      String(
        section.name ||
        section.section ||
        ""
      ).trim() ===
      String(sectionName || "").trim();


    return sameNumber || sameName;

  }) || null;
}


/* ============================================================
   8) الحصول على شهر المقطع
   ============================================================ */

function getSectionMonth(
  level,
  sectionNumber,
  sectionName
) {

  const defaultSection =
    getDefaultAnnualSection(
      level,
      sectionNumber,
      sectionName
    );


  if (
    defaultSection &&
    defaultSection.month !== undefined &&
    defaultSection.month !== null &&
    defaultSection.month !== ""
  ) {

    return Number(
      defaultSection.month
    ) || null;

  }


  /*
     البحث أيضاً داخل annualResources
  */

  const resources =
    getAnnualResourcesForLevel(level);


  const found =
    resources.find(item => {

      const itemNumber =
        item.sectionNumber ||
        item.number ||
        "";

      const itemName =
        item.section ||
        item.name ||
        item.segment ||
        "";


      return (
        String(itemNumber) ===
          String(sectionNumber || "") &&
        String(itemName).trim() ===
          String(sectionName || "").trim()
      );

    });


  if (
    found &&
    found.month !== undefined &&
    found.month !== null &&
    found.month !== ""
  ) {

    return Number(
      found.month
    ) || null;

  }


  return null;
}


/* ============================================================
   9) حساب بداية ونهاية الشهر
   ============================================================ */

function getMonthDateRange(year, month) {

  if (!month) {
    return null;
  }


  const start =
    new Date(
      year,
      Number(month) - 1,
      1
    );


  const end =
    new Date(
      year,
      Number(month),
      0
    );


  return {
    start,
    end
  };
}


/* ============================================================
   10) حساب وضع الأستاذ بالنسبة للمقطع
   ============================================================ */

function calculateAnnualProgressStatus(
  dateString,
  month
) {

  if (
    !dateString ||
    !month
  ) {

    return {
      status: "unknown",
      label: "غير محدد",
      daysDifference: null,
      weeksDifference: null
    };

  }


  const lessonDate =
    new Date(
      `${dateString}T12:00:00`
    );


  if (
    isNaN(
      lessonDate.getTime()
    )
  ) {

    return {
      status: "unknown",
      label: "غير محدد",
      daysDifference: null,
      weeksDifference: null
    };

  }


  const year =
    lessonDate.getFullYear();


  const range =
    getMonthDateRange(
      year,
      Number(month)
    );


  if (!range) {

    return {
      status: "unknown",
      label: "غير محدد",
      daysDifference: null,
      weeksDifference: null
    };

  }


  /*
     قبل بداية شهر المقطع
  */

  if (
    lessonDate <
    range.start
  ) {

    const diffMs =
      range.start.getTime() -
      lessonDate.getTime();


    const days =
      Math.ceil(
        diffMs /
        (1000 * 60 * 60 * 24)
      );


    const weeks =
      Math.ceil(
        days / 7
      );


    if (days >= 7) {

      return {

        status:
          "ahead",

        label:
          `متقدم عن المقطع بحوالي ${weeks} أسبوع`,

        daysDifference:
          -days,

        weeksDifference:
          -weeks

      };

    }


    return {

      status:
        "on-track",

      label:
        "متقدم بأقل من أسبوع",

      daysDifference:
        -days,

      weeksDifference:
        0

    };

  }


  /*
     بعد نهاية شهر المقطع
  */

  if (
    lessonDate >
    range.end
  ) {

    const diffMs =
      lessonDate.getTime() -
      range.end.getTime();


    const days =
      Math.floor(
        diffMs /
        (1000 * 60 * 60 * 24)
      );


    const weeks =
      Math.ceil(
        days / 7
      );


    if (days >= 7) {

      return {

        status:
          "late",

        label:
          `متأخر عن المقطع بحوالي ${weeks} أسبوع`,

        daysDifference:
          days,

        weeksDifference:
          weeks

      };

    }


    return {

      status:
        "on-track",

      label:
        "متأخر بأقل من أسبوع",

      daysDifference:
        days,

      weeksDifference:
        0

    };

  }


  return {

    status:
      "on-track",

    label:
      "في المسار الزمني للمقطع",

    daysDifference:
      0,

    weeksDifference:
      0

  };

}


/* ============================================================
   11) إنشاء قائمة المقاطع
   ============================================================ */

function populateDailyLogSegments() {

  const segmentEl =
    document.getElementById(
      "logSegment"
    );


  const classId =
    getVal("logClass");


  if (!segmentEl) {
    return;
  }


  const level =
    getClassLevel(
      classId
    );


  let select =
    segmentEl;


  /*
     تحويل العنصر إلى Select
  */

  if (
    segmentEl.tagName !== "SELECT"
  ) {

    const newSelect =
      document.createElement("select");


    newSelect.id =
      segmentEl.id;


    newSelect.name =
      segmentEl.name ||
      segmentEl.id;


    newSelect.className =
      segmentEl.className;


    newSelect.required =
      segmentEl.required;


    segmentEl.parentNode.replaceChild(
      newSelect,
      segmentEl
    );


    select =
      newSelect;

  }


  select.innerHTML = `
    <option value="">اختر المقطع</option>
  `;


  if (!level) {

    select.innerHTML += `
      <option value="" disabled>
        اختر القسم أولاً
      </option>
    `;


    populateDailyLogResources(
      ""
    );


    return;

  }


  const resources =
    getAnnualResourcesForLevel(
      level
    );


  if (!resources.length) {

    select.innerHTML += `
      <option value="" disabled>
        لا توجد مقاطع لهذا المستوى
      </option>
    `;


    populateDailyLogResources(
      ""
    );


    return;

  }


  /*
     استخراج المقاطع بدون تكرار
  */

  const sections = [];
  const sectionKeys = new Set();


  resources.forEach(
    item => {

      const sectionNumber =
        item.sectionNumber ||
        item.number ||
        "";


      const sectionName =
        item.section ||
        item.name ||
        item.segment ||
        "";


      if (!sectionName) {
        return;
      }


      const sectionId =
        item.sectionId ||
        `${sectionNumber}_${sectionName}`;


      const key =
        String(sectionId);


      if (
        sectionKeys.has(key)
      ) {
        return;
      }


      sectionKeys.add(key);


      const month =
        item.month ||
        getSectionMonth(
          level,
          sectionNumber,
          sectionName
        );


      sections.push({

        id:
          sectionId,

        number:
          sectionNumber,

        name:
          sectionName,

        month:
          month

      });

    }
  );


  sections.forEach(
    section => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        section.id;


      option.dataset.sectionNumber =
        section.number || "";


      option.dataset.month =
        section.month || "";


      option.dataset.sectionName =
        section.name || "";


      let text =
        section.number
          ? `المقطع ${section.number} : ${section.name}`
          : section.name;


      if (section.month) {

        text +=
          ` — الشهر: ${section.month}`;

      }


      option.textContent =
        text;


      select.appendChild(
        option
      );

    }
  );


  /*
     عند تغيير المقطع
  */

  select.onchange =
    function () {

      populateDailyLogResources(
        this.value
      );

    };


  /*
     إذا كان هناك مقطع واحد فقط
     يمكن تحميل موارده مباشرة
  */

  if (
    select.value
  ) {

    populateDailyLogResources(
      select.value
    );

  }

}


/* ============================================================
   12) إنشاء قائمة الموارد التابعة للمقطع
   ============================================================ */

function populateDailyLogResources(
  sectionId
) {

  const lessonEl =
    document.getElementById(
      "logLessonTitle"
    );


  if (!lessonEl) {
    return;
  }


  let select =
    lessonEl;


  if (
    lessonEl.tagName !== "SELECT"
  ) {

    const newSelect =
      document.createElement(
        "select"
      );


    newSelect.id =
      lessonEl.id;


    newSelect.name =
      lessonEl.name ||
      lessonEl.id;


    newSelect.className =
      lessonEl.className;


    newSelect.required =
      lessonEl.required;


    lessonEl.parentNode.replaceChild(
      newSelect,
      lessonEl
    );


    select =
      newSelect;

  }


  select.innerHTML = `
    <option value="">اختر المورد</option>
  `;


  if (!sectionId) {
    return;
  }


  const classId =
    getVal("logClass");


  const level =
    getClassLevel(
      classId
    );


  const resources =
    getAnnualResourcesForLevel(
      level
    );


  const sectionResources =
    resources.filter(
      item => {

        const itemSectionId =
          item.sectionId ||
          `${item.sectionNumber || item.number || ""}_${item.section || item.name || ""}`;


        return (
          String(itemSectionId) ===
          String(sectionId)
        );

      }
    );


  sectionResources.forEach(
    item => {

      const resourceName =
        item.resource ||
        item.lessonTitle ||
        item.resourceName ||
        item.name ||
        "";


      if (!resourceName) {
        return;
      }


      const option =
        document.createElement(
          "option"
        );


      option.value =
        item.id ||
        item.resourceId ||
        resourceName;


      option.textContent =
        resourceName;


      option.dataset.resource =
        resourceName;


      option.dataset.month =
        item.month ||
        "";


      option.dataset.sectionId =
        item.sectionId ||
        sectionId;


      option.dataset.sectionNumber =
        item.sectionNumber ||
        item.number ||
        "";


      select.appendChild(
        option
      );

    }
  );

}


/* ============================================================
   13) عند تغيير القسم
   ============================================================ */

const logClassInput =
  document.getElementById(
    "logClass"
  );


if (logClassInput) {

  logClassInput.addEventListener(
    "change",
    () => {

      populateDailyLogSegments();


      const lessonEl =
        document.getElementById(
          "logLessonTitle"
        );


      if (lessonEl) {

        lessonEl.value =
          "";

      }

    }
  );

}


/* ============================================================
   14) تهيئة الربط عند فتح المنصة
   ============================================================ */

function initializeDailyLogAnnualLink() {

  /*
     ننتظر قليلاً حتى تكون
     state.classes و state.annualResources
     قد تم تحميلها.
  */

  setTimeout(
    () => {

      populateDailyLogSegments();

    },
    300
  );

}


initializeDailyLogAnnualLink();


/*
   إعادة التهيئة بعد تحميل الصفحة
*/

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setTimeout(
      () => {

        populateDailyLogSegments();

      },
      300
    );

  }
);


/* ============================================================
   15) مسح نموذج دفتر اليومي
   ============================================================ */

function clearDailyLogForm() {

  [
    "logField",
    "logSegment",
    "logCompetence",
    "logLessonTitle",
    "logSituation",
    "logProcedure",
    "logAssessment",
    "logHomework",
    "logNotes"
  ].forEach(
    id => {

      const el =
        document.getElementById(
          id
        );


      if (el) {

        el.value =
          "";

      }

    }
  );


  populateDailyLogSegments();

}


/* ============================================================
   16) حفظ سجل دفتر اليومي
   ============================================================ */

const saveDailyLogBtn =
  document.getElementById(
    "saveDailyLogBtn"
  );


if (saveDailyLogBtn) {

  saveDailyLogBtn.addEventListener(
    "click",
    async () => {

      const date =
        getVal("logDate");


      const classId =
        getVal("logClass");


      const lessonTitle =
        getVal("logLessonTitle");


      if (
        !date ||
        !classId ||
        !lessonTitle
      ) {

        showToast(
          "يرجى ملء البيانات الرئيسية (التاريخ، القسم، والمورد)",
          "warning"
        );


        return;

      }


      const level =
        getClassLevel(
          classId
        );


      const annualResources =
        getAnnualResourcesForLevel(
          level
        );


      const segmentId =
        getVal("logSegment");


      const segmentSelect =
        document.getElementById(
          "logSegment"
        );


      const selectedSegmentOption =
        segmentSelect &&
        segmentSelect.selectedOptions &&
        segmentSelect.selectedOptions[0]
          ? segmentSelect.selectedOptions[0]
          : null;


      const sectionNumber =
        selectedSegmentOption?.dataset?.sectionNumber ||
        "";


      const sectionMonth =
        Number(
          selectedSegmentOption?.dataset?.month ||
          0
        ) || null;


      const selectedResource =
        annualResources.find(
          item => {

            const resourceId =
              item.id ||
              item.resourceId;


            const resourceName =
              item.resource ||
              item.lessonTitle ||
              item.resourceName ||
              item.name ||
              "";


            return (
              String(resourceId) ===
                String(lessonTitle) ||
              String(resourceName) ===
                String(lessonTitle)
            );

          }
        );


      const selectedSection =
        annualResources.find(
          item => {

            const itemSectionId =
              item.sectionId ||
              `${item.sectionNumber || item.number || ""}_${item.section || item.name || ""}`;


            return (
              String(itemSectionId) ===
              String(segmentId)
            );

          }
        );


      const segmentName =
        selectedSection?.section ||
        selectedSection?.name ||
        selectedSegmentOption?.dataset?.sectionName ||
        "";


      const resourceName =
        selectedResource?.resource ||
        selectedResource?.lessonTitle ||
        selectedResource?.resourceName ||
        selectedResource?.name ||
        lessonTitle;


      const finalMonth =
        Number(
          selectedResource?.month ||
          selectedSection?.month ||
          sectionMonth ||
          getSectionMonth(
            level,
            selectedSection?.sectionNumber ||
            selectedSection?.number ||
            sectionNumber,
            segmentName
          ) ||
          0
        ) || null;


      const progress =
        calculateAnnualProgressStatus(
          date,
          finalMonth
        );


      const logEntry = {

        id:
          generateId(),

        date:
          date,

        classId:
          classId,

        session:
          getVal("logSession"),

        annualLevel:
          level,

        sectionId:
          selectedSection?.sectionId ||
          segmentId,

        section:
          segmentName,

        sectionNumber:
          selectedSection?.sectionNumber ||
          selectedSection?.number ||
          sectionNumber,

        sectionMonth:
          finalMonth,

        resourceId:
          selectedResource?.id ||
          selectedResource?.resourceId ||
          "",

        resource:
          resourceName,

        progressStatus:
          progress.status,

        progressLabel:
          progress.label,

        progressDaysDifference:
          progress.daysDifference,

        progressWeeksDifference:
          progress.weeksDifference,

        field:
          getVal("logField"),

        segment:
          segmentName,

        competence:
          getVal("logCompetence"),

        lessonTitle:
          resourceName,

        situation:
          getVal("logSituation"),

        procedure:
          getVal("logProcedure"),

        assessment:
          getVal("logAssessment"),

        homework:
          getVal("logHomework"),

        notes:
          getVal("logNotes"),

        createdAt:
          new Date().toISOString()

      };


      await dbPut(
        "dailyLogs",
        logEntry
      );


      state.dailyLogs.push(
        logEntry
      );


      renderDailyLogs();


      clearDailyLogForm();


      if (
        progress.status ===
        "late"
      ) {

        showToast(
          `⚠️ تنبيه: أنت متأخر عن هذا المقطع بحوالي ${progress.weeksDifference} أسبوع.`,
          "warning"
        );

      }

      else if (
        progress.status ===
        "ahead"
      ) {

        showToast(
          `ℹ️ تنبيه: أنت متقدم عن هذا المقطع بحوالي ${Math.abs(progress.weeksDifference)} أسبوع.`,
          "info"
        );

      }

      else {

        showToast(
          "تم حفظ السجل وربطه بالتوزيع السنوي.",
          "success"
        );

      }

    }
  );

}


/* ============================================================
   17) زر سجل جديد
   ============================================================ */

const newDailyLogBtn =
  document.getElementById(
    "newDailyLogBtn"
  );


if (newDailyLogBtn) {

  newDailyLogBtn.addEventListener(
    "click",
    clearDailyLogForm
  );

}


/* ============================================================
   18) زر الطباعة
   ============================================================ */

document.addEventListener(
  "click",
  (e) => {

    const printBtn =
      e.target.closest(
        "#printLogsBtn"
      );


    if (!printBtn) {
      return;
    }


    e.preventDefault();


    window.print();

  }
);


/* ============================================================
   19) حذف السجلات
   ============================================================ */

const listDiv =
  document.getElementById(
    "logsTableBody"
  );


if (listDiv) {

  listDiv.addEventListener(
    "click",
    async (e) => {

      const deleteBtn =
        e.target.closest(
          ".delete-log-btn"
        );


      if (!deleteBtn) {
        return;
      }


      const id =
        deleteBtn.getAttribute(
          "data-log-id"
        );


      if (id) {

        await window.deleteDailyLog(
          id
        );

      }

    }
  );

}


/* ============================================================
   20) عرض سجلات دفتر اليومي
   ============================================================ */

function renderDailyLogs() {

  const listDiv =
    document.getElementById(
      "logsTableBody"
    );


  if (!listDiv) {
    return;
  }


  if (
    !state.dailyLogs ||
    state.dailyLogs.length === 0
  ) {

    listDiv.innerHTML = `
      <tr class="empty-row">
        <td colspan="10"
            style="text-align:center;color:#888;">
          لا توجد سجلات مطابقة حتى الآن.
        </td>
      </tr>
    `;


    return;

  }


  listDiv.innerHTML =
    state.dailyLogs
      .map(
        log => {

          const cls =
            state.classes.find(
              c =>
                String(c.id) ===
                String(log.classId)
            );


          let progressHTML =
            `<span>—</span>`;


          if (
            log.progressStatus ===
            "late"
          ) {

            progressHTML = `
              <span
                title="${escapeHTML(
                  log.progressLabel || ""
                )}"
                style="
                  color:#b91c1c;
                  font-weight:700;
                "
              >
                ⚠️ متأخر
              </span>
            `;

          }

          else if (
            log.progressStatus ===
            "ahead"
          ) {

            progressHTML = `
              <span
                title="${escapeHTML(
                  log.progressLabel || ""
                )}"
                style="
                  color:#2563eb;
                  font-weight:700;
                "
              >
                ↑ متقدم
              </span>
            `;

          }

          else if (
            log.progressStatus ===
            "on-track"
          ) {

            progressHTML = `
              <span
                title="${escapeHTML(
                  log.progressLabel || ""
                )}"
                style="
                  color:#15803d;
                  font-weight:700;
                "
              >
                ✓ في المسار
              </span>
            `;

          }


          return `
            <tr>

              <td>
                ${escapeHTML(
                  log.date || "-"
                )}
              </td>

              <td>
                ${
                  cls
                    ? escapeHTML(cls.name)
                    : "قسم"
                }
              </td>

              <td>
                ${escapeHTML(
                  log.session || "-"
                )}
              </td>

              <td>
                ${escapeHTML(
                  log.field || "-"
                )}
              </td>

              <td>
                ${escapeHTML(
                  log.segment || "-"
                )}
              </td>

              <td>
                ${escapeHTML(
                  log.lessonTitle ||
                  log.resource ||
                  "-"
                )}
              </td>

              <td>
                ${progressHTML}
              </td>

              <td>
                ${escapeHTML(
                  log.assessment || "-"
                )}
              </td>

              <td>
                ${escapeHTML(
                  log.homework || "-"
                )}
              </td>

              <td>
                ${escapeHTML(
                  log.notes || "-"
                )}
              </td>

              <td class="print-hide">

                <button
                  class="icon-button danger-text delete-log-btn"
                  data-log-id="${escapeHTML(log.id)}"
                  title="حذف السجل">

                  <i class="fa-solid fa-trash"></i>

                </button>

              </td>

            </tr>
          `;

        }
      )
      .join("");

}


/* ============================================================
   21) حذف سجل دفتر اليومي
   ============================================================ */

window.deleteDailyLog =
  async function (id) {

    if (
      !confirm(
        "هل تريد حذف هذا السجل من الدفتر اليومي؟"
      )
    ) {

      return;

    }


    await dbDelete(
      "dailyLogs",
      id
    );


    state.dailyLogs =
      state.dailyLogs.filter(
        l =>
          String(l.id) !==
          String(id)
      );


    renderDailyLogs();


    showToast(
      "تم حذف السجل بنجاح",
      "info"
    );

  };


// ==========================================================================
// 11. التوزيع السنوي
// ==========================================================================
// النظام:
// المستوى → المقاطع → الموارد
//
// بدون:
// - رفع ملفات
// - PDF
// - Word
// - Excel
// - PDF.js
// - OCR
// - Google Cloud Vision
// - استخراج نص
//
// الشهر محفوظ داخل المقطع والمورد.
// الأستاذ يستطيع تعديل المقاطع والموارد من داخل التطبيق.
// ==========================================================================


/* ============================================================
   1) التوزيعات السنوية الأساسية
   ============================================================ */

const DEFAULT_MATH_ANNUAL_PLANS = {

  "1AM": [

    {
      number: 1,
      name: "الأعداد الطبيعية والأعداد العشرية (01)",
      month: 9,

      resources: [
        "الوضعية الانطلاقية",
        "جمع وطرح وضرب أعداد طبيعية في وضعيات معطاة",
        "استعمال الكتابة العشرية والكتابة الكسرية والانتقال بينهما",
        "ضرب عدد عشري في 10 و100 و1000 أو في 0.1 و0.01 و0.001",
        "قسمة عدد عشري على 10 و100 و1000 أو على 0.1 و0.01 و0.001",
        "مقارنة عددين عشريين وترتيب أعداد عشرية",
        "جمع وطرح وضرب أعداد عشرية في وضعية معينة",
        "رتبة مقدار لنتيجة حساب على الأعداد العشرية",
        "حل الوضعية الانطلاقية",
        "وضعية تقويمية",
        "تقديم الوظيفة المنزلية الأولى"
      ]
    },

    {
      number: 2,
      name: "انجاز مماثلات أشكال مستوية بسيطة\n• السطوح المستوية: الأطوال، المحيطات، المساحات",
      month: 10,

      resources: [
        "وضعية انطلاقية",
        "الاستعمال السليم في وضعيات مغطاة للمصطلحات(مستقيم،نصف مستقيم،قطعة مستقيم،منتصف قطعة مستقيم،مستقيمات المتوازية،مستقيمان متعامدان،استقامية النقط",
        "رسم مستقيم عمودي على مستقيم معلوم ويشمل نقطة معلومة",
        "رسم مستقيم موازي المستقيم معلوم ويشمل نقطة معلومة",
        "انشاء مثيل لقطعة و انشاء منتصف",
        "انجاز مثيل لكل من مثلث : متساوي الساقين ،مثلث قائم ،مثلث متقايس الاضلاع على ورقة بيضاء",
        "انجاز مثيل لمستطيل،مربع ،معين على ورقة بيضاء",
        "انجاز مثيل لدائرة ،انجاز مثيل لقوس معطاة",
        "الاستعمال السليم للمصطلحات (دائرة،التوتر،القطر،نصف قطر،قوس دائرة،داخل وخارج دائرة)",
      "عرض حال الوظيفة المنزلية الأولى ",
      "الفرض المحروس الأول ",
      "تعيين مساحة سطح مستو باستعمال رصف بسيط",
      "مقارنة مساحات في وضعيات بسيطة ",
      "عرض حال الفرض المحروس الأول",
      "وحدات الطول و وحدات المساحة(جدول التحويلات)",
      "حساب محيط ومساحة مربع",
      "حساب محيط ومساحة مثلث قائم ",
      "حساب محيط قرص +تقديم الوظيفة المنزلية الثانية",
      "حل وضعية انطلاق",
      "وضعية تقويمية ",
      "معالجة محتملة",
      "عرض حال الوظيفة المنزلية الثانية "
      ]
    },

    {
      number: 3,
      name: "ضع اسم المقطع الثالث هنا",
      month: 11,

      resources: [
        "ضع المورد الأول هنا",
        "ضع المورد الثاني هنا",
        "ضع المورد الثالث هنا"
      ]
    }
{
      number: 3,
      name: "ضع اسم المقطع الثالث هنا",
      month: 11,

      resources: [
        "ضع المورد الأول هنا",
        "ضع المورد الثاني هنا",
        "ضع المورد الثالث هنا"
      ]
    }
  ],


  "2AM": [

    {
      number: 1,
      name: "ضع اسم المقطع الأول هنا",
      month: 9,

      resources: [
        "ضع المورد الأول هنا",
        "ضع المورد الثاني هنا",
        "ضع المورد الثالث هنا"
      ]
    },

    {
      number: 2,
      name: "ضع اسم المقطع الثاني هنا",
      month: 10,

      resources: [
        "ضع المورد الأول هنا",
        "ضع المورد الثاني هنا",
        "ضع المورد الثالث هنا"
      ]
    },

    {
      number: 3,
      name: "ضع اسم المقطع الثالث هنا",
      month: 11,

      resources: [
        "ضع المورد الأول هنا",
        "ضع المورد الثاني هنا",
        "ضع المورد الثالث هنا"
      ]
    },

    {
      number: 4,
      name: "ضع اسم المقطع الرابع هنا",
      month: 12,

      resources: [
        "ضع المورد الأول هنا",
        "ضع المورد الثاني هنا",
        "ضع المورد الثالث هنا"
      ]
    }

  ],


  "3AM": [

    {
      number: 1,
      name: "ضع اسم المقطع الأول هنا",
      month: 9,

      resources: [
        "ضع المورد الأول هنا",
        "ضع المورد الثاني هنا",
        "ضع المورد الثالث هنا"
      ]
    },

    {
      number: 2,
      name: "ضع اسم المقطع الثاني هنا",
      month: 10,

      resources: [
        "ضع المورد الأول هنا",
        "ضع المورد الثاني هنا",
        "ضع المورد الثالث هنا"
      ]
    },

    {
      number: 3,
      name: "ضع اسم المقطع الثالث هنا",
      month: 11,

      resources: [
        "ضع المورد الأول هنا",
        "ضع المورد الثاني هنا",
        "ضع المورد الثالث هنا"
      ]
    },

    {
      number: 4,
      name: "ضع اسم المقطع الرابع هنا",
      month: 12,

      resources: [
        "ضع المورد الأول هنا",
        "ضع المورد الثاني هنا",
        "ضع المورد الثالث هنا"
      ]
    }

  ],


  "4AM": [

    {
      number: 1,
      name: "ضع اسم المقطع الأول هنا",
      month: 9,

      resources: [
        "ضع المورد الأول هنا",
        "ضع المورد الثاني هنا",
        "ضع المورد الثالث هنا"
      ]
    },

    {
      number: 2,
      name: "ضع اسم المقطع الثاني هنا",
      month: 10,

      resources: [
        "ضع المورد الأول هنا",
        "ضع المورد الثاني هنا",
        "ضع المورد الثالث هنا"
      ]
    },

    {
      number: 3,
      name: "ضع اسم المقطع الثالث هنا",
      month: 11,

      resources: [
        "ضع المورد الأول هنا",
        "ضع المورد الثاني هنا",
        "ضع المورد الثالث هنا"
      ]
    },

    {
      number: 4,
      name: "ضع اسم المقطع الرابع هنا",
      month: 12,

      resources: [
        "ضع المورد الأول هنا",
        "ضع المورد الثاني هنا",
        "ضع المورد الثالث هنا"
      ]
    }

  ],


  "OTHER": [

    {
      number: 1,
      name: "ضع مقطع 1",
      month: 9,

      resources: [
        "ضع المورد الأول هنا",
        "ضع المورد الثاني هنا",
        "ضع المورد الثالث هنا"
      ]
    },

    {
      number: 2,
      name: "ضع مقطع 2",
      month: 10,

      resources: [
        "ضع المورد الأول هنا",
        "ضع المورد الثاني هنا",
        "ضع المورد الثالث هنا"
      ]
    },

    {
      number: 3,
      name: "ضع مقطع 3",
      month: 11,

      resources: [
        "ضع المورد الأول هنا",
        "ضع المورد الثاني هنا",
        "ضع المورد الثالث هنا"
      ]
    },

    {
      number: 4,
      name: "ضع مقطع 4",
      month: 12,

      resources: [
        "ضع المورد الأول هنا",
        "ضع المورد الثاني هنا",
        "ضع المورد الثالث هنا"
      ]
    }

  ]

};


/* ============================================================
   2) أسماء المستويات
   ============================================================ */

const ANNUAL_LEVEL_NAMES = {

  "1AM": "السنة الأولى متوسط",

  "2AM": "السنة الثانية متوسط",

  "3AM": "السنة الثالثة متوسط",

  "4AM": "السنة الرابعة متوسط",

  "OTHER": "مستوى آخر"

};


/* ============================================================
   3) المستوى المختار
   ============================================================ */

let currentAnnualLevel = "1AM";


/* ============================================================
   4) أدوات مساعدة
   ============================================================ */

function getAnnualLevelName(level) {

  return (
    ANNUAL_LEVEL_NAMES[level] ||
    level ||
    "مستوى آخر"
  );

}


/* ------------------------------------------------------------
   إنشاء ID للتوزيع
------------------------------------------------------------ */

function createAnnualId(prefix) {

  if (typeof generateId === "function") {

    return generateId();

  }

  return (
    prefix +
    "_" +
    Date.now() +
    "_" +
    Math.random()
      .toString(36)
      .substring(2, 9)
  );

}


/* ------------------------------------------------------------
   التأكد من وجود المصفوفات
------------------------------------------------------------ */

function ensureAnnualState() {

  if (!Array.isArray(state.annualFiles)) {

    state.annualFiles = [];

  }

  if (!Array.isArray(state.annualResources)) {

    state.annualResources = [];

  }

}


/* ============================================================
   5) إنشاء مقطع
   ============================================================ */

function createAnnualSection(
  level,
  number,
  name,
  month = null
) {

  return {

    id: createAnnualId("section"),

    level: level,

    number: Number(number) || 1,

    name: String(name || "").trim(),

    /*
       الشهر الخاص بالمقطع
    */

    month:
      Number(month) || null,

    resources: [],

    createdAt: Date.now(),

    updatedAt: Date.now()

  };

}


/* ============================================================
   6) إنشاء مورد
   ============================================================ */

function createAnnualResource(
  fileId,
  section,
  resourceName
) {

  return {

    id: createAnnualId("resource"),

    fileId: fileId,

    sectionId: section.id,

    level: section.level,

    sectionNumber: section.number,

    section: section.name,

    /*
       حفظ الشهر داخل المورد أيضًا
    */

    month:
      Number(section.month) || null,

    resource:
      String(resourceName || "").trim(),

    createdAt: Date.now(),

    updatedAt: Date.now()

  };

}


/* ============================================================
   7) إنشاء التوزيع الأساسي من البيانات الموجودة في الكود
   ============================================================ */

function buildDefaultAnnualPlan(level) {

  const source =
    DEFAULT_MATH_ANNUAL_PLANS[level] || [];


  const fileId =
    createAnnualId("annual");


  const sections = [];


  source.forEach((item, index) => {

    const section =
      createAnnualSection(
        level,
        item.number || index + 1,
        item.name || `المقطع ${index + 1}`,
        item.month || null
      );


    const resources =
      Array.isArray(item.resources)
        ? item.resources
        : [];


    resources.forEach(resourceName => {

      const resource =
        createAnnualResource(
          fileId,
          section,
          resourceName
        );


      section.resources.push(resource);

    });


    sections.push(section);

  });


  return {

    id: fileId,

    level: level,

    name:
      `التوزيع السنوي - ${getAnnualLevelName(level)}`,

    isDefaultPlan: true,

    sections: sections,

    resourceCount:
      sections.reduce(
        (total, section) =>
          total +
          (
            Array.isArray(section.resources)
              ? section.resources.length
              : 0
          ),
        0
      ),

    createdAt: Date.now(),

    updatedAt: Date.now()

  };

}


/* ============================================================
   8) حذف التوزيع الأساسي القديم لنفس المستوى
   ============================================================ */

async function deleteExistingDefaultAnnualPlan(level) {

  ensureAnnualState();


  const oldFiles =
    state.annualFiles.filter(file =>

      file &&
      file.level === level &&
      file.isDefaultPlan === true

    );


  for (const file of oldFiles) {

    const resources =
      state.annualResources.filter(
        resource =>
          resource.fileId === file.id
      );


    for (const resource of resources) {

      try {

        if (typeof dbDelete === "function") {

          await dbDelete(
            "annualResources",
            resource.id
          );

        }

      } catch (error) {

        console.warn(
          "تعذر حذف المورد:",
          error
        );

      }

    }


    try {

      if (typeof dbDelete === "function") {

        await dbDelete(
          "annualFiles",
          file.id
        );

      }

    } catch (error) {

      console.warn(
        "تعذر حذف التوزيع:",
        error
      );

    }


    state.annualResources =
      state.annualResources.filter(
        resource =>
          resource.fileId !== file.id
      );


    state.annualFiles =
      state.annualFiles.filter(
        item =>
          item.id !== file.id
      );

  }

}


/* ============================================================
   9) حفظ التوزيع الأساسي
   ============================================================ */

async function saveDefaultAnnualPlan(level) {

  ensureAnnualState();


  await deleteExistingDefaultAnnualPlan(level);


  const file =
    buildDefaultAnnualPlan(level);


  /*
     نحفظ الملف الرئيسي
  */

  if (typeof dbPut === "function") {

    await dbPut(
      "annualFiles",
      file
    );

  }


  state.annualFiles.push(file);


  /*
     نحفظ الموارد
  */

  for (const section of file.sections) {

    if (!Array.isArray(section.resources)) {

      section.resources = [];

    }


    for (const resource of section.resources) {

      if (typeof dbPut === "function") {

        await dbPut(
          "annualResources",
          resource
        );

      }

      state.annualResources.push(resource);

    }

  }


  currentAnnualLevel = level;


  renderAnnualFiles();


  showAnnualMessage(
    "تم تحميل التوزيع الأساسي بنجاح"
  );

}


/* ============================================================
   10) البحث عن الملف المناسب للمستوى
   ============================================================ */

function getAnnualFileForLevel(level) {

  ensureAnnualState();


  /*
     نعطي الأولوية للتوزيع الأساسي.
  */

  let file =
    state.annualFiles.find(
      item =>
        item.level === level &&
        item.isDefaultPlan === true
    );


  /*
     إذا لم يوجد، نبحث عن أي توزيع للمستوى.
  */

  if (!file) {

    file =
      state.annualFiles.find(
        item =>
          item.level === level
      );

  }


  return file || null;

}


/* ============================================================
   11) تحديث ملخص التوزيع
   ============================================================ */

function updateAnnualSummary(
  sectionCount,
  resourceCount
) {

  const summary =
    document.getElementById(
      "annualPlanSummary"
    );


  if (!summary) return;


  summary.innerHTML = `

    <span>
      ${sectionCount} مقطع
    </span>

    <span>
      ${resourceCount} مورد
    </span>

    <button
      type="button"
      class="primary-btn"
      onclick="addAnnualSectionPrompt('${currentAnnualLevel}')"
      style="margin-inline-start:8px;"
    >
      <i class="fa-solid fa-plus"></i>
      إضافة مقطع
    </button>

  `;

}


/* ============================================================
   12) رسالة صغيرة
   ============================================================ */

function showAnnualMessage(message) {

  if (
    typeof showToast === "function"
  ) {

    showToast(message);

    return;

  }


  console.log(message);

}


/* ============================================================
   13) عرض التوزيع السنوي
   ============================================================ */

function renderAnnualFiles() {

  ensureAnnualState();


  const tbody =
    document.getElementById(
      "annualPlanFiles"
    );


  if (!tbody) return;


  const level =
    currentAnnualLevel;


  const files =
    state.annualFiles.filter(
      file =>
        file &&
        file.level === level
    );


  let sectionCount = 0;

  let resourceCount = 0;


  /*
     إذا لم يوجد أي توزيع
  */

  if (!files.length) {

    updateAnnualSummary(
      0,
      0
    );


    tbody.innerHTML = `

      <tr class="empty-annual-plan">

        <td colspan="6">

          <div class="empty-state">

            <i class="fa-solid fa-book-open"></i>

            <strong>
              لا يوجد توزيع سنوي لهذا المستوى
            </strong>

            <span>
              يمكنك تحميل التوزيع الأساسي أو إضافة المقاطع يدويًا.
            </span>

            <button
              type="button"
              class="primary-btn"
              onclick="loadDefaultMathAnnualPlan('${level}')"
              style="margin-top:12px;"
            >
              <i class="fa-solid fa-download"></i>
              تحميل التوزيع الأساسي
            </button>

          </div>

        </td>

      </tr>

    `;


    return;

  }


  let html = "";


  files.forEach(file => {

    if (!Array.isArray(file.sections)) {

      file.sections = [];

    }


    file.sections.forEach(section => {

      sectionCount++;


      /*
         التأكد من وجود resources
      */

      if (
        !Array.isArray(section.resources)
      ) {

        section.resources = [];

      }


      /*
         دعم البيانات القديمة:
         إذا لم يكن المقطع يحمل الشهر،
         نحاول الحصول عليه من التوزيع الأساسي.
      */

      if (!section.month) {

        section.month =
          getSectionMonth(
            level,
            section.number,
            section.name
          );

      }


      /*
         نبحث أيضًا في annualResources
      */

      const dbResources =
        state.annualResources.filter(
          resource =>

            resource.fileId === file.id &&
            resource.sectionId === section.id

        );


      /*
         دمج الموارد بدون تكرار
      */

      const resourcesMap =
        new Map();


      section.resources.forEach(resource => {

        if (!resource) return;


        const id =
          resource.id ||
          createAnnualId("resource");


        /*
           دعم البيانات القديمة
        */

        if (!resource.month) {

          resource.month =
            section.month || null;

        }


        resourcesMap.set(
          id,
          resource
        );

      });


      dbResources.forEach(resource => {

        if (!resource) return;


        /*
           دعم الموارد القديمة
        */

        if (!resource.month) {

          resource.month =
            section.month || null;

        }


        resourcesMap.set(
          resource.id,
          resource
        );

      });


      const resources =
        Array.from(
          resourcesMap.values()
        );


      resourceCount +=
        resources.length;


      /*
         لا توجد موارد
      */

      if (!resources.length) {

        html += `

          <tr>

            <td>
              ${escapeHTML(
                getAnnualLevelName(level)
              )}
            </td>

            <td class="section-number">
              ${escapeHTML(
                String(section.number)
              )}
            </td>

            <td class="section-name">
              ${escapeHTML(
                section.name
              )}
            </td>

            <td class="resource-name">

              <span style="color:var(--muted);">
                لا توجد موارد بعد
              </span>

            </td>

            <td class="file-name">
              التوزيع السنوي
            </td>

            <td class="actions">

              <button
                type="button"
                class="table-action"
                title="إضافة مورد"
                onclick="addAnnualResourcePrompt('${file.id}','${section.id}')"
              >
                <i class="fa-solid fa-plus"></i>
              </button>

              <button
                type="button"
                class="table-action"
                title="تعديل المقطع"
                onclick="editAnnualSectionPrompt('${file.id}','${section.id}')"
              >
                <i class="fa-solid fa-pen"></i>
              </button>

              <button
                type="button"
                class="table-action"
                title="حذف المقطع"
                onclick="deleteAnnualSection('${file.id}','${section.id}')"
              >
                <i class="fa-solid fa-trash"></i>
              </button>

            </td>

          </tr>

        `;


        return;

      }


      /*
         عرض كل مورد في صف مستقل
      */

      resources.forEach(resource => {

        html += `

          <tr>

            <td>
              ${escapeHTML(
                getAnnualLevelName(level)
              )}
            </td>

            <td class="section-number">
              ${escapeHTML(
                String(
                  resource.sectionNumber ??
                  section.number
                )
              )}
            </td>

            <td class="section-name">
              ${escapeHTML(
                resource.section ||
                section.name
              )}
            </td>

            <td class="resource-name">
              ${escapeHTML(
                resource.resource ||
                ""
              )}
            </td>

            <td class="file-name">
              التوزيع السنوي
            </td>

            <td class="actions">

              <button
                type="button"
                class="table-action"
                title="إضافة مورد"
                onclick="addAnnualResourcePrompt('${file.id}','${section.id}')"
              >
                <i class="fa-solid fa-plus"></i>
              </button>

              <button
                type="button"
                class="table-action"
                title="تعديل المورد"
                onclick="editAnnualResourcePrompt('${file.id}','${section.id}','${resource.id}')"
              >
                <i class="fa-solid fa-pen"></i>
              </button>

              <button
                type="button"
                class="table-action"
                title="حذف المورد"
                onclick="deleteAnnualResource('${file.id}','${section.id}','${resource.id}')"
              >
                <i class="fa-solid fa-trash"></i>
              </button>

              <button
                type="button"
                class="table-action"
                title="تعديل المقطع"
                onclick="editAnnualSectionPrompt('${file.id}','${section.id}')"
              >
                <i class="fa-solid fa-layer-group"></i>
              </button>

              <button
                type="button"
                class="table-action"
                title="حذف المقطع"
                onclick="deleteAnnualSection('${file.id}','${section.id}')"
              >
                <i class="fa-solid fa-folder-minus"></i>
              </button>

            </td>

          </tr>

        `;

      });

    });

  });


  updateAnnualSummary(
    sectionCount,
    resourceCount
  );


  tbody.innerHTML =
    html ||
    `

      <tr class="empty-annual-plan">

        <td colspan="6">

          <div class="empty-state">

            <i class="fa-solid fa-book-open"></i>

            <strong>
              لا توجد بيانات
            </strong>

          </div>

        </td>

      </tr>

    `;

}


/* ============================================================
   14) الاسم القديم إن كان مستخدمًا في أجزاء أخرى
   ============================================================ */

function renderAnnualResources() {

  renderAnnualFiles();

}


/* ============================================================
   15) تحميل التوزيع الأساسي
   ============================================================ */

window.loadDefaultMathAnnualPlan =
  async function(level) {

    level =
      level ||
      currentAnnualLevel ||
      "1AM";


    const existing =
      state.annualFiles?.find(
        file =>
          file.level === level &&
          file.isDefaultPlan === true
      );


    if (existing) {

      const confirmed =
        confirm(
          "يوجد توزيع أساسي لهذا المستوى.\n\nهل تريد استبداله بالتوزيع الموجود في الكود؟"
        );


      if (!confirmed) return;

    }


    try {

      await saveDefaultAnnualPlan(
        level
      );

    } catch (error) {

      console.error(
        "خطأ في تحميل التوزيع:",
        error
      );


      showAnnualMessage(
        "حدث خطأ أثناء تحميل التوزيع"
      );

    }

  };


/* ============================================================
   16) إضافة مقطع
   ============================================================ */

window.addAnnualSectionPrompt =
  async function(level) {

    level =
      level ||
      currentAnnualLevel ||
      "1AM";


    const file =
      getAnnualFileForLevel(level);


    const name =
      prompt(
        "اكتب اسم المقطع:"
      );


    if (
      name === null ||
      !name.trim()
    ) {

      return;

    }


    const defaultNumber =
      file &&
      Array.isArray(file.sections)
        ? file.sections.length + 1
        : 1;


    const numberInput =
      prompt(
        "رقم المقطع:",
        String(defaultNumber)
      );


    if (numberInput === null) {

      return;

    }


    const number =
      Number(numberInput);


    if (!Number.isFinite(number)) {

      alert(
        "رقم المقطع غير صحيح."
      );

      return;

    }


    /*
       الشهر للمقطع المضاف يدويًا
    */

    const monthInput =
      prompt(
        "شهر المقطع (1 إلى 12):",
        ""
      );


    if (monthInput === null) {

      return;

    }


    let month =
      Number(monthInput);


    if (
      monthInput.trim() === ""
    ) {

      month = null;

    }

    else if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {

      alert(
        "الشهر غير صحيح. يجب أن يكون بين 1 و12."
      );

      return;

    }


    await addAnnualSection(
      level,
      number,
      name.trim(),
      month
    );

  };


/* ============================================================
   17) إضافة مقطع فعليًا
   ============================================================ */

async function addAnnualSection(
  level,
  number,
  name,
  month = null
) {

  ensureAnnualState();


  let file =
    getAnnualFileForLevel(level);


  /*
     إذا لم يوجد ملف للتوزيع،
     ننشئ ملفًا يدويًا.
  */

  if (!file) {

    file = {

      id: createAnnualId("annual"),

      level: level,

      name:
        `التوزيع السنوي - ${getAnnualLevelName(level)}`,

      isDefaultPlan: false,

      sections: [],

      resourceCount: 0,

      createdAt: Date.now(),

      updatedAt: Date.now()

    };


    state.annualFiles.push(file);


    if (typeof dbPut === "function") {

      await dbPut(
        "annualFiles",
        file
      );

    }

  }


  if (!Array.isArray(file.sections)) {

    file.sections = [];

  }


  const section =
    createAnnualSection(
      level,
      number,
      name,
      month
    );


  file.sections.push(
    section
  );


  file.updatedAt =
    Date.now();


  if (typeof dbPut === "function") {

    await dbPut(
      "annualFiles",
      file
    );

  }


  renderAnnualFiles();


  showAnnualMessage(
    "تمت إضافة المقطع"
  );

}


/* ============================================================
   18) تعديل المقطع
   ============================================================ */

window.editAnnualSectionPrompt =
  async function(
    fileId,
    sectionId
  ) {

    ensureAnnualState();


    const file =
      state.annualFiles.find(
        item =>
          item.id === fileId
      );


    if (!file) return;


    const section =
      file.sections?.find(
        item =>
          item.id === sectionId
      );


    if (!section) return;


    const newName =
      prompt(
        "اسم المقطع:",
        section.name
      );


    if (
      newName === null ||
      !newName.trim()
    ) {

      return;

    }


    const newNumber =
      prompt(
        "رقم المقطع:",
        String(section.number)
      );


    if (newNumber === null) {

      return;

    }


    const number =
      Number(newNumber);


    if (!Number.isFinite(number)) {

      alert(
        "رقم المقطع غير صحيح."
      );

      return;

    }


    const newMonth =
      prompt(
        "شهر المقطع (1 إلى 12):",
        section.month
          ? String(section.month)
          : ""
      );


    if (newMonth === null) {

      return;

    }


    let month =
      Number(newMonth);


    if (
      newMonth.trim() === ""
    ) {

      month = null;

    }

    else if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {

      alert(
        "الشهر غير صحيح. يجب أن يكون بين 1 و12."
      );

      return;

    }


    section.name =
      newName.trim();


    section.number =
      number;


    section.month =
      month;


    section.updatedAt =
      Date.now();


    /*
       تحديث الموارد المرتبطة بالمقطع
    */

    const resources =
      state.annualResources.filter(
        resource =>
          resource.fileId === fileId &&
          resource.sectionId === sectionId
      );


    for (const resource of resources) {

      resource.section =
        section.name;

      resource.sectionNumber =
        section.number;

      resource.month =
        section.month;

      resource.updatedAt =
        Date.now();


      if (typeof dbPut === "function") {

        await dbPut(
          "annualResources",
          resource
        );

      }

    }


    /*
       تحديث النسخ الموجودة داخل section.resources
    */

    if (
      Array.isArray(section.resources)
    ) {

      section.resources.forEach(
        resource => {

          resource.section =
            section.name;

          resource.sectionNumber =
            section.number;

          resource.month =
            section.month;

          resource.updatedAt =
            Date.now();

        }
      );

    }


    file.updatedAt =
      Date.now();


    if (typeof dbPut === "function") {

      await dbPut(
        "annualFiles",
        file
      );

    }


    renderAnnualFiles();


    showAnnualMessage(
      "تم تعديل المقطع"
    );

  };


/* ============================================================
   19) حذف مقطع
   ============================================================ */

window.deleteAnnualSection =
  async function(
    fileId,
    sectionId
  ) {

    ensureAnnualState();


    const file =
      state.annualFiles.find(
        item =>
          item.id === fileId
      );


    if (!file) return;


    const section =
      file.sections?.find(
        item =>
          item.id === sectionId
      );


    if (!section) return;


    const confirmed =
      confirm(
        `هل تريد حذف المقطع:\n\n${section.name}\n\nسيتم حذف جميع الموارد التابعة له.`
      );


    if (!confirmed) return;


    /*
       الموارد التابعة للمقطع
    */

    const resources =
      state.annualResources.filter(
        resource =>
          resource.fileId === fileId &&
          resource.sectionId === sectionId
      );


    for (const resource of resources) {

      if (typeof dbDelete === "function") {

        try {

          await dbDelete(
            "annualResources",
            resource.id
          );

        } catch (error) {

          console.warn(
            "تعذر حذف المورد:",
            error
          );

        }

      }

    }


    state.annualResources =
      state.annualResources.filter(
        resource =>
          !(
            resource.fileId === fileId &&
            resource.sectionId === sectionId
          )
      );


    /*
       حذف المقطع
    */

    file.sections =
      file.sections.filter(
        item =>
          item.id !== sectionId
      );


    file.resourceCount =
      Math.max(
        0,
        (file.resourceCount || 0) -
        resources.length
      );


    file.updatedAt =
      Date.now();


    if (typeof dbPut === "function") {

      await dbPut(
        "annualFiles",
        file
      );

    }


    renderAnnualFiles();


    showAnnualMessage(
      "تم حذف المقطع"
    );

  };


/* ============================================================
   20) إضافة مورد
   ============================================================ */

window.addAnnualResourcePrompt =
  async function(
    fileId,
    sectionId
  ) {

    ensureAnnualState();


    const file =
      state.annualFiles.find(
        item =>
          item.id === fileId
      );


    if (!file) return;


    const section =
      file.sections?.find(
        item =>
          item.id === sectionId
      );


    if (!section) return;


    const resourceName =
      prompt(
        `إضافة مورد إلى:\n${section.name}\n\nاكتب اسم المورد:`
      );


    if (
      resourceName === null ||
      !resourceName.trim()
    ) {

      return;

    }


    await addAnnualResource(
      fileId,
      sectionId,
      resourceName.trim()
    );

  };


/* ============================================================
   21) إضافة مورد فعليًا
   ============================================================ */

async function addAnnualResource(
  fileId,
  sectionId,
  resourceName
) {

  ensureAnnualState();


  const file =
    state.annualFiles.find(
      item =>
        item.id === fileId
    );


  if (!file) return;


  const section =
    file.sections?.find(
      item =>
        item.id === sectionId
    );


  if (!section) return;


  if (!Array.isArray(section.resources)) {

    section.resources = [];

  }


  const resource =
    createAnnualResource(
      fileId,
      section,
      resourceName
    );


  section.resources.push(
    resource
  );


  state.annualResources.push(
    resource
  );


  file.resourceCount =
    Number(file.resourceCount || 0) + 1;


  file.updatedAt =
    Date.now();


  if (typeof dbPut === "function") {

    await dbPut(
      "annualResources",
      resource
    );


    await dbPut(
      "annualFiles",
      file
    );

  }


  renderAnnualFiles();


  showAnnualMessage(
    "تمت إضافة المورد"
  );

}


/* ============================================================
   22) تعديل المورد
   ============================================================ */

window.editAnnualResourcePrompt =
  async function(
    fileId,
    sectionId,
    resourceId
  ) {

    ensureAnnualState();


    const file =
      state.annualFiles.find(
        item =>
          item.id === fileId
      );


    if (!file) return;


    const section =
      file.sections?.find(
        item =>
          item.id === sectionId
      );


    if (!section) return;


    let resource =
      state.annualResources.find(
        item =>
          item.id === resourceId
      );


    /*
       دعم البيانات الموجودة داخل section
    */

    if (!resource) {

      resource =
        section.resources?.find(
          item =>
            item.id === resourceId
        );

    }


    if (!resource) return;


    const newName =
      prompt(
        "تعديل اسم المورد:",
        resource.resource || ""
      );


    if (
      newName === null ||
      !newName.trim()
    ) {

      return;

    }


    resource.resource =
      newName.trim();


    /*
       الحفاظ على شهر المقطع
    */

    resource.month =
      section.month ||
      resource.month ||
      null;


    resource.updatedAt =
      Date.now();


    /*
       تحديث النسخة الموجودة داخل المقطع
    */

    const localResource =
      section.resources?.find(
        item =>
          item.id === resourceId
      );


    if (localResource) {

      localResource.resource =
        resource.resource;

      localResource.month =
        section.month ||
        localResource.month ||
        null;

      localResource.updatedAt =
        resource.updatedAt;

    } else {

      if (!Array.isArray(section.resources)) {

        section.resources = [];

      }

      section.resources.push(
        resource
      );

    }


    if (typeof dbPut === "function") {

      await dbPut(
        "annualResources",
        resource
      );

      await dbPut(
        "annualFiles",
        file
      );

    }


    renderAnnualFiles();


    showAnnualMessage(
      "تم تعديل المورد"
    );

  };


/* ============================================================
   23) حذف مورد
   ============================================================ */

window.deleteAnnualResource =
  async function(
    fileId,
    sectionId,
    resourceId
  ) {

    ensureAnnualState();


    const file =
      state.annualFiles.find(
        item =>
          item.id === fileId
      );


    if (!file) return;


    const section =
      file.sections?.find(
        item =>
          item.id === sectionId
      );


    if (!section) return;


    const resource =
      state.annualResources.find(
        item =>
          item.id === resourceId
      );


    const resourceName =
      resource?.resource ||
      section.resources?.find(
        item =>
          item.id === resourceId
      )?.resource ||
      "";


    const confirmed =
      confirm(
        `هل تريد حذف المورد؟\n\n${resourceName}`
      );


    if (!confirmed) return;


    if (typeof dbDelete === "function") {

      try {

        await dbDelete(
          "annualResources",
          resourceId
        );

      } catch (error) {

        console.warn(
          "تعذر حذف المورد:",
          error
        );

      }

    }


    state.annualResources =
      state.annualResources.filter(
        item =>
          item.id !== resourceId
      );


    section.resources =
      (section.resources || []).filter(
        item =>
          item.id !== resourceId
      );


    file.resourceCount =
      Math.max(
        0,
        Number(file.resourceCount || 0) - 1
      );


    file.updatedAt =
      Date.now();


    if (typeof dbPut === "function") {

      await dbPut(
        "annualFiles",
        file
      );

    }


    renderAnnualFiles();


    showAnnualMessage(
      "تم حذف المورد"
    );

  };


/* ============================================================
   24) حذف توزيع كامل لمستوى
   ============================================================ */

window.deleteAnnualFile =
  async function(fileId) {

    ensureAnnualState();


    const file =
      state.annualFiles.find(
        item =>
          item.id === fileId
      );


    if (!file) return;


    const confirmed =
      confirm(
        `هل تريد حذف التوزيع السنوي بالكامل؟\n\n${getAnnualLevelName(file.level)}`
      );


    if (!confirmed) return;


    const resources =
      state.annualResources.filter(
        resource =>
          resource.fileId === fileId
      );


    for (const resource of resources) {

      if (typeof dbDelete === "function") {

        try {

          await dbDelete(
            "annualResources",
            resource.id
          );

        } catch (error) {

          console.warn(
            "تعذر حذف المورد:",
            error
          );

        }

      }

    }


    if (typeof dbDelete === "function") {

      try {

        await dbDelete(
          "annualFiles",
          fileId
        );

      } catch (error) {

        console.warn(
          "تعذر حذف التوزيع:",
          error
        );

      }

    }


    state.annualResources =
      state.annualResources.filter(
        resource =>
          resource.fileId !== fileId
      );


    state.annualFiles =
      state.annualFiles.filter(
        item =>
          item.id !== fileId
      );


    renderAnnualFiles();


    showAnnualMessage(
      "تم حذف التوزيع السنوي"
    );

  };


/* ============================================================
   25) تغيير المستوى
   ============================================================ */

function setupAnnualLevelChange() {

  const select =
    document.getElementById(
      "annualPlanLevel"
    );


  if (!select) return;


  /*
     منع إضافة listener أكثر من مرة
  */

  if (
    select.dataset.annualInitialized === "true"
  ) {

    return;

  }


  select.dataset.annualInitialized =
    "true";


  currentAnnualLevel =
    select.value ||
    "1AM";


  select.addEventListener(
    "change",
    function() {

      currentAnnualLevel =
        this.value ||
        "1AM";


      renderAnnualFiles();

    }
  );

}


/* ============================================================
   26) تهيئة التوزيع السنوي
   ============================================================ */

async function initializeAnnualPlan() {

  ensureAnnualState();


  const select =
    document.getElementById(
      "annualPlanLevel"
    );


  if (select) {

    currentAnnualLevel =
      select.value ||
      currentAnnualLevel ||
      "1AM";

  }


  setupAnnualLevelChange();


  renderAnnualFiles();

}


/* ============================================================
   27) تشغيل النظام
   ============================================================ */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeAnnualPlan
  );

} else {

  initializeAnnualPlan();

}


/* ==========================================================================
   نهاية نظام التوزيع السنوي
   ========================================================================== */
/* ============================================================
   14) المذكرات
   ============================================================ */

const memoFileInput =
  document.getElementById(
    "memoFile"
  );


if (memoFileInput) {

  memoFileInput.addEventListener(
    "change",
    () => {

      handleFileUpload(
        memoFileInput,

        document.getElementById(
          "memoLevel"
        ),

        "memos",

        state.memos,

        renderMemosFiles
      );

    }
  );
}


function renderMemosFiles() {

  renderFileList(
    "memosFiles",
    state.memos,
    "memos",
    "deleteMemoFile"
  );
}


window.deleteMemoFile =
  async function (id) {

    if (
      !confirm(
        "حذف المذكرة؟"
      )
    ) {
      return;
    }


    await dbDelete(
      "memos",
      id
    );


    state.memos =
      state.memos.filter(
        f =>
          String(f.id) !==
          String(id)
      );


    renderMemosFiles();


    showToast(
      "تم حذف المذكرة",
      "info"
    );
  };


/* ============================================================
   15) الاختبارات
   ============================================================ */

const examFileInput =
  document.getElementById(
    "examFile"
  );


if (examFileInput) {

  examFileInput.addEventListener(
    "change",
    () => {

      handleFileUpload(
        examFileInput,

        document.getElementById(
          "examLevel"
        ),

        "exams",

        state.exams,

        renderExamsFiles
      );

    }
  );
}


function renderExamsFiles() {

  renderFileList(
    "examsFiles",
    state.exams,
    "exams",
    "deleteExamFile"
  );
}


window.deleteExamFile =
  async function (id) {

    if (
      !confirm(
        "حذف الاختبار؟"
      )
    ) {
      return;
    }


    await dbDelete(
      "exams",
      id
    );


    state.exams =
      state.exams.filter(
        f =>
          String(f.id) !==
          String(id)
      );


    renderExamsFiles();


    showToast(
      "تم حذف الاختبار",
      "info"
    );
  };


/* ============================================================
   16) الوثائق الإدارية
   ============================================================ */

const adminDocumentFileInput =
  document.getElementById(
    "adminDocumentFile"
  );


if (adminDocumentFileInput) {

  adminDocumentFileInput.addEventListener(
    "change",
    () => {

      handleFileUpload(
        adminDocumentFileInput,

        null,

        "documents",

        state.documents,

        renderAdminDocuments
      );

    }
  );
}


function renderAdminDocuments() {

  renderFileList(
    "adminDocumentsList",
    state.documents,
    "documents",
    "deleteAdminDocument"
  );
}


window.deleteAdminDocument =
  async function (id) {

    if (
      !confirm(
        "حذف هذه الوثيقة؟"
      )
    ) {
      return;
    }


    await dbDelete(
      "documents",
      id
    );


    state.documents =
      state.documents.filter(
        f =>
          String(f.id) !==
          String(id)
      );


    renderAdminDocuments();


    showToast(
      "تم حذف الوثيقة",
      "info"
    );
  };
 
  // ==========================================================================
  // 12. الملف المهني للأستاذ (Profile)
  // ==========================================================================
  let activeProfilePhotoUrl = null;

  function updateProfileUI() {
    const p = state.profile;
    if (!p) return;

    const fullName = `${p.firstName || ""} ${p.lastName || ""}`.trim() || "الأستاذ";
    const miniName = document.getElementById("miniName");
    const miniAvatar = document.getElementById("miniAvatar");
    const profileAvatar = document.getElementById("profileAvatar");

    if (miniName) miniName.textContent = fullName;

    const initial = (p.firstName || "أ").charAt(0);
    if (miniAvatar) miniAvatar.textContent = initial;

    if (profileAvatar) {
      if (p.photoBlob) {
        if (activeProfilePhotoUrl) {
          URL.revokeObjectURL(activeProfilePhotoUrl);
          activeProfilePhotoUrl = null;
        }

        let photoUrl = p.photoBlob;
        if (typeof p.photoBlob !== "string") {
          activeProfilePhotoUrl = URL.createObjectURL(p.photoBlob);
          photoUrl = activeProfilePhotoUrl;
        }
        profileAvatar.innerHTML = `<img src="${photoUrl}" alt="صورة الأستاذ">`;
      } else {
        if (activeProfilePhotoUrl) {
          URL.revokeObjectURL(activeProfilePhotoUrl);
          activeProfilePhotoUrl = null;
        }
        profileAvatar.textContent = initial;
      }
    }

    const fieldMap = {
      profileFirstName: "firstName",
      profileLastName: "lastName",
      profileBirth: "birth",
      profileCertificate: "certificate",
      profileFirstAppointment: "firstAppointment",
      profileRank: "rank",
      profileRankDate: "rankDate",
      profileGrade: "grade",
      profileGradeDate: "gradeDate"
    };

    Object.keys(fieldMap).forEach((id) => {
      const input = document.getElementById(id);
      if (input && p[fieldMap[id]] !== undefined) {
        input.value = p[fieldMap[id]];
      }
    });
  }

  const saveProfileBtn = document.getElementById("saveProfileBtn");
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", async () => {
      const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : "";
      };

      state.profile.firstName = getVal("profileFirstName");
      state.profile.lastName = getVal("profileLastName");
      state.profile.birth = getVal("profileBirth");
      state.profile.certificate = getVal("profileCertificate");
      state.profile.firstAppointment = getVal("profileFirstAppointment");
      state.profile.rank = getVal("profileRank");
      state.profile.rankDate = getVal("profileRankDate");
      state.profile.grade = getVal("profileGrade");
      state.profile.gradeDate = getVal("profileGradeDate");

      await dbPut("profile", state.profile);
      updateProfileUI();
      showToast("تم حفظ الملف المهني بنجاح", "success");
    });
  }

  const profilePhotoInput = document.getElementById("profilePhoto");
  if (profilePhotoInput) {
    profilePhotoInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      state.profile.photoBlob = file;
      await dbPut("profile", state.profile);
      updateProfileUI();
      showToast("تم تحديث صورة الملف الشخصي", "success");
    });
  }

  // ==========================================================================
  // 13. الإحصائيات (Statistics)
  // ==========================================================================
  function renderStatistics() {
    let totalStudents = 0;
    state.classes.forEach((c) => (totalStudents += (c.students || []).length));

    const statsStudents = document.getElementById("statsStudents");
    const statsClasses = document.getElementById("statsClasses");
    const statsLogs = document.getElementById("statsLogs");
    const statsSessions = document.getElementById("statsSessions");

    if (statsStudents) statsStudents.textContent = totalStudents;
    if (statsClasses) statsClasses.textContent = state.classes.length;
    if (statsLogs) statsLogs.textContent = state.dailyLogs.length;
    if (statsSessions) statsSessions.textContent = state.schedules.length;

    const classStatsDiv = document.getElementById("classStatistics");
    if (classStatsDiv) {
      if (state.classes.length === 0) {
        classStatsDiv.innerHTML = `<p class="empty-state">لا توجد أقسام لحساب إحصائياتها.</p>`;
      } else {
        classStatsDiv.innerHTML = state.classes
          .map((c) => {
            const count = (c.students || []).length;
            const records = state.monitoring.filter((m) => String(m.classId) === String(c.id) && m.attendance === "absent");
            return `
            <div class="stat-detail-item">
              <span><strong>${escapeHTML(c.name)}</strong> (${count} تلميذ)</span>
              <span>إجمالي الغيابات: <b>${records.length}</b></span>
            </div>`;
          })
          .join("");
      }
    }

    const progPct = Math.min(100, Math.round((state.dailyLogs.length / 100) * 100));
    const statProg = document.getElementById("statisticsProgress");
    if (statProg) statProg.textContent = `${progPct}%`;
  }

  // ==========================================================================
  // 14. النسخ الاحتياطي (Backup & Restore)
  // ==========================================================================
  async function prepareBackupJSON() {
    const backupData = {
      version: 1,
      exportDate: new Date().toISOString(),
      profile: { ...state.profile },
      classes: state.classes,
      schedules: state.schedules,
      monitoring: state.monitoring,
      dailyLogs: state.dailyLogs,
      annualFiles: [],
      memos: [],
      exams: [],
      documents: []
    };

    const convertStoreFiles = async (sourceArray) => {
      const result = [];
      for (const item of sourceArray) {
        const copy = { ...item };
        if (copy.blob && copy.blob instanceof Blob) {
          copy.blob = await blobToBase64(copy.blob);
        }
        result.push(copy);
      }
      return result;
    };

    backupData.annualFiles = await convertStoreFiles(state.annualFiles);
    backupData.memos = await convertStoreFiles(state.memos);
    backupData.exams = await convertStoreFiles(state.exams);
    backupData.documents = await convertStoreFiles(state.documents);

    if (backupData.profile.photoBlob && backupData.profile.photoBlob instanceof Blob) {
      backupData.profile.photoBlob = await blobToBase64(backupData.profile.photoBlob);
    }

    return JSON.stringify(backupData, null, 2);
  }

  const createBackupBtn = document.getElementById("createBackupBtn");
  const quickBackupBtn = document.getElementById("quickBackupBtn");

  async function triggerBackupDownload() {
    try {
      showToast("جاري إعداد النسخة الاحتياطية...", "info");
      const jsonStr = await prepareBackupJSON();
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `نسخة_منصة_الأستاذ_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      showToast("تم تحميل ملف النسخة الاحتياطية بنجاح", "success");
    } catch (err) {
      console.error("خطأ التصدير:", err);
      showToast("فشل إنشاء النسخة الاحتياطية", "error");
    }
  }

  if (createBackupBtn) createBackupBtn.addEventListener("click", triggerBackupDownload);
  if (quickBackupBtn) quickBackupBtn.addEventListener("click", triggerBackupDownload);

  const restoreBackupInput = document.getElementById("restoreBackupInput");
  if (restoreBackupInput) {
    restoreBackupInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!confirm("سيتم استبدال البيانات الحالية بالبيانات الموجودة في الملف. هل تريد المتابعة؟")) {
        restoreBackupInput.value = "";
        return;
      }

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.version) {
          showToast("صيغة ملف النسخة الاحتياطية غير صالحة", "error");
          return;
        }

        for (const store of STORES) {
          await dbClear(store);
        }

        const restoreStoreFiles = (sourceArray) => {
          return sourceArray.map((item) => {
            const copy = { ...item };
            if (copy.blob && typeof copy.blob === "string") {
              copy.blob = base64ToBlob(copy.blob, copy.type);
            }
            return copy;
          });
        };

        const classes = data.classes || [];
        const schedules = data.schedules || [];
        const monitoring = data.monitoring || [];
        const dailyLogs = data.dailyLogs || [];
        const annualFiles = restoreStoreFiles(data.annualFiles || []);
        const memos = restoreStoreFiles(data.memos || []);
        const exams = restoreStoreFiles(data.exams || []);
        const documents = restoreStoreFiles(data.documents || []);

        let profile = data.profile || {};
        if (profile.photoBlob && typeof profile.photoBlob === "string") {
          profile.photoBlob = base64ToBlob(profile.photoBlob, "image/jpeg");
        }

        for (const c of classes) await dbPut("classes", c);
        for (const s of schedules) await dbPut("schedules", s);
        for (const m of monitoring) await dbPut("monitoring", m);
        for (const l of dailyLogs) await dbPut("dailyLogs", l);
        for (const af of annualFiles) await dbPut("annualFiles", af);
        for (const me of memos) await dbPut("memos", me);
        for (const ex of exams) await dbPut("exams", ex);
        for (const doc of documents) await dbPut("documents", doc);
        if (profile.id) await dbPut("profile", profile);

        showToast("تم استعادة البيانات بنجاح! جاري إعادة التحميل...", "success");
        setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        console.error("خطأ الاسترجاع:", err);
        showToast("حدث خطأ أثناء استعادة النسخة الاحتياطية", "error");
      } finally {
        restoreBackupInput.value = "";
      }
    });
  }

  const clearAllDataBtn = document.getElementById("clearAllDataBtn");
  if (clearAllDataBtn) {
    clearAllDataBtn.addEventListener("click", async () => {
      if (confirm("تحذير هام جداً: سيتم مسح جميع بيانات التطبيق نهائياً. هل أنت متأكد؟")) {
        for (const store of STORES) {
          await dbClear(store);
        }
        showToast("تم حذف جميع البيانات المحلية", "info");
        setTimeout(() => window.location.reload(), 1000);
      }
    });
  }

  // ==========================================================================
  // 15. المساعد الذكي المحلي (AI Pedagogical Assistant)
  // ==========================================================================
  const assistantInput = document.getElementById("assistantInput");
  const assistantSendBtn = document.getElementById("assistantSendBtn");
  const assistantMessages = document.getElementById("assistantMessages");

  function appendAiMessage(sender, text) {
    if (!assistantMessages) return;

    const msgDiv = document.createElement("div");
    msgDiv.className = sender === "user" ? "user-message" : "ai-message";
    const formattedText = escapeHTML(text).replace(/\n/g, "<br>");
    msgDiv.innerHTML = `<strong>${sender === "user" ? "أنت" : "المساعد الذكي"}:</strong><p>${formattedText}</p>`;
    assistantMessages.appendChild(msgDiv);
    assistantMessages.scrollTop = assistantMessages.scrollHeight;
  }

  function processAiPrompt(promptText) {
    if (!promptText || !promptText.trim()) return;

    appendAiMessage("user", promptText);

    if (assistantInput) assistantInput.value = "";

    setTimeout(() => {
      let reply = "بناءً على التوجيهات البيداغوجية الرسمية، أرحّب بطلبك. ";
      const lower = promptText.toLowerCase();

      if (lower.includes("مذكرة") || lower.includes("درس")) {
        reply += `إليك هيكلة مذكرة الدرس النموذجية:\n1. الميدان والمركب المستهدف.\n2. وضعية الانطلاق (تشخيصية - 5 د).\n3. مرحلة بناء التعلمات (وضعية المشكلة والأفكار الأساسية - 30 د).\n4. مرحلة إعادة الاستثمار وإدماج الموارد (15 د).`;
      } else if (lower.includes("وضعية") || lower.includes("إدماج")) {
        reply += `مقترح وضعية إدماجية مركبة:\nالسياق: في إطار حملة توعوية بمؤسستك...\nالسندات: نصوص قصيرة وصور توضيحية.\nالتعليمة: صمم منتجاً (مقالاً/ملصقاً) تعتمد فيه على الموارد المدروسة وتبرز حلولاً عملية.`;
      } else if (lower.includes("فرض") || lower.includes("اختبار") || lower.includes("أسئلة")) {
        reply += `نصائح إعداد الاختبار البيداغوجي:\n- الجزء الأول (12 ن): الوضعية الأولى (فهم الموارد) + الوضعية الثانية (تطبيق وتحليل).\n- الجزء الثاني (08 ن): وضعية إدماجية مع مراعاة معايير الوجاهة، الاستعمال السليم لأدوات المادة، والانسجام.`;
      } else if (lower.includes("معالجة") || lower.includes("متعثرين")) {
        reply += `خطة المعالجة التربوية الهادفة:\n1. تشخيص الأخطاء الشائعة وتبويبها حسب النمط.\n2. تشكيل أفواج غير متجانسة للتعلم بالأقران.\n3. تقديم أنشطة متدرجة الصعوبة لتعزيز الثقة ورفع مستوى التحصيل.`;
      } else {
        reply += `يمكنك استغلال المنصة لتنظيم كافة الأنشطة والمذكرات، واختيار الأدوات السريعة الجانبية لإصدار النماذج المقترحة.`;
      }

      appendAiMessage("ai", reply);
    }, 600);
  }

  if (assistantSendBtn) {
    assistantSendBtn.addEventListener("click", () => {
      if (assistantInput) processAiPrompt(assistantInput.value);
    });
  }

  if (assistantInput) {
    assistantInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        processAiPrompt(assistantInput.value);
      }
    });
  }

  document.querySelectorAll("[data-ai-prompt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const prompt = btn.getAttribute("data-ai-prompt");
      if (prompt) processAiPrompt(prompt);
    });
  });

  // ==========================================================================
  // 16. البحث العام والشاشة المنبثقة (Global Search & Modal)
  // ==========================================================================
  const modalOverlay = document.getElementById("modalOverlay");
  const modalContent = document.getElementById("modalContent");
  const modalClose = document.getElementById("modalClose");

  function showModal(title, bodyHTML) {
    if (!modalOverlay || !modalContent) return;
    modalContent.innerHTML = `<h3>${escapeHTML(title)}</h3><div class="modal-body-content">${bodyHTML}</div>`;
    modalOverlay.classList.add("active");
  }

  function closeModal() {
    if (modalOverlay) modalOverlay.classList.remove("active");
  }

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  const globalSearchBtn = document.getElementById("globalSearchBtn");
  if (globalSearchBtn) {
    globalSearchBtn.addEventListener("click", () => {
      showModal("البحث الشامل", `
        <div class="field">
          <input type="text" id="globalSearchInput" placeholder="اكتب اسم تلميذ، درس، أو وثيقة...">
        </div>
        <div id="searchResultsList" class="search-results-list"></div>
      `);

      setTimeout(() => {
        const input = document.getElementById("globalSearchInput");
        const resultsDiv = document.getElementById("searchResultsList");

        if (input && resultsDiv) {
          input.focus();
          input.addEventListener("input", () => {
            const query = input.value.trim().toLowerCase();
            if (!query) {
              resultsDiv.innerHTML = "";
              return;
            }

            let html = "";

            state.classes.forEach((c) => {
              (c.students || []).forEach((st) => {
                const name = `${st.lastName} ${st.firstName}`.toLowerCase();
                if (name.includes(query)) {
                  html += `<div class="search-result-item" data-nav-class="${escapeHTML(c.id)}">
                    <i class="fa-solid fa-user"></i> تلميذ: <strong>${escapeHTML(st.lastName)} ${escapeHTML(st.firstName)}</strong> (${escapeHTML(c.name)})
                  </div>`;
                }
              });
            });

            state.dailyLogs.forEach((log) => {
              if (log.lessonTitle && log.lessonTitle.toLowerCase().includes(query)) {
                html += `<div class="search-result-item" data-nav-view="dailyLogView">
                  <i class="fa-solid fa-book"></i> درس: <strong>${escapeHTML(log.lessonTitle)}</strong> (${escapeHTML(log.date)})
                </div>`;
              }
            });

            resultsDiv.innerHTML = html || `<p class="empty-state">لا توجد نتائج مطابقة لـ "${escapeHTML(query)}"</p>`;

            resultsDiv.querySelectorAll("[data-nav-class]").forEach((item) => {
              item.addEventListener("click", () => {
                const classId = item.getAttribute("data-nav-class");
                if (classId) window.navigateToStudentClass(classId);
              });
            });

            resultsDiv.querySelectorAll("[data-nav-view]").forEach((item) => {
              item.addEventListener("click", () => {
                const viewId = item.getAttribute("data-nav-view");
                if (viewId) window.navigateToView(viewId);
              });
            });
          });
        }
      }, 100);
    });
  }

  window.navigateToStudentClass = function (classId) {
    closeModal();
    switchView("studentsView");
    window.selectClass(classId);
  };

  window.navigateToView = function (viewId) {
    closeModal();
    switchView(viewId);
  };

  // ==========================================================================
  // 17. بدء التشغيل الأولي للتطبيق
  // ==========================================================================
(async () => {
    setupNavigation();
    await loadAllData();
})();
});

 
