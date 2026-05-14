"use strict";

const MATERIALS_URL = "./data/materials.json";

const COURSE_UNITS = {
  "数学Ⅰ": ["数と式", "集合と命題", "2次関数", "図形と計量", "データの分析"],
  "数学A": ["図形の性質", "場合の数と確率", "数学と人間の活動", "整数"],
  "数学Ⅱ": ["式と証明", "複素数と方程式", "図形と方程式", "三角関数", "指数関数・対数関数", "微分法・積分法"],
  "数学B": ["数列", "統計的な推測", "数学と社会生活"],
  "数学Ⅲ": ["極限", "微分法", "積分法"],
  "数学C": ["ベクトル", "平面上の曲線", "複素数平面", "数学的な表現の工夫"],
  "その他": ["その他"]
};

const COURSES = Object.keys(COURSE_UNITS);
const TYPES = ["基礎", "問題演習"];

const LEGACY_CATEGORY_MAP = {
  "数学基礎": { courses: ["その他"], units: ["その他"] },
  "集合・論理": { courses: ["数学Ⅰ"], units: ["集合と命題"] },
  "代数": { courses: ["数学Ⅱ"], units: ["式と証明", "複素数と方程式"] },
  "幾何": { courses: ["数学Ⅰ", "数学A"], units: ["図形と計量", "図形の性質"] },
  "解析": { courses: ["数学Ⅱ", "数学Ⅲ"], units: ["微分法・積分法", "極限", "微分法"] },
  "微分積分": { courses: ["数学Ⅱ", "数学Ⅲ"], units: ["微分法・積分法", "微分法", "積分法"] },
  "線形代数": { courses: ["数学C"], units: ["ベクトル"] },
  "確率統計": { courses: ["数学A", "数学B"], units: ["場合の数と確率", "統計的な推測"] },
  "問題演習": { courses: ["その他"], units: ["その他"], type: ["問題演習"] },
  "その他": { courses: ["その他"], units: ["その他"] }
};

const state = {
  materials: [],
  query: "",
  course: "all",
  unit: "all",
  type: "all"
};

document.addEventListener("DOMContentLoaded", () => {
  const hasMaterialsPage = Boolean(document.getElementById("materialsList"));
  const hasHomeCount = Boolean(document.getElementById("homeMaterialCount"));

  if (!hasMaterialsPage && !hasHomeCount) {
    return;
  }

  if (hasMaterialsPage) {
    setupControls();
  }

  loadMaterials();
});

function setupControls() {
  const searchInput = document.getElementById("keywordSearch");
  const unitSelect = document.getElementById("unitFilter");
  const resetButton = document.getElementById("resetFilters");

  renderCourseButtons();
  renderTypeButtons();
  populateUnitOptions();

  searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    renderMaterials();
  });

  unitSelect.addEventListener("change", (event) => {
    state.unit = event.target.value;
    renderMaterials();
  });

  resetButton.addEventListener("click", () => {
    state.query = "";
    state.course = "all";
    state.unit = "all";
    state.type = "all";
    searchInput.value = "";
    renderCourseButtons();
    populateUnitOptions();
    renderTypeButtons();
    renderMaterials();
  });

  document.getElementById("materialsList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-inline-filter]");
    if (!button) {
      return;
    }

    applyInlineFilter(button.dataset.inlineFilter, button.dataset.value);
  });
}

async function loadMaterials() {
  try {
    const response = await fetch(MATERIALS_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`materials.json could not be loaded: ${response.status}`);
    }

    const data = await response.json();
    state.materials = normalizeMaterials(data);
    renderHomeCount(state.materials.length, true);

    if (document.getElementById("materialsList")) {
      renderCourseButtons();
      populateUnitOptions();
      renderTypeButtons();
      renderMaterials();
    }
  } catch (error) {
    renderHomeCount(null, false);

    const list = document.getElementById("materialsList");
    const emptyMessage = document.getElementById("emptyMessage");
    if (list && emptyMessage) {
      list.innerHTML = "";
      emptyMessage.hidden = false;
      emptyMessage.textContent = "資料データを読み込めませんでした．GitHub Pagesまたはローカルサーバー経由で開いてください．";
      updateCount(0, 0);
    }

    console.error(error);
  }
}

function normalizeMaterials(data) {
  const materials = Array.isArray(data) ? data : data.materials;
  if (!Array.isArray(materials)) {
    return [];
  }

  return materials
    .filter((material) => material && material.title && material.file)
    .map((material) => {
      const legacy = LEGACY_CATEGORY_MAP[material.category] || LEGACY_CATEGORY_MAP["その他"];
      const courses = normalizeCourseArray(material.courses, legacy.courses);
      const units = normalizeUnitArray(material.units, legacy.units);
      const type = normalizeTypeArray(material.type, legacy.type || inferType(material));
      const date = material.date || material.updated || "";

      return {
        title: String(material.title),
        courses,
        units,
        type,
        tags: normalizeStringArray(material.tags),
        description: material.description ? String(material.description) : "",
        date: String(date),
        file: String(material.file),
        category: material.category ? String(material.category) : "",
        level: material.level ? String(material.level) : ""
      };
    })
    .sort((a, b) => getDateTime(b.date) - getDateTime(a.date));
}

function renderCourseButtons() {
  const container = document.getElementById("courseFilter");
  if (!container) {
    return;
  }

  const counts = countByValue("courses", state.materials);
  const buttons = [
    renderFilterButton("course", "all", "すべて", state.course === "all", state.materials.length),
    ...COURSES.map((course) => renderFilterButton("course", course, course, state.course === course, counts.get(course) || 0))
  ];

  container.innerHTML = buttons.join("");
  container.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.course = button.dataset.value;
      state.unit = "all";
      renderCourseButtons();
      populateUnitOptions();
      renderMaterials();
    });
  });
}

function renderTypeButtons() {
  const container = document.getElementById("typeFilter");
  if (!container) {
    return;
  }

  const courseScoped = state.course === "all"
    ? state.materials
    : state.materials.filter((material) => material.courses.includes(state.course));
  const counts = countByValue("type", courseScoped);
  const buttons = [
    renderFilterButton("type", "all", "すべて", state.type === "all", courseScoped.length),
    ...TYPES.map((type) => renderFilterButton("type", type, type, state.type === type, counts.get(type) || 0))
  ];

  container.innerHTML = buttons.join("");
  container.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.type = button.dataset.value;
      renderTypeButtons();
      renderMaterials();
    });
  });
}

function populateUnitOptions() {
  const unitSelect = document.getElementById("unitFilter");
  if (!unitSelect) {
    return;
  }

  const units = getVisibleUnits();
  const scopedMaterials = state.course === "all"
    ? state.materials
    : state.materials.filter((material) => material.courses.includes(state.course));
  const counts = countByValue("units", scopedMaterials);

  if (!units.includes(state.unit)) {
    state.unit = "all";
  }

  unitSelect.innerHTML = [
    '<option value="all">すべての小分類</option>',
    ...units.map((unit) => `<option value="${escapeHtml(unit)}">${escapeHtml(unit)} (${counts.get(unit) || 0})</option>`)
  ].join("");
  unitSelect.value = state.unit;
}

function renderMaterials() {
  const list = document.getElementById("materialsList");
  const emptyMessage = document.getElementById("emptyMessage");
  if (!list || !emptyMessage) {
    return;
  }

  const filtered = getFilteredMaterials();
  updateCount(filtered.length, state.materials.length);
  renderTypeButtons();

  if (filtered.length === 0) {
    list.innerHTML = "";
    emptyMessage.hidden = false;
    return;
  }

  emptyMessage.hidden = true;
  list.innerHTML = filtered.map(renderMaterialCard).join("");
}

function getFilteredMaterials() {
  const query = normalizeText(state.query);

  return state.materials.filter((material) => {
    const matchesCourse = state.course === "all" || material.courses.includes(state.course);
    const matchesUnit = state.unit === "all" || material.units.includes(state.unit);
    const matchesType = state.type === "all" || material.type.includes(state.type);
    const matchesQuery = !query || normalizeText(getSearchText(material)).includes(query);
    return matchesCourse && matchesUnit && matchesType && matchesQuery;
  });
}

function renderMaterialCard(material) {
  const filePath = getPdfPath(material.file);
  const courses = renderPills(material.courses, "course-pill", "course");
  const units = renderPills(material.units, "unit-pill", "unit");
  const type = renderPills(material.type, "type-pill", "type");
  const tags = material.tags.length
    ? renderPills(material.tags, "tag-pill", "tag")
    : '<span class="tag-pill">タグなし</span>';

  return `
    <article class="material-card">
      <div class="material-topline">
        <div class="pill-row course-row" aria-label="大分類">${courses}</div>
        <time datetime="${escapeHtml(material.date)}">${escapeHtml(formatDate(material.date))}</time>
      </div>
      <h3>${escapeHtml(material.title)}</h3>
      <p>${escapeHtml(material.description)}</p>
      <div class="card-actions">
        <a class="material-link" href="${escapeHtml(filePath)}" target="_blank" rel="noopener">PDFを開く</a>
        <a class="material-link" href="${escapeHtml(filePath)}" download>ダウンロード</a>
      </div>
      <div class="classification-grid">
        <div>
          <span class="meta-label">小分類</span>
          <div class="pill-row">${units}</div>
        </div>
        <div>
          <span class="meta-label">種別</span>
          <div class="pill-row">${type}</div>
        </div>
      </div>
      <div class="tag-list" aria-label="タグ">${tags}</div>
    </article>
  `;
}

function renderPills(values, className, filterKind) {
  return values.map((value) => `
    <button class="${className} classification-button" type="button" data-inline-filter="${escapeHtml(filterKind)}" data-value="${escapeHtml(value)}">
      ${escapeHtml(value)}
    </button>
  `).join("");
}

function applyInlineFilter(filterKind, value) {
  const searchInput = document.getElementById("keywordSearch");

  state.query = "";
  state.course = "all";
  state.unit = "all";
  state.type = "all";

  if (filterKind === "course") {
    state.course = value;
  }

  if (filterKind === "unit") {
    state.unit = value;
  }

  if (filterKind === "type") {
    state.type = value;
  }

  if (filterKind === "tag") {
    state.query = value;
  }

  if (searchInput) {
    searchInput.value = state.query;
  }

  renderCourseButtons();
  populateUnitOptions();
  renderTypeButtons();
  renderMaterials();
}

function renderFilterButton(group, value, label, active, count) {
  const pressed = active ? "true" : "false";
  const activeClass = active ? " is-selected" : "";
  const countText = Number.isFinite(count) ? `<span class="filter-count">${count}</span>` : "";
  return `
    <button class="filter-button${activeClass}" type="button" data-group="${escapeHtml(group)}" data-value="${escapeHtml(value)}" aria-pressed="${pressed}">
      ${escapeHtml(label)}${countText}
    </button>
  `;
}

function renderHomeCount(count, loaded) {
  const countElement = document.getElementById("homeMaterialCount");
  const labelElement = document.getElementById("homeMaterialCountLabel");
  if (!countElement || !labelElement) {
    return;
  }

  if (!loaded) {
    countElement.textContent = "--";
    labelElement.textContent = "資料数を読み込み中";
    return;
  }

  countElement.textContent = String(count);
  labelElement.innerHTML = `現在 ${count} 件の資料を<span class="count-emphasis">完全無料で</span>公開中`;
}

function updateCount(filteredCount, totalCount) {
  const count = document.getElementById("materialCount");
  if (!count) {
    return;
  }

  count.textContent = totalCount === filteredCount
    ? `資料数 ${totalCount}件`
    : `資料数 ${filteredCount} / ${totalCount}件`;
}

function getVisibleUnits() {
  if (state.course !== "all") {
    return COURSE_UNITS[state.course] || COURSE_UNITS["その他"];
  }

  return COURSES.flatMap((course) => COURSE_UNITS[course]);
}

function getSearchText(material) {
  return [
    material.title,
    material.description,
    material.date,
    material.file,
    material.category,
    material.level,
    ...material.tags,
    ...material.courses,
    ...material.units,
    ...material.type
  ].join(" ");
}

function countByValue(key, materials) {
  const counts = new Map();
  materials.forEach((material) => {
    material[key].forEach((value) => {
      counts.set(value, (counts.get(value) || 0) + 1);
    });
  });
  return counts;
}

function normalizeCourseArray(value, fallback) {
  const courses = normalizeStringArray(value).filter((course) => COURSES.includes(course));
  return courses.length ? unique(courses) : fallback;
}

function normalizeUnitArray(value, fallback) {
  const knownUnits = new Set(Object.values(COURSE_UNITS).flat());
  const units = normalizeStringArray(value).filter((unit) => knownUnits.has(unit));
  return units.length ? unique(units) : fallback;
}

function normalizeTypeArray(value, fallback) {
  const type = normalizeStringArray(value).filter((item) => TYPES.includes(item));
  return type.length ? unique(type) : fallback;
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (value) {
    return [String(value)];
  }

  return [];
}

function inferType(material) {
  const text = normalizeText([
    material.title,
    material.description,
    material.level,
    ...(Array.isArray(material.tags) ? material.tags : [])
  ].join(" "));
  const base = ["基礎", "入門", "まとめ", "公式", "解説", "ノート"].some((word) => text.includes(normalizeText(word)));
  const practice = ["問題", "演習", "確認テスト", "過去問", "例題", "課題"].some((word) => text.includes(normalizeText(word)));

  if (base && practice) {
    return ["基礎", "問題演習"];
  }

  if (practice) {
    return ["問題演習"];
  }

  return ["基礎"];
}

function getPdfPath(file) {
  if (file.startsWith("../files/")) {
    return file;
  }

  if (file.startsWith("./files/")) {
    return file.replace("./files/", "../files/");
  }

  if (file.startsWith("files/")) {
    return `../${file}`;
  }

  if (file.startsWith("/")) {
    return file;
  }

  return `../files/${file}`;
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "更新日未設定";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function getDateTime(value) {
  const time = new Date(`${value}T00:00:00`).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function normalizeText(value) {
  return String(value).toLocaleLowerCase("ja-JP");
}

function unique(values) {
  return [...new Set(values)];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
